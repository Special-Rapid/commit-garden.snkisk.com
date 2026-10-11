import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { resolve, relative, extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export interface MediaEvidence {
  source: string;
  sha256: string;
  url: string;
  consumers: string[];
  dryRun: { at: string; url: string; mechanism: string; approved: boolean };
  remote: { at: string; url: string; status: number; contentType: string; cacheControl: string };
  switchedAt: string;
  keyApproval?: string;
}
export interface Manifest {
  version: 1;
  assets: MediaEvidence[];
  exceptions: { path: string; sha256: string; approval: string }[];
}
const inputs = ['src', 'public', 'static', 'index.html', 'suspended'];
const mediaExtension = /\.(?:png|jpe?g|gif|webp|svg|avif|ico|mp4|mov|webm|mp3|wav|ogg|flac)(?:[?#].*)?$/i;
const textExtension = /\.(?:tsx?|jsx?|mjs|cjs|css|html|json|txt|xml)$/i;
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const validTime = (time: string) => typeof time === 'string' && /T.*(?:Z|[+-]\d\d:\d\d)$/.test(time) && Number.isFinite(Date.parse(time));
const normalized = (path: string) => typeof path === 'string' && path !== '' && !path.includes('\\') && !path.startsWith('/') && !path.split('/').some(part => part === '..' || part === '.' || part === '');
function signature(bytes: Buffer): boolean {
  const hex = bytes.subarray(0, 12).toString('hex');
  const start = bytes.subarray(0, 512).toString('utf8').trimStart();
  return hex.startsWith('89504e470d0a1a0a') || hex.startsWith('ffd8ff') || /^GIF8[79]a/.test(start)
    || (bytes.subarray(0, 4).toString() === 'RIFF' && /WEBP|WAVE/.test(bytes.subarray(8, 12).toString()))
    || bytes.subarray(4, 8).toString() === 'ftyp' || hex.startsWith('1a45dfa3')
    || /^(?:<\?xml[^>]*>\s*)?<svg\b/i.test(start) || /^(?:ID3|OggS|fLaC)/.test(start)
    || hex.startsWith('00000100') || hex.startsWith('00000200');
}
async function filesUnder(root: string, entry: string, required: boolean): Promise<string[]> {
  const path = join(root, entry);
  for (let parent = dirname(path); parent !== root; parent = dirname(parent)) {
    if (parent === dirname(parent) || (await lstat(parent)).isSymbolicLink()) throw new Error('SYMLINK_REJECTED');
  }
  let info;
  try { info = await lstat(path); } catch (error) {
    if (!required && (error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw new Error('INPUT_MISSING');
  }
  if (info.isSymbolicLink()) throw new Error('SYMLINK_REJECTED');
  if (info.size > 100_000_000) throw new Error('INPUT_SCAN_LIMIT');
  if (info.isFile()) return [entry];
  if (!info.isDirectory()) throw new Error('INPUT_NOT_REGULAR');
  const paths: string[] = [];
  for (const child of (await readdir(path)).sort()) paths.push(...await filesUnder(root, join(entry, child), true));
  return paths;
}
function mediaReferences(text: string): string[] {
  const refs = new Set<string>();
  for (const match of text.matchAll(/https?:\/\/[^\s'"`<>)}]+/g)) {
    if (mediaExtension.test(match[0])) refs.add(match[0]);
  }
  for (const match of text.matchAll(/(?:['"`])([^'"`\s]+\.(?:png|jpe?g|gif|webp|svg|avif|ico|mp4|mov|webm|mp3|wav|ogg|flac)(?:[?#][^'"`\s]*)?)(?:['"`])/gi)) refs.add(match[1]);
  for (const match of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) {
    if (!match[1].startsWith('#')) refs.add(match[1]);
  }
  for (const element of text.matchAll(/<(?:img|video|audio|source)\b[^>]*>/gi)) {
    for (const attribute of element[0].matchAll(/\b(src|poster|srcset)\s*=\s*(['"])(.*?)\2/gi)) {
      if (attribute[1].toLowerCase() === 'srcset') {
        for (const candidate of attribute[3].split(',')) refs.add(candidate.trim().split(/\s+/)[0]);
      } else refs.add(attribute[3]);
    }
  }
  return [...refs];
}

/** 非送信の照合。manifestは保存証跡であり、remoteへ再検証を行うものではない。 */
export async function verifyMedia(rootPath: string, manifest: Manifest, output?: string, builtAt?: string): Promise<string[]> {
  const root = await realpath(rootPath);
  const failures = new Set<string>();
  const fail = (code: string) => failures.add(code);
  if (manifest?.version !== 1 || !Array.isArray(manifest.assets) || !Array.isArray(manifest.exceptions)) return ['MANIFEST_INVALID'];
  const mappings = new Map<string, MediaEvidence>();
  const originals: Buffer[] = [];
  const exceptions = new Map<string, string>();
  for (const exception of manifest.exceptions) {
    if (!exception || !normalized(exception.path) || !/^[a-f0-9]{64}$/.test(exception.sha256) || !exception.approval?.trim() || exceptions.has(exception.path)) { fail('EXCEPTION_INVALID'); continue; }
    exceptions.set(exception.path, exception.sha256);
    if (manifest.assets.some(asset => asset?.sha256 === exception.sha256)) fail('EXCEPTION_CONFLICT');
  }
  for (const asset of manifest.assets) {
    if (!asset || typeof asset.url !== 'string' || !Array.isArray(asset.consumers) || !asset.consumers.length || asset.consumers.some(path => !normalized(path)) || !/^[a-f0-9]{64}$/.test(asset.sha256)) { fail('ASSET_INVALID'); continue; }
    let url: URL;
    try { url = new URL(asset.url); } catch { fail('DESTINATION_INVALID'); continue; }
    const key = url.pathname.split('/').pop() ?? '';
    if (url.origin !== 'https://images.snkisk.com' || url.username || url.password || url.search || url.hash || !/^\/commit-garden\.snkisk\.com\/images\/[^/]+$/.test(url.pathname)
      || !(key.startsWith(`${asset.sha256}.`) || asset.keyApproval?.trim()) || !mediaExtension.test(key)) fail('DESTINATION_INVALID');
    if (mappings.has(asset.url)) fail('DUPLICATE_MAPPING');
    mappings.set(asset.url, asset);
    if (asset.dryRun?.approved !== true || asset.dryRun.mechanism !== 'api.snkisk.com/assets:publish' || asset.dryRun.url !== asset.url) fail('UPLOADER_UNCONFIRMED');
    const expectedMime: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
    if (!expectedMime[extname(key).toLowerCase()] || asset.remote?.url !== asset.url || asset.remote.status !== 200 || asset.remote.contentType !== expectedMime[extname(key).toLowerCase()]
      || !/\bimmutable\b/i.test(asset.remote.cacheControl) || !/\bpublic\b/i.test(asset.remote.cacheControl) || !/\bmax-age=31536000\b/i.test(asset.remote.cacheControl)) fail('REMOTE_UNVERIFIED');
    const times = [asset.dryRun?.at, asset.remote?.at, asset.switchedAt];
    if (times.some(time => !validTime(time)) || Date.parse(times[0]) > Date.parse(times[1]) || Date.parse(times[1]) > Date.parse(times[2])) fail('ORDER_INVALID');
    if (output && (!builtAt || !validTime(builtAt) || Date.parse(asset.switchedAt) > Date.parse(builtAt))) fail('BUILD_ORDER_INVALID');
    try {
      // 原本はserved inputから外す。各祖先のsymlinkも拒否する。
      if (typeof asset.source !== 'string' || !asset.source) throw new Error();
      const source = resolve(root, asset.source);
      const sourceRelative = relative(root, source);
      if (inputs.some(input => sourceRelative === input || sourceRelative.startsWith(`${input}/`)) || sourceRelative.startsWith('dist/')) throw new Error();
      let ancestor = source;
      while (true) {
        if ((await lstat(ancestor)).isSymbolicLink()) throw new Error();
        const parent = resolve(ancestor, '..');
        if (parent === ancestor) break;
        ancestor = parent;
      }
      const sourceInfo = await lstat(source);
      if (!sourceInfo.isFile() || !sourceInfo.size || sourceInfo.size > 99_000_000) throw new Error();
      const bytes = await readFile(source);
      if (!bytes.length || bytes.length > 99_000_000 || digest(bytes) !== asset.sha256 || !signature(bytes)) throw new Error();
      originals.push(bytes);
    } catch { fail('ORIGINAL_UNVERIFIED'); }
  }
  let inputFiles: string[];
  try { inputFiles = (await Promise.all(inputs.map(entry => filesUnder(root, entry, entry === 'src' || entry === 'index.html')))).flat(); } catch { return [...failures, 'INPUT_SCAN_FAILED']; }
  const seenExceptions = new Set<string>();
  const seenConsumers = new Set<string>();
  let outputFiles: string[] = [];
  async function exceptionReference(ref: string, consumer: string, isOutput: boolean): Promise<boolean> {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) return false;
    let decoded: string;
    try { decoded = decodeURIComponent(ref.split(/[?#]/)[0]); } catch { return false; }
    if (!decoded || decoded.includes('\\') || decoded.includes('\0')) return false;
    const candidates = decoded.startsWith('/')
      ? (isOutput ? [join(root, output!, decoded.slice(1))] : ['public', 'static', 'suspended'].map(entry => join(root, entry, decoded.slice(1))))
      : [resolve(root, dirname(consumer), decoded)];
    for (const candidate of candidates) {
      const path = relative(root, candidate);
      if (!normalized(path) || !(isOutput ? outputFiles : inputFiles).includes(path) || !mediaExtension.test(path)) continue;
      const hash = digest(await readFile(candidate));
      if (isOutput ? [...seenExceptions].some(source => exceptions.get(source) === hash) : exceptions.get(path) === hash) return true;
    }
    return false;
  }
  async function scan(path: string, isOutput: boolean) {
    const bytes = await readFile(join(root, path));
    const text = bytes.toString('utf8');
    if (isOutput && mediaExtension.test(path) && [...seenExceptions].some(source => exceptions.get(source) === digest(bytes))) return;
    if (!isOutput && exceptions.has(path)) {
      if (exceptions.get(path) !== digest(bytes)) fail('EXCEPTION_DRIFT');
      seenExceptions.add(path);
      return;
    }
    if (mediaExtension.test(path) || signature(bytes)) fail(isOutput ? 'OUTPUT_LOCAL_MEDIA' : 'INPUT_LOCAL_MEDIA');
    if (originals.some(original => bytes.includes(original) || text.includes(original.toString('base64')) || text.includes(original.toString('hex')))) fail(isOutput ? 'OUTPUT_ORIGINAL_COPY' : 'INPUT_ORIGINAL_COPY');
    if (textExtension.test(extname(path))) {
      if (/data:(?:image|audio|video)\//i.test(text) || /<svg\b/i.test(text)) fail(isOutput ? 'OUTPUT_EMBEDDED_MEDIA' : 'INPUT_EMBEDDED_MEDIA');
      for (const ref of mediaReferences(text)) {
        const mapped = mappings.get(ref);
        if (!mapped) {
          if (!await exceptionReference(ref, path, isOutput)) fail(isOutput ? 'OUTPUT_REFERENCE_UNCLASSIFIED' : 'INPUT_REFERENCE_UNCLASSIFIED');
        }
        else if (!isOutput) {
          if (!mapped.consumers.includes(path)) fail('CONSUMER_UNDECLARED');
          seenConsumers.add(`${ref}\n${path}`);
        }
      }
    }
  }
  for (const path of inputFiles) await scan(path, false);
  try {
    const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 8_000_000 }).split('\0').filter(Boolean);
    for (const path of tracked) {
      const info = await lstat(join(root, path));
      if (!info.isFile() || info.isSymbolicLink()) continue;
      if (info.size > 100_000_000) { fail('INDEX_SCAN_LIMIT'); continue; }
      const bytes = await readFile(join(root, path));
      if (originals.some(original => digest(bytes) === digest(original))) fail('ORIGINAL_TRACKED');
    }
    // working treeとは異なるstaged blobも照合する。
    for (const line of execFileSync('git', ['ls-files', '--stage', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 8_000_000 }).split('\0').filter(Boolean)) {
      const oid = line.split(' ')[1];
      if (!/^[a-f0-9]{40,64}$/.test(oid)) { fail('INDEX_SCAN_FAILED'); continue; }
      const bytes = execFileSync('git', ['cat-file', 'blob', oid], { cwd: root, maxBuffer: 100_000_000 });
      if (originals.some(original => digest(bytes) === digest(original))) fail('ORIGINAL_STAGED');
    }
  } catch { fail('INDEX_SCAN_FAILED'); }
  for (const path of exceptions.keys()) if (!seenExceptions.has(path)) fail('EXCEPTION_MISSING');
  for (const asset of mappings.values()) for (const consumer of asset.consumers) if (!seenConsumers.has(`${asset.url}\n${consumer}`)) fail('CONSUMER_MISSING');
  if (output) {
    if (!builtAt || !validTime(builtAt)) fail('BUILD_ORDER_INVALID');
    if (!normalized(output) || inputs.some(input => output === input || output.startsWith(`${input}/`))) fail('OUTPUT_INVALID');
    else try {
      outputFiles = await filesUnder(root, output, true);
      if (!outputFiles.length) fail('OUTPUT_EMPTY');
      for (const path of outputFiles) await scan(path, true);
    } catch { fail('OUTPUT_SCAN_FAILED'); }
  }
  return [...failures].sort();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  try {
    if (![1, 3].includes(args.length)) throw new Error();
    const manifest = JSON.parse(await readFile(args[0], 'utf8')) as Manifest;
    const failures = await verifyMedia(process.cwd(), manifest, args[1], args[2]);
    console.log(JSON.stringify({ phase: args[1] ? 'delivery' : 'inputs', status: failures.length ? 'BLOCKED' : 'PASS', failures, remoteReverified: false }));
    process.exitCode = failures.length ? 1 : 0;
  } catch {
    console.error('MEDIA_VERIFICATION_FAILED: manifestと入力を確認してください。');
    process.exitCode = 1;
  }
}
