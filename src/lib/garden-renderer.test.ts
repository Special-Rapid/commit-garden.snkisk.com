import { describe, expect, it } from 'vitest';
import { createGardenDays, createGardenWeeks, gardenWeekdayAt, selectedGardenPosition } from './garden-renderer';

const days = Array.from({ length: 14 }, (_, index) => ({
  date: `2026-01-${String(index + 1).padStart(2, '0')}`,
  count: index % 4 === 0 ? 0 : index + 1,
  level: 'NONE' as const,
  color: '#000',
  weekday: index % 7,
}));

describe('garden renderer projection', () => {
  it('creates deterministic weekly terrain data from contribution days', () => {
    const first = createGardenWeeks(days, 0);
    const second = createGardenWeeks(days, 0);
    expect(first).toEqual(second);
    expect(first).toHaveLength(53);
    expect(first[0]).toMatchObject({ week: 0, dryRatio: 2 / 7, peakWeekday: 6 });
    expect(first[1]).toMatchObject({ week: 1, dryRatio: 2 / 7, peakWeekday: 6 });
  });

  it('maps a selected day to its calendar week and weekday without changing the scene', () => {
    expect(selectedGardenPosition(0, 1)).toEqual({ week: 0, weekday: 1 });
    expect(selectedGardenPosition(13, 1)).toEqual({ week: 2, weekday: 0 });
    expect(gardenWeekdayAt(.86)).toBe(0);
    expect(gardenWeekdayAt(.56)).toBe(6);
  });

  it('keeps every contribution day in the visual projection, including dry days', () => {
    const projection = createGardenDays(days, 1);
    expect(projection).toHaveLength(days.length);
    expect(projection[0]).toMatchObject({ dry: true, week: 0, weekday: 0 });
    expect(projection[1]).toMatchObject({ dry: false, count: 2, week: 0, weekday: 1 });
  });
});
