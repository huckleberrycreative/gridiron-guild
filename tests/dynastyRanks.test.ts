import { expect, it } from 'bun:test';
import { coreWeeklyComparison } from '../src/lib/dynastyRanks';

it('compares weekly core output against the mean of optimized league cores', () => {
  const cores = [{ ppw: 80 }, { ppw: 100 }, { ppw: 120 }];
  expect(coreWeeklyComparison(120, cores)).toEqual({ average: 100, aboveAverage: 20 });
  expect(coreWeeklyComparison(80, cores).aboveAverage).toBe(-20);
  expect(coreWeeklyComparison(100, cores).aboveAverage).toBe(0);
});