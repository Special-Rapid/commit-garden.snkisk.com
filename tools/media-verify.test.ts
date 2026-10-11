import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verifyMedia, type Manifest } from './media-verify.ts';

const png = Buffer.from('89504e470d0a1a0a0000000049454e44ae426082', 'hex');
const sha = createHash('sha256').update(png).digest('hex');
const url = `https://images.snkisk.com/commit-garden.snkisk.com/images/${sha}.png`;
async function fixture(run: (root: string, manifest: Manifest) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'garden-media-'));
  try {
    await mkdir(join(root, 'src'));
    await mkdir(join(root, 'originals'));
    await mkdir(join(root, 'dist'));
    await writeFile(join(root, 'originals/p.png'), png);
    await writeFile(join(root, 'index.html'), '<html></html>');
    await writeFile(join(root, 'src/image.ts'), `export const image = '${url}';`);
    await writeFile(join(root, 'dist/index.html'), `<img src="${url}">`);
    execFileSync('git', ['init', '-q'], { cwd: root });
    const manifest: Manifest = { version: 1, exceptions: [], assets: [{
      source: 'originals/p.png', sha256: sha, url, consumers: ['src/image.ts'],
      dryRun: { at: '2026-10-10T00:00:00Z', url, mechanism: 'api.snkisk.com/assets:publish', approved: true },
      remote: { at: '2026-10-10T01:00:00Z', url, status: 200, contentType: 'image/png', cacheControl: 'public, max-age=31536000, immutable' },
      switchedAt: '2026-10-10T02:00:00Z',
    }] };
    await run(root, manifest);
  } finally { await rm(root, { recursive: true, force: true }); }
}
test('証跡とconsumerと原本が一致した入力・出力を照合する', async () => fixture(async (root, manifest) => {
  assert.deepEqual(await verifyMedia(root, manifest), []);
  assert.deepEqual(await verifyMedia(root, manifest, 'dist', '2026-10-10T03:00:00Z'), []);
}));
test('served directoryのplaceholderと拡張子を変えた素材を拒否する', async () => fixture(async (root, manifest) => {
  await mkdir(join(root, 'public'));
  await writeFile(join(root, 'public/placeholder.bin'), png);
  const failures = await verifyMedia(root, manifest);
  assert.ok(failures.includes('INPUT_LOCAL_MEDIA'));
  assert.ok(failures.includes('INPUT_ORIGINAL_COPY'));
}));
test('原本のbase64とhexの埋込みをclean outputで拒否する', async () => fixture(async (root, manifest) => {
  await writeFile(join(root, 'dist/bundle.js'), `const a='${png.toString('base64')}'; const b='${png.toString('hex')}';`);
  assert.ok((await verifyMedia(root, manifest, 'dist', '2026-10-10T03:00:00Z')).includes('OUTPUT_ORIGINAL_COPY'));
}));
test('未分類URL・相対参照・data URI・inline SVGを拒否する', async () => fixture(async (root, manifest) => {
  await writeFile(join(root, 'src/bad.ts'), `const a='/assets/a.png'; const b='https://example.com/a.png'; const c='data:image/png;base64,AA=='; const d='<svg></svg>';`);
  const failures = await verifyMedia(root, manifest);
  assert.ok(failures.includes('INPUT_REFERENCE_UNCLASSIFIED'));
  assert.ok(failures.includes('INPUT_EMBEDDED_MEDIA'));
}));
test('未登録upload mechanism・未確認remote・順序逆転を拒否する', async () => fixture(async (root, manifest) => {
  manifest.assets[0].dryRun.approved = false;
  manifest.assets[0].remote.status = 403;
  manifest.assets[0].switchedAt = '2026-10-09T00:00:00Z';
  const failures = await verifyMedia(root, manifest);
  assert.ok(failures.includes('UPLOADER_UNCONFIRMED'));
  assert.ok(failures.includes('REMOTE_UNVERIFIED'));
  assert.ok(failures.includes('ORDER_INVALID'));
}));
test('digest・destination・consumer・build時刻の不一致を拒否する', async () => fixture(async (root, manifest) => {
  manifest.assets[0].sha256 = '0'.repeat(64);
  manifest.assets[0].consumers = ['src/other.ts'];
  const failures = await verifyMedia(root, manifest, 'dist', '2026-10-09T00:00:00Z');
  for (const code of ['ORIGINAL_UNVERIFIED', 'DESTINATION_INVALID', 'CONSUMER_UNDECLARED', 'CONSUMER_MISSING', 'BUILD_ORDER_INVALID']) assert.ok(failures.includes(code), code);
}));
test('証跡なしmanifest・原本なし・入力欠落をPASSにしない', async () => fixture(async (root, manifest) => {
  assert.ok((await verifyMedia(root, { version: 1, assets: [], exceptions: [] })).includes('INPUT_REFERENCE_UNCLASSIFIED'));
  await rm(join(root, 'originals/p.png'));
  assert.ok((await verifyMedia(root, manifest)).includes('ORIGINAL_UNVERIFIED'));
  await rm(join(root, 'src'), { recursive: true });
  assert.ok((await verifyMedia(root, manifest)).includes('INPUT_SCAN_FAILED'));
}));
test('例外は明示承認とdigestを必要とし、変更・削除を拒否する', async () => fixture(async (root, manifest) => {
  await mkdir(join(root, 'public'));
  const icon = Buffer.concat([png, Buffer.from('fixture icon')]);
  await writeFile(join(root, 'public/icon.png'), icon);
  manifest.exceptions = [{ path: 'public/icon.png', sha256: createHash('sha256').update(icon).digest('hex'), approval: 'fixture approval' }];
  await writeFile(join(root, 'index.html'), '<link rel="icon" href="/icon.png">');
  assert.deepEqual(await verifyMedia(root, manifest), []);
  await writeFile(join(root, 'dist/icon.png'), icon);
  await writeFile(join(root, 'dist/index.html'), '<img src="/icon.png"><img src="./icon.png">');
  assert.deepEqual(await verifyMedia(root, manifest, 'dist', '2026-10-10T03:00:00Z'), []);
  await writeFile(join(root, 'dist/icon.png'), Buffer.concat([icon, Buffer.from('drift')]));
  assert.ok((await verifyMedia(root, manifest, 'dist', '2026-10-10T03:00:00Z')).includes('OUTPUT_LOCAL_MEDIA'));
  await writeFile(join(root, 'public/icon.png'), 'changed');
  assert.ok((await verifyMedia(root, manifest)).includes('EXCEPTION_DRIFT'));
  await rm(join(root, 'public/icon.png'));
  assert.ok((await verifyMedia(root, manifest)).includes('EXCEPTION_MISSING'));
}));
test('例外参照は存在する承認済みbytesだけに限定する', async () => fixture(async (root, manifest) => {
  const icon = Buffer.concat([png, Buffer.from('icon')]);
  await mkdir(join(root, 'public'));
  await writeFile(join(root, 'public/icon.png'), icon);
  manifest.exceptions = [{ path: 'public/icon.png', sha256: createHash('sha256').update(icon).digest('hex'), approval: 'fixture approval' }];
  for (const ref of ['/missing.png', '/../../originals/p.png', '//evil.example/icon.png', 'https://evil.example/icon.png']) {
    await writeFile(join(root, 'index.html'), `<img src="${ref}">`);
    assert.ok((await verifyMedia(root, manifest)).includes('INPUT_REFERENCE_UNCLASSIFIED'), ref);
  }
}));
test('文字列falseをdry-run承認として扱わない', async () => fixture(async (root, manifest) => {
  manifest.assets[0].dryRun.approved = 'false' as unknown as boolean;
  assert.ok((await verifyMedia(root, manifest)).includes('UPLOADER_UNCONFIRMED'));
}));
test('未対応MIMEのURLとcontentType欠落をPASSにしない', async () => fixture(async (root, manifest) => {
  const avif = url.replace(/\.png$/, '.avif');
  manifest.assets[0].url = avif;
  manifest.assets[0].dryRun.url = avif;
  manifest.assets[0].remote.url = avif;
  manifest.assets[0].remote.contentType = undefined as unknown as string;
  await writeFile(join(root, 'src/image.ts'), `export const image = '${avif}';`);
  assert.ok((await verifyMedia(root, manifest)).includes('REMOTE_UNVERIFIED'));
}));
test('mediaタグの全属性とsrcset候補を確認する', async () => fixture(async (root, manifest) => {
  await writeFile(join(root, 'dist/index.html'), `<video poster="/unclassified" src="${url}"></video>`);
  assert.ok((await verifyMedia(root, manifest, 'dist', '2026-10-10T03:00:00Z')).includes('OUTPUT_REFERENCE_UNCLASSIFIED'));
  await writeFile(join(root, 'dist/index.html'), `<img srcset="${url} 1x, /unclassified 2x">`);
  assert.ok((await verifyMedia(root, manifest, 'dist', '2026-10-10T03:00:00Z')).includes('OUTPUT_REFERENCE_UNCLASSIFIED'));
}));
test('同じbytesを例外とruntime原本に二重分類できない', async () => fixture(async (root, manifest) => {
  await mkdir(join(root, 'public'));
  await writeFile(join(root, 'public/icon.png'), png);
  manifest.exceptions = [{ path: 'public/icon.png', sha256: sha, approval: 'fixture approval' }];
  assert.ok((await verifyMedia(root, manifest)).includes('EXCEPTION_CONFLICT'));
}));
test('symlinkで入力走査を回避できない', async () => fixture(async (root, manifest) => {
  await symlink(join(root, 'originals'), join(root, 'public'));
  assert.ok((await verifyMedia(root, manifest)).includes('INPUT_SCAN_FAILED'));
}));
test('tracked原本とworking treeを書き換えたstaged原本を拒否する', async () => fixture(async (root, manifest) => {
  execFileSync('git', ['add', 'originals/p.png'], { cwd: root });
  let failures = await verifyMedia(root, manifest);
  assert.ok(failures.includes('ORIGINAL_TRACKED'));
  assert.ok(failures.includes('ORIGINAL_STAGED'));
  await writeFile(join(root, 'originals/p.png'), 'changed');
  await writeFile(join(root, 'originals/copy.png'), png);
  manifest.assets[0].source = 'originals/copy.png';
  failures = await verifyMedia(root, manifest);
  assert.ok(!failures.includes('ORIGINAL_TRACKED'));
  assert.ok(failures.includes('ORIGINAL_STAGED'));
}));
