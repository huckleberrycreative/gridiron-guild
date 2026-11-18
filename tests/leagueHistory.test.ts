import { describe, expect, test } from 'bun:test';
import { STATIC_HISTORY } from '../src/lib/leagueHistory';
const { careers: CAREERS, champions: CHAMPIONS, rows: ALL_SEASON_ROWS } = STATIC_HISTORY;

const career = (s: string) => CAREERS.find((c) => c.slug === s)!;

describe('league history', () => {
  test('champions follow the higher finals score', () => {
    expect(CHAMPIONS.map((c) => [c.year, c.champion])).toEqual([
      [2017, 'aicklen'], [2018, 'ben'], [2019, 'james'], [2020, 'dino'], [2021, 'dino'],
      [2022, 'ben'], [2023, 'ben'], [2024, 'ben'], [2025, 'jackson'],
    ]);
  });
  test('title counts', () => {
    expect(career('ben').titles).toBe(4);
    expect(career('dino').titles).toBe(2);
    expect(career('jackson').titles).toBe(1);
  });
  test('Ben career record and points match the sheet', () => {
    expect(`${career('ben').wins}-${career('ben').losses}`).toBe('91-25');
    expect(career('ben').playoffs).toBe(8);
  });
  test('every season has exactly one champion and one runner-up', () => {
    for (const y of [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]) {
      const rows = ALL_SEASON_ROWS.filter((r) => r.year === y);
      expect(rows.filter((r) => r.result === 'Champion').length).toBe(1);
      expect(rows.filter((r) => r.result === 'Runner-Up').length).toBe(1);
    }
  });
});

import { buildHistory } from '../src/lib/leagueHistory';
test('an in-progress season adds record and points but not finishes or playoffs', () => {
  const h = buildHistory([{ year: 2026, weeks: 2, inProgress: true, playoffs: [], entries: [{ gov: 'ben', team: 'X', wins: 2, losses: 0, ties: 0, ap: 38, pf: 300 }] }]);
  const ben = h.careers.find((c) => c.slug === 'ben')!;
  expect(ben.seasons).toBe(10);
  expect(ben.wins).toBe(93);
  expect(ben.playoffs).toBe(8);
  expect(ben.avgRank).toBe(2);
  expect(h.champions.length).toBe(9);
});
