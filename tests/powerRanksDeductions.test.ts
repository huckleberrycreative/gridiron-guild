import { describe, expect, test } from 'bun:test';
import { deductionFor } from '@/lib/powerRanksDeductions';

describe('Power Ranks display deductions', () => {
  test('Fanatics take a 25-point deduction shown with the uploaded Hexed poster', () => {
    const d = deductionFor('Franklin Fanatics');
    expect(d?.amount).toBe(25);
    expect(d?.image).toContain('fanatics-hexed');
  });

  test('Austin Area Brock Party carries no deduction', () => {
    expect(deductionFor('Austin Area Brock Party')).toBeNull();
  });

  test('teams without a penalty are left alone', () => {
    for (const name of ['Nepo Beach Guppies', 'West NY MW Fire Ants', 'American Lurkers']) {
      expect(deductionFor(name)).toBeNull();
    }
  });
});
