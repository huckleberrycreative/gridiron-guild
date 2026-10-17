import { describe, expect, test } from 'bun:test';
import { deductionFor } from '@/lib/powerRanksDeductions';

describe('Power Ranks display deductions', () => {
  test('Brock Party keeps its 10-point deduction and its own Hexed poster', () => {
    const d = deductionFor('Austin Area Brock Party');
    expect(d?.amount).toBe(10);
    expect(d?.image).toContain('brock-party-hexed');
  });

  test('Fanatics take a 10-point deduction shown with the uploaded Hexed poster', () => {
    const d = deductionFor('Franklin Fanatics');
    expect(d?.amount).toBe(10);
    expect(d?.image).toContain('fanatics-hexed');
  });

  test('the two deductions point at different posters', () => {
    expect(deductionFor('Franklin Fanatics')?.image).not.toBe(deductionFor('Austin Area Brock Party')?.image);
  });

  test('teams without a penalty are left alone', () => {
    for (const name of ['Nepo Beach Guppies', 'West NY MW Fire Ants', 'American Lurkers']) {
      expect(deductionFor(name)).toBeNull();
    }
  });
});
