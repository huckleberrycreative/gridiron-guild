import { describe, expect, test } from 'bun:test';
import { deductionFor } from '@/lib/powerRanksDeductions';

describe('Power Ranks display deductions', () => {
  test('Fanatics take a 50-point deduction shown with the uploaded Hexed poster', () => {
    const d = deductionFor('Franklin Fanatics');
    expect(d?.amount).toBe(50);
    expect(d?.image).toContain('fanatics-hexed');
  });

  test('West NY MW Fire Ants take a 25-point deduction shown with their uploaded Hexed poster', () => {
    const d = deductionFor('West NY MW Fire Ants');
    expect(d?.amount).toBe(25);
    expect(d?.image).toContain('fire-ants-hexed');
  });

  test('Austin Area Brock Party carries no deduction', () => {
    expect(deductionFor('Austin Area Brock Party')).toBeNull();
  });

  test('teams without a penalty are left alone', () => {
    for (const name of ['Nepo Beach Guppies', 'American Lurkers', 'Queen City Harambes']) {
      expect(deductionFor(name)).toBeNull();
    }
  });
});
