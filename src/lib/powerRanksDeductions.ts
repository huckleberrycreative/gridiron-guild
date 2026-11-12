import fanaticsHexed from '@/assets/fanatics-hexed.png.asset.json';
import fireAntsHexed from '@/assets/fire-ants-hexed.png.asset.json';

/** Display-only Power Ranks penalty: a grade deduction plus the poster that explains it. */
export type PowerRanksDeduction = { amount: number; image: string; label: string };

const HEXED: { match: RegExp; deduction: PowerRanksDeduction }[] = [
  { match: /fanatics/i, deduction: { amount: 50, image: fanaticsHexed.url, label: 'Fanatics' } },
  { match: /fire\s*ants/i, deduction: { amount: 25, image: fireAntsHexed.url, label: 'Fire Ants' } },
];

/** The team's display-only deduction, or null when they carry none. */
export const deductionFor = (teamName: string): PowerRanksDeduction | null =>
  HEXED.find((h) => h.match.test(teamName))?.deduction ?? null;
