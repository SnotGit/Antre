import { Universe, SearchSection } from './search-filters.service';

export const SECTIONS_BY_UNIVERSE: Record<Universe, Array<{ value: SearchSection; label: string }>> = {
  marsball: [
    { value: 'bestiaire', label: 'Bestiaire' },
    { value: 'rover', label: 'Rover' }
  ],
  terraformars: [],
  archives: [],
  chroniques: []
};
