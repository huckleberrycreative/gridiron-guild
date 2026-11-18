import { describe, expect, test } from 'bun:test';
import { CAREERS, CHAMPIONS, ALL_SEASON_ROWS } from '../src/lib/leagueHistory';

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
