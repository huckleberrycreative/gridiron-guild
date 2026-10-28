import { expect, it } from 'bun:test';
import { completedDraftLineup, replacementLevels } from '../src/lib/draftReplacement';
import { optimizeKeepers, type KeeperPlayer } from '../src/lib/keeperOptimizer';

const levels = { QB: 15, RB: 10, WR: 10, TE: 8 };
const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'RB', 'WR'];
const players = (n: number): KeeperPlayer[] => positions.slice(0, n).map((position, i) => ({ id: String(i), name: String(i), position, ppg: levels[position], s27: 80 }));

it('fills all nine open starting spots using eligible position averages', () => {
  const lineup = completedDraftLineup([], levels);
  expect(lineup.length).toBe(9);
  expect(lineup.map(p => p.position)).toEqual(['QB', 'RB', 'RB', 'WR', 'WR', 'RB', 'RB', 'RB', 'QB']);
  expect(lineup.reduce((sum, p) => sum + p.ppg, 0)).toBe(100);
});
it('does not penalize five versus seven keepers for missing starting spots', () => {
  const five = optimizeKeepers(players(5), levels);
  const seven = completedDraftLineup(players(7), levels);
  expect(five.ppw).toBe(100); expect(seven.reduce((sum, p) => sum + p.ppg, 0)).toBe(100);
  expect(five.draftReplacements.length).toBe(4);
  expect(seven.filter(p => p.replacement).length).toBe(2);
  expect(five.replacementPpw).toBe(45);
  expect(five.payroll).toBe(400);
});
it('optimizes completed scoring rather than favoring seven weaker retained players', () => {
  const baseline = players(7).map(p => ({ ...p, ppg: 11 }));
  const star = { id: 'star', name: 'Star', position: 'RB', ppg: 30, s27: 300 };
  const plan = optimizeKeepers([...baseline, star], levels);
  expect(plan.route).toBe(5);
  expect(plan.keepers.some(p => p.id === 'star')).toBe(true);
  // 30-point star + four 11-point keepers + three 10-point FLEX fills + 20? No:
  // QB replacement 15 + three eligible replacement fills 10 each = 45.
  expect(plan.ppw).toBe(124);
});
it('averages the position-specific replacement scoring tier, not elite players or Practice Squad', () => {
  const rows = [2, 4, 6, 8, 10, 12, 14, 16].map((ppg, i) => ({ position: 'RB', ppg, teamId: String(i) }));
  const result = replacementLevels([...rows, { position: 'RB', ppg: 100, teamId: 'ps', practiceSquad: true }]);
  expect(result.RB).toBe(6); expect(result.QB).toBe(5);
});
it('uses an unchanged replacement baseline for before-and-after scoring', () => {
  const before = optimizeKeepers(players(5), levels);
  const after = optimizeKeepers(players(5).map(p => p.id === '1' ? { ...p, ppg: p.ppg + 3 } : p), levels);
  expect(after.ppw - before.ppw).toBe(3);
  expect(after.replacementPpw).toBe(before.replacementPpw);
});