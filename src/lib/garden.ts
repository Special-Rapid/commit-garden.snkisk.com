import type { ContributionDay } from './types';

export type GardenPlant = 'soil' | 'sprout' | 'grass' | 'flower' | 'bush' | 'tree';

export function plantForContribution(day: Pick<ContributionDay, 'count' | 'level'>): GardenPlant {
  if (day.count === 0) return 'soil';
  if (day.count <= 2) return 'sprout';
  if (day.count <= 5) return 'grass';
  if (day.count <= 10) return 'flower';
  if (day.count <= 20) return 'bush';
  return 'tree';
}

export const gardenLabels: Record<GardenPlant, string> = {
  soil: 'Dry soil', sprout: 'Sprout', grass: 'Grass', flower: 'Flower', bush: 'Bush', tree: 'Tree',
};
