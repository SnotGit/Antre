//======= SECTIONS =======

export const ELENA_SECTIONS = ['marsball', 'bestiaire', 'rover', 'terraformars'] as const;
export type ElenaSection = typeof ELENA_SECTIONS[number];

//======= REPORT =======

export interface ElenaReviewEntry {
  file: string;
  reason: string;
}

export interface ElenaLotReport {
  created: number;
  duplicates: number;
  review: ElenaReviewEntry[];
  ignored: number;
}
