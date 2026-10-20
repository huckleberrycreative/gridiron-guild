import { describe, test, expect } from 'bun:test';
import { deriveStandings } from '../src/lib/standingsFromScores';

const week = (w: number, scores: number[]) =>
  scores.map((score, i) => ({ week: w, teamId: `t${i + 1}`, score }));

describe('deriveStandings', () => {
  test('awards 20/18/16/14/8/4/3/2/1/0 by weekly finish', () => {
    const rows = week(1, [110, 109, 108, 107, 106, 105, 104, 103, 102, 101]);
    const standings = deriveStandings(rows);
    const byId = new Map(standings.map((s) => [s.teamId, s]));
    expect(byId.get('t1')!.points).toBe(20);
    expect(byId.get('t2')!.points).toBe(18);
    expect(byId.get('t3')!.points).toBe(16);
    expect(byId.get('t4')!.points).toBe(14);
    expect(byId.get('t5')!.points).toBe(8);
    expect(byId.get('t6')!.points).toBe(4);
    expect(byId.get('t7')!.points).toBe(3);
    expect(byId.get('t8')!.points).toBe(2);
    expect(byId.get('t9')!.points).toBe(1);
    expect(byId.get('t10')!.points).toBe(0);
  });

  test('top 4 get a W, 5th gets a T, 6th-10th get an L', () => {
    const rows = week(1, [110, 109, 108, 107, 106, 105, 104, 103, 102, 101]);
    const byId = new Map(deriveStandings(rows).map((s) => [s.teamId, s]));
    for (const id of ['t1', 't2', 't3', 't4']) {
      expect(byId.get(id)!.wins).toBe(1);
      expect(byId.get(id)!.losses).toBe(0);
      expect(byId.get(id)!.ties).toBe(0);
    }
    expect(byId.get('t5')!.ties).toBe(1);
    expect(byId.get('t5')!.wins).toBe(0);
    for (const id of ['t6', 't7', 't8', 't9', 't10']) {
      expect(byId.get(id)!.losses).toBe(1);
      expect(byId.get(id)!.wins).toBe(0);
    }
  });

  test('accumulates points, PF and record across weeks and ranks by points then PF', () => {
    const rows = [
      ...week(1, [110, 109, 108, 107, 106, 105, 104, 103, 102, 101]),
      ...week(2, [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]),
    ];
    const standings = deriveStandings(rows);
    const byId = new Map(standings.map((s) => [s.teamId, s]));
    // t1: 1st then 10th -> 20 + 0 = 20 pts, 1-1-0, 211 PF
    expect(byId.get('t1')!.points).toBe(20);
    expect(byId.get('t1')!.wins).toBe(1);
    expect(byId.get('t1')!.losses).toBe(1);
    expect(byId.get('t1')!.pf).toBe(211);
    expect(byId.get('t1')!.avgPPW).toBeCloseTo(105.5);
    // t10: 10th then 1st -> 0 + 20 = 20 pts, same record, but lower PF tiebreak
    expect(byId.get('t10')!.points).toBe(20);
    expect(standings.find((s) => s.teamId === 't1')!.rank).toBeLessThan(
      standings.find((s) => s.teamId === 't10')!.rank
    );
  });

  test('rivalry week 4 gives winners 15 points and a W, losers 0 and an L', () => {
    const rows = [
      { week: 4, teamId: '11111111-0001-0001-0001-000000000006', score: 90 }, // rivalry winner
      { week: 4, teamId: 'tX', score: 130 }, // highest score but not in rivalry
    ];
    const byId = new Map(deriveStandings(rows).map((s) => [s.teamId, s]));
    expect(byId.get('11111111-0001-0001-0001-000000000006')!.points).toBe(15);
    expect(byId.get('11111111-0001-0001-0001-000000000006')!.wins).toBe(1);
    expect(byId.get('tX')!.points).toBe(0);
    expect(byId.get('tX')!.losses).toBe(1);
  });
});
