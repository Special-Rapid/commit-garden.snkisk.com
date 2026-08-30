import { plantForContribution, type GardenPlant } from './garden';
import type { ContributionDay } from './types';

export const gardenAssetUrls = {
  soil: 'https://images.snkisk.com/commit-garden.snkisk.com/images/7eff0117603457b9057849df29bed0d5fa44578cc728ad56013b57483d8f7eb2.jpg',
  meadow: 'https://images.snkisk.com/commit-garden.snkisk.com/images/133907ca376aef35e1668be5bf6e56b18b3a54404ecf581a5b5352dfa5a9cd30.jpg',
  shrub: 'https://images.snkisk.com/commit-garden.snkisk.com/images/6e3548fb6b0b355fde7e55e4a52c173a1eccdd4ade8214928ec0744c47211f30.png',
  tree: 'https://images.snkisk.com/commit-garden.snkisk.com/images/feda317a5bf32928b44c6ae5adf9aa6f71c14378ab0cf0c4aa106d1f65d2d1df.png',
} as const;

export type GardenWeek = { activity: number; dryRatio: number; peakWeekday: number; plant: GardenPlant; seed: number; week: number };
export type GardenDay = { activity: number; count: number; dry: boolean; plant: GardenPlant; seed: number; week: number; weekday: number };

export function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seeded(seed: number, offset = 0) {
  const value = Math.sin((seed + offset * 374761393) * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function createGardenWeeks(days: ContributionDay[], leadingBlanks: number): GardenWeek[] {
  const grouped = Array.from({ length: 53 }, () => [] as ContributionDay[]);
  days.forEach((day, index) => grouped[Math.floor((index + leadingBlanks) / 7)]?.push(day));
  const totals = grouped.map((weekDays) => weekDays.reduce((sum, day) => sum + day.count, 0));
  const maximum = Math.max(...totals, 1);

  return grouped.map((weekDays, week) => {
    const total = totals[week] ?? 0;
    const peak = weekDays.reduce((best, day) => day.count > best.count ? day : best, weekDays[0]);
    const average = total / Math.max(weekDays.length, 1);
    return {
      activity: Math.min(1, total / maximum),
      dryRatio: weekDays.filter((day) => day.count === 0).length / Math.max(weekDays.length, 1),
      peakWeekday: peak?.weekday ?? 3,
      plant: plantForContribution({ count: Math.round(average), level: 'NONE' }),
      seed: hashSeed(`${weekDays[0]?.date ?? week}:${total}`),
      week,
    };
  });
}

export function createGardenDays(days: ContributionDay[], leadingBlanks: number): GardenDay[] {
  const maximum = Math.max(...days.map((day) => day.count), 1);
  return days.map((day, index) => ({
    activity: day.count / maximum,
    count: day.count,
    dry: day.count === 0,
    plant: plantForContribution(day),
    seed: hashSeed(day.date),
    week: Math.floor((index + leadingBlanks) / 7),
    weekday: day.weekday,
  }));
}

export function selectedGardenPosition(index: number, leadingBlanks: number) {
  return { week: Math.floor((index + leadingBlanks) / 7), weekday: (index + leadingBlanks) % 7 };
}

export function gardenWeekdayAt(verticalPosition: number) {
  return Math.max(0, Math.min(6, Math.round((.86 - verticalPosition) / .05)));
}
