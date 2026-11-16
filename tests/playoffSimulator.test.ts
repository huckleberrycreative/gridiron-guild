import { describe, expect, test } from 'bun:test';
import { simulatePlayoffs, semiRuleFor } from '../src/lib/playoffSimulator';
import { emptySchedule } from '../src/lib/seasonSimulation';

const team = (id: string, ppg: number) => ({ id, name: id, roster: ['QB','QB','RB','RB','WR','WR','WR','TE','RB','WR'].map((pos, i) => ({ id: `${id}${i}`, name: `${id}${i}`, position: pos, ppg, projected: false })) });

describe('playoff simulator', () => {
  test('seed rules: 1-2 best, 3-4 average, 5 lowest', () => {
    expect([1,2,3,4,5].map(semiRuleFor)).toEqual(['best','best','average','average','lowest']);
    const r = simulatePlayoffs([team('a',15),team('b',15),team('c',15),team('d',15),team('e',15)], emptySchedule, 'x');
    for (const e of r.entries) {
      const [a, b] = [e.weeks[14].score, e.weeks[15].score];
      const want = e.seed <= 2 ? Math.max(a,b) : e.seed <= 4 ? (a+b)/2 : Math.min(a,b);
      expect(e.semiScore).toBeCloseTo(want, 0);
    }
  });
  test('top two semifinal scores advance and the higher Week 16+17 total wins', () => {
    const r = simulatePlayoffs([team('a',10),team('b',20),team('c',12),team('d',18),team('e',14)], emptySchedule, 'y');
    const adv = r.entries.filter(e => e.advanced);
    expect(adv.length).toBe(2);
    const minAdv = Math.min(...adv.map(e => e.semiScore));
    expect(r.entries.filter(e => !e.advanced).every(e => e.semiScore <= minAdv)).toBe(true);
    const champ = adv.find(e => e.champion)!, other = adv.find(e => !e.champion)!;
    expect(champ.finalScore!).toBeGreaterThanOrEqual(other.finalScore!);
    expect(champ.finalScore!).toBeCloseTo(champ.weeks[16].score + champ.weeks[17].score, 0);
  });
});
import { toiletRuleFor } from '../src/lib/playoffSimulator';
test('toilet bowl: seeds 6-7 best, 8-9 average, top two advance', () => {
  expect([6,7,8,9].map(toiletRuleFor)).toEqual(['best','best','average','average']);
  const r = simulatePlayoffs([team('a',12),team('b',12),team('c',12),team('d',12)], emptySchedule, 'z', { firstSeed: 6, ruleFor: toiletRuleFor });
  expect(r.entries.map(e => e.seed)).toEqual([6,7,8,9]);
  expect(r.entries.filter(e => e.advanced).length).toBe(2);
});
