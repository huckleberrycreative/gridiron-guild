import { describe, test, expect } from 'bun:test';
import { bestLineup, weeklyLineup, semifinalScore, simulateSeason, rosterRisks, emptySchedule, weeklyFinishPoints, actualPlayerPpg, actualRosterForecast, type SimPlayer } from '../src/lib/seasonSimulation';

const player = (id: string, position: string, ppg: number, nflTeam = 'BUF'): SimPlayer => ({ id, name: id, position, ppg, projected: true, nflTeam });
const roster = [player('Allen', 'QB', 25), player('rb1', 'RB', 15), player('rb2', 'RB', 14), ...Array.from({ length: 6 }, (_, i) => player(`wr${i}`, 'WR', 12 - i))];
const total = (r: SimPlayer[]) => r.reduce((s, p) => s + p.ppg, 0);
describe('roster-aware season odds', () => {
  test('actual weekly player averages override preseason expectations, including zero', () => {
    expect(actualPlayerPpg(14, 25)).toBe(14);
    expect(actualPlayerPpg(0, 25)).toBe(0);
    expect(actualPlayerPpg(null, 25)).toBe(25);
  });
  test('future strength is exactly the best nine actual averages regardless of past team results', () => {
    const before = actualRosterForecast(roster, 'team', 10);
    const after = actualRosterForecast(roster, 'team', 100);
    expect(before.meanPpw).toBe(total(bestLineup(roster)));
    expect(after.meanPpw).toBe(before.meanPpw);
    expect(after.weeklySd).toBe(before.weeklySd);
    expect(after.accumulated).toBe(100);
  });
  test('three stronger starting nines beat the fourth in title odds with otherwise equal conditions', () => {
    const teams = Array.from({ length: 10 }, (_, i) => actualRosterForecast(
      roster.map(p => ({ ...p, nflTeam: null, ppg: p.ppg * (1.3 - i * 0.06) })), `team${i}`, 0));
    const odds = simulateSeason(teams, 5);
    for (const id of ['team0', 'team1', 'team2']) expect(odds[id].champ).toBeGreaterThan(odds.team3.champ);
    expect(odds.team3.champ).toBeGreaterThan(0);
  });
  test('QB injury without a backup costs at least 10 points and leaves the QB slot unfilled', () => {
    const before = total(bestLineup(roster));
    const after = total(bestLineup(roster, new Set(['Allen'])));
    expect(before - after).toBeGreaterThan(10);
    expect(bestLineup(roster, new Set(['Allen'])).some(p => p.position === 'QB')).toBe(false);
  });
  test('a backup QB reduces injury vulnerability', () => {
    const without = rosterRisks(roster, 6, emptySchedule);
    const withBackup = rosterRisks([...roster, player('backup', 'QB', 20)], 6, emptySchedule);
    expect(withBackup.injuryExposure).toBeLessThan(without.injuryExposure);
  });
  test('stacked Buffalo byes remove players in Week 7 but not Week 8', () => {
    expect(total(weeklyLineup(roster, 7, 6))).toBe(0);
    expect(total(weeklyLineup(roster, 8, 6))).toBe(total(bestLineup(roster)));
  });
  test('Arizona and Dallas starters sit Week 14, not Week 15', () => {
    const r = [player('qb', 'QB', 25, 'ARI'), player('wr', 'WR', 20, 'DAL')];
    expect(total(weeklyLineup(r, 14, 6))).toBe(0);
    expect(total(weeklyLineup(r, 15, 6))).toBe(45);
  });
  test('top 2 have best-week semifinal protection; fifth seed uses worst week', () => {
    expect(semifinalScore(1, 80, 150)).toBe(150);
    expect(semifinalScore(2, 80, 150)).toBe(150);
    expect(semifinalScore(3, 80, 150)).toBe(115);
    expect(semifinalScore(4, 80, 150)).toBe(115);
    expect(semifinalScore(5, 80, 150)).toBe(80);
  });
  test('listed injured players return with their full production after the absence', () => {
    const r = [{ ...player('Allen', 'QB', 0), basePpg: 25, out: true, weeksOut: 2 }];
    expect(total(weeklyLineup(r, 8, 8))).toBe(0);
    expect(total(weeklyLineup(r, 9, 8))).toBe(0);
    expect(total(weeklyLineup(r, 10, 8))).toBe(25);
  });
  test('opponent defense changes player projections only on the matching week', () => {
    const schedule = { ...emptySchedule, opponents: { BUF: { 15: 'NYJ' } }, defense: { NYJ: 0.92 } };
    expect(total(weeklyLineup([player('Allen', 'QB', 25)], 15, 6, schedule))).toBe(23);
    expect(total(weeklyLineup([player('Allen', 'QB', 25)], 16, 6, schedule))).toBe(25);
  });
  test('weekly finish points match the current league scale exactly', () => {
    expect(Array.from({ length: 10 }, (_, i) => weeklyFinishPoints(i))).toEqual([20, 18, 16, 14, 8, 4, 3, 2, 1, 0]);
  });
  test('fifth seed can get hot and win, but nonqualifiers cannot win', () => {
    const teams = Array.from({ length: 10 }, (_, i) => ({ id: `team${i}`, meanPpw: 150, accumulated: 100 - i * 5 }));
    const odds = simulateSeason(teams, 13);
    expect(odds.team4.champ).toBeGreaterThan(0);
    expect(odds.team5.champ).toBe(0);
    expect(Object.values(odds).reduce((s, o) => s + o.champ, 0)).toBeCloseTo(100, 6);
    expect(odds.team4.top5).toBe(100);
  });
  test('unchanged scenarios produce identical odds', () => {
    const teams = Array.from({ length: 10 }, (_, i) => ({ id: `team${i}`, meanPpw: 130, accumulated: 30 + i, roster }));
    expect(simulateSeason(teams, 5, emptySchedule, 100)).toEqual(simulateSeason(teams, 5, emptySchedule, 100));
  });
});