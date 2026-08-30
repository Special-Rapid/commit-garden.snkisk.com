import { useEffect, useMemo, useRef, useState } from 'react';
import { createGardenDays, createGardenWeeks, gardenAssetUrls, seeded, selectedGardenPosition } from '../lib/garden-renderer';
import type { ContributionDay } from '../lib/types';

type SceneImages = Partial<Record<keyof typeof gardenAssetUrls, HTMLImageElement>>;
const coverPatchCache = new Map<string, HTMLCanvasElement>();

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, sourceX: number, sourceY: number, sourceSize: number, x: number, y: number, width: number, height: number, alpha: number, seed: number) {
  const cacheKey = [seed, image.naturalWidth, image.naturalHeight, Math.round(sourceX), Math.round(sourceY), Math.round(sourceSize), Math.round(width), Math.round(height)].join(':');
  let patch = coverPatchCache.get(cacheKey);
  if (!patch) {
    if (coverPatchCache.size > 160) coverPatchCache.clear();
    patch = document.createElement('canvas');
    patch.width = Math.max(1, Math.round(width));
    patch.height = Math.max(1, Math.round(height));
    const patchContext = patch.getContext('2d');
    if (!patchContext) return;
    // A cut-out from a photograph should never reveal its rectangular bounds.
    // The irregular silhouette is deterministic, so the same contribution day
    // retains the same small piece of terrain across redraws.
    const centerX = patch.width / 2;
    const centerY = patch.height / 2;
    patchContext.save();
    patchContext.beginPath();
    for (let point = 0; point <= 18; point += 1) {
      const angle = (Math.PI * 2 * point) / 18;
      const radiusX = patch.width * (.43 + seeded(seed, point + 141) * .14);
      const radiusY = patch.height * (.43 + seeded(seed, point + 169) * .14);
      const pointX = centerX + Math.cos(angle) * radiusX;
      const pointY = centerY + Math.sin(angle) * radiusY;
      if (point === 0) patchContext.moveTo(pointX, pointY);
      else patchContext.lineTo(pointX, pointY);
    }
    patchContext.closePath();
    patchContext.clip();
    patchContext.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, patch.width, patch.height);
    patchContext.restore();
    const gradient = patchContext.createRadialGradient(centerX, centerY, Math.min(patch.width, patch.height) * .08, centerX, centerY, Math.max(patch.width, patch.height) * .56);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(.48, 'rgba(0, 0, 0, .88)');
    gradient.addColorStop(.75, 'rgba(0, 0, 0, .45)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    patchContext.globalCompositeOperation = 'destination-in';
    patchContext.fillStyle = gradient;
    patchContext.fillRect(0, 0, patch.width, patch.height);
    coverPatchCache.set(cacheKey, patch);
  }
  context.save();
  context.globalAlpha = alpha;
  context.globalCompositeOperation = 'multiply';
  context.drawImage(patch, x, y, width, height);
  context.restore();
}

function drawPlantAnchor(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, size: number, alpha: number, seed: number) {
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  drawCover(context, image, 0, 0, sourceSize, x, y, size, size, alpha, seed + 303);
}

function drawDryDetail(context: CanvasRenderingContext2D, x: number, y: number, unit: number, seed: number) {
  context.save();
  context.strokeStyle = 'rgba(94, 66, 43, .48)';
  context.lineWidth = Math.max(.7, unit * .035);
  context.lineCap = 'round';
  for (let crack = 0; crack < 2; crack += 1) {
    const startX = x + (seeded(seed, crack + 2) - .5) * unit;
    const startY = y + seeded(seed, crack + 5) * unit * .8;
    context.beginPath();
    context.moveTo(startX, startY);
    for (let segment = 0; segment < 4; segment += 1) context.lineTo(startX + (segment + 1) * unit * .13, startY + (seeded(seed, segment + crack + 8) - .48) * unit * .5);
    context.stroke();
  }
  context.fillStyle = 'rgba(82, 68, 49, .42)';
  context.beginPath();
  context.ellipse(x + seeded(seed, 20) * unit, y + seeded(seed, 21) * unit * .8, unit * .09, unit * .055, seeded(seed, 22), 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawFineGrowth(context: CanvasRenderingContext2D, x: number, ground: number, unit: number, activity: number, seed: number) {
  const blades = Math.max(2, Math.round(3 + activity * 17));
  context.save();
  context.lineCap = 'round';
  for (let blade = 0; blade < blades; blade += 1) {
    const baseX = x + (seeded(seed, blade + 31) - .5) * unit * 1.5;
    const height = unit * (.18 + seeded(seed, blade + 45) * .35) * (.4 + activity);
    context.strokeStyle = `rgba(${58 + Math.round(activity * 44)}, ${105 + Math.round(activity * 60)}, ${46 + Math.round(activity * 38)}, ${.35 + activity * .42})`;
    context.lineWidth = Math.max(.55, unit * .018);
    context.beginPath();
    context.moveTo(baseX, ground);
    context.quadraticCurveTo(baseX + (seeded(seed, blade + 57) - .5) * unit * .3, ground - height * .56, baseX + (seeded(seed, blade + 63) - .5) * unit * .55, ground - height);
    context.stroke();
  }
  if (activity > .24) {
    const flowers = Math.floor(activity * 4);
    for (let flower = 0; flower < flowers; flower += 1) {
      const flowerX = x + (seeded(seed, flower + 70) - .5) * unit * 1.3;
      const flowerY = ground - unit * (.16 + seeded(seed, flower + 74) * .34);
      context.fillStyle = flower % 2 ? 'rgba(247, 212, 103, .88)' : 'rgba(243, 167, 177, .82)';
      for (let petal = 0; petal < 5; petal += 1) {
        const angle = (Math.PI * 2 * petal) / 5;
        context.beginPath();
        context.ellipse(flowerX + Math.cos(angle) * unit * .035, flowerY + Math.sin(angle) * unit * .035, unit * .03, unit * .018, angle, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = 'rgba(126, 90, 36, .9)';
      context.beginPath();
      context.arc(flowerX, flowerY, unit * .019, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function drawScene(canvas: HTMLCanvasElement, days: ContributionDay[], leadingBlanks: number, selected: ContributionDay | null, images: SceneImages) {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width === 0 || bounds.height === 0) return;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(bounds.width * density);
  canvas.height = Math.round(bounds.height * density);
  const context = canvas.getContext('2d');
  if (!context) return;
  context.scale(density, density);
  const width = bounds.width;
  const height = bounds.height;
  const unit = Math.max(8, width / 53);
  const weeks = createGardenWeeks(days, leadingBlanks);
  const gardenDays = createGardenDays(days, leadingBlanks);

  context.fillStyle = '#b78d61';
  context.fillRect(0, 0, width, height);
  if (images.soil) {
    context.save();
    context.globalAlpha = .9;
    context.drawImage(images.soil, 0, 0, images.soil.naturalWidth, images.soil.naturalHeight, 0, 0, width, height);
    context.restore();
  }
  context.fillStyle = 'rgba(255, 248, 225, .12)';
  context.fillRect(0, 0, width, height * .3);

  weeks.forEach((week) => {
    const x = (week.week + .5) * unit;
    const ground = height * (.83 - week.peakWeekday * .035);
    if (week.activity > 0 && images.meadow) {
      const cropSize = Math.min(images.meadow.naturalWidth, images.meadow.naturalHeight) * (.34 + seeded(week.seed, 1) * .16);
      const sourceX = seeded(week.seed, 2) * Math.max(1, images.meadow.naturalWidth - cropSize);
      const sourceY = seeded(week.seed, 3) * Math.max(1, images.meadow.naturalHeight - cropSize);
      const patchWidth = unit * (2.5 + week.activity * 4.8);
      const patchHeight = height * (.18 + week.activity * .4);
      drawCover(context, images.meadow, sourceX, sourceY, cropSize, x - patchWidth / 2, ground - patchHeight, patchWidth, patchHeight, .14 + week.activity * .68, week.seed);
    }
  });

  gardenDays.forEach((day) => {
    const x = (day.week + .5) * unit + (seeded(day.seed, 105) - .5) * unit * .72;
    const ground = height * (.86 - day.weekday * .05);
    if (day.dry) {
      if (seeded(day.seed, 106) > .18) drawDryDetail(context, x - unit * .32, ground - unit * .18, unit * .54, day.seed);
      return;
    }
    drawFineGrowth(context, x, ground, unit * .58, day.activity, day.seed);
  });

  weeks.forEach((week) => {
    const x = (week.week + .5) * unit;
    const ground = height * (.83 - week.peakWeekday * .035);
    if ((week.plant === 'bush' || week.plant === 'tree') && images.shrub) {
      const size = unit * (3.3 + week.activity * 2.8);
      drawPlantAnchor(context, images.shrub, x - size / 2, ground - size * .82, size, .58 + week.activity * .24, week.seed);
    }
    if (week.plant === 'tree' && images.tree) {
      const size = unit * (5.4 + seeded(week.seed, 90) * 2.2);
      drawPlantAnchor(context, images.tree, x - size / 2, ground - size * .94, size, .82, week.seed + 97);
    }
  });

  if (selected) {
    const index = days.findIndex((day) => day.date === selected.date);
    if (index >= 0) {
      const position = selectedGardenPosition(index, leadingBlanks);
      const x = (position.week + .5) * unit;
      const y = height * (.86 - position.weekday * .05);
      context.save();
      context.strokeStyle = 'rgba(255, 250, 225, .96)';
      context.lineWidth = 2;
      context.setLineDash([4, 4]);
      context.beginPath();
      context.arc(x, y - unit * .22, Math.max(10, unit * .55), 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }
}

export function GardenCanvas({ days, leadingBlanks, selected }: { days: ContributionDay[]; leadingBlanks: number; selected: ContributionDay | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<SceneImages>({});
  const imageKey = useMemo(() => Object.values(gardenAssetUrls).join('|'), []);

  useEffect(() => {
    Promise.all(Object.entries(gardenAssetUrls).map(async ([key, url]) => [key, await loadImage(url)] as const)).then((entries) => {
      setImages(Object.fromEntries(entries.filter(([, image]) => image)) as SceneImages);
    });
  }, [imageKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => drawScene(canvas, days, leadingBlanks, selected, images);
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    redraw();
    return () => observer.disconnect();
  }, [days, images, leadingBlanks, selected]);

  return <canvas className="garden-scene" ref={canvasRef} aria-hidden="true" />;
}
