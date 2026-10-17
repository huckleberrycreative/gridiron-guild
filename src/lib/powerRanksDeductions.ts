import brockPartyHexed from '@/assets/brock-party-hexed.png.asset.json';
import fanaticsHexed from '@/assets/fanatics-hexed.png.asset.json';

/** Display-only Power Ranks penalty: a grade deduction plus the poster that explains it. */
export type PowerRanksDeduction = { amount: number; image: string; label: string };

const HEXED: { match: RegExp; deduction: PowerRanksDeduction }[] = [
  { match: /brock party/i, deduction: { amount: 10, image: brockPartyHexed.url, label: 'Brock Party' } },
  { match: /fanatics/i, deduction: { amount: 10, image: fanaticsHexed.url, label: 'Fanatics' } },
];

/** The team's display-only deduction, or null when they carry none. */
export const deductionFor = (teamName: string): PowerRanksDeduction | null =>
  HEXED.find((h) => h.match.test(teamName))?.deduction ?? null;
