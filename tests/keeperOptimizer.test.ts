import { describe, expect, it } from 'bun:test';
import { ANNUAL_CAP, SEVEN_KEEPER_BUDGET, keeperChanges, nextSeasonPpg, optimizeKeepers, type KeeperPlayer } from '../src/lib/keeperOptimizer';
import { calculateDynastyRanks } from '../src/lib/dynastyRanks';

const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'RB', 'WR'];
const roster = (salary = 80): KeeperPlayer[] => positions.map((position, i) => ({ id: `${i}`, name: `Player ${i}`, position, ppg: 10, s27: salary }));
describe('2027 keeper rules', () => {
  it('sets the annual cap to $1,000', () => expect(ANNUAL_CAP).toBe(1000));
  it('allows seven keepers at exactly $600', () => {
    expect(SEVEN_KEEPER_BUDGET).toBe(600);
    const players = roster(); players[0].s27 = 120;
    const plan = optimizeKeepers(players);
    expect(plan.keepers.length).toBe(7); expect(plan.payroll).toBe(600); expect(plan.draftBudget).toBe(400);
  });
  it('rejects the seven-player route above $600', () => {
    const players = roster(); players[0].s27 = 120.1;
    expect(optimizeKeepers(players).keepers.length).toBe(5);
  });
  it('permits five players above $1,000 with luxury-tax exposure', () => {
    const plan = optimizeKeepers(roster(250).slice(0, 5));
    expect(plan.keepers.length).toBe(5); expect(plan.payroll).toBe(1250);
    expect(plan.luxuryTax).toBe(true); expect(plan.draftBudget).toBe(9);
  });
  it('does not trigger luxury tax at exactly $1,000', () => expect(optimizeKeepers(roster(200).slice(0, 5)).luxuryTax).toBe(false));
  it('keeps Practice Squad separate and salary-exempt', () => {
    const plan = optimizeKeepers([...roster(), { id: 'ps', name: 'Rookie', position: 'WR', ppg: 12, s27: 500, practiceSquad: true }]);
    expect(plan.keepers.length).toBe(7); expect(plan.payroll).toBe(560); expect(plan.practiceSquad.length).toBe(1); expect(plan.ppw).toBe(82);
  });
  it('reoptimizes a seven-player setup when an expensive star arrives', () => {
    const players = roster();
    const before = optimizeKeepers(players);
    const after = optimizeKeepers([...players, { id: 'star', name: 'Star', position: 'RB', ppg: 35, s27: 300 }]);
    expect(before.route).toBe(7); expect(after.route).toBe(5); expect(after.ppw - before.ppw).toBe(5);
    expect(keeperChanges(before, after).displaced.length).toBe(3);
    expect(keeperChanges(before, after).added.map(p => p.id)).toEqual(['star']);
  });
  it('adds no benefit for an incoming player outside the keeper group', () => {
    const before = optimizeKeepers(roster());
    const after = optimizeKeepers([...roster(), { id: 'bench', name: 'Bench', position: 'QB', ppg: 1, s27: 300 }]);
    expect(after.ppw).toBe(before.ppw); expect(after.capUtility).toBe(before.capUtility);
    expect(after.keepers.some(p => p.id === 'bench')).toBe(false);
  });
  it('retains broken-tag dead cap even when the incoming player is not kept', () => {
    const plan = optimizeKeepers([...roster(), { id: 'bench', name: 'Bench', position: 'QB', ppg: 1, s27: 180, deadCap: 135 }]);
    expect(plan.deadCap).toBe(135); expect(plan.committed).toBe(695); expect(plan.draftBudget).toBe(305);
  });
  it('optimizes legal lineup output instead of total PPG across redundant QBs', () => {
    const players = roster(200).slice(0, 5);
    const extras = ['a', 'b', 'c'].map(id => ({ id, name: id, position: 'QB', ppg: 20, s27: 200 }));
    const plan = optimizeKeepers([...players, ...extras]);
    expect(plan.keepers.filter(p => p.position === 'QB').length).toBe(2); expect(plan.ppw).toBe(70);
  });
  it('uses salary only to break equal-scoring keeper ties', () => {
    const plan = optimizeKeepers([...roster(200).slice(0, 5), { id: 'cheap', name: 'Cheap', position: 'WR', ppg: 10, s27: 1 }]);
    expect(plan.ppw).toBe(50); expect(plan.payroll).toBe(801);
  });
  it('is deterministic regardless of input order', () => expect(optimizeKeepers(roster()).keepers).toEqual(optimizeKeepers(roster().reverse()).keepers));
  it('shares next-season aging rather than applying present injuries to dynasty output', () => {
    expect(nextSeasonPpg(10, 'RB', 26)).toBeCloseTo(9.1); expect(nextSeasonPpg(10, 'WR', 22)).toBeCloseTo(10.8);
  });
  it('does not inflate dynasty grades with unused roster market values', () => {
    const rows = Array.from({ length: 5 }, (_, t) => roster().map(p => ({ ...p, id: `${t}-${p.id}`, teamId: `${t}`, team: `Team ${t}`, age: null, value: 10 }))).flat();
    const before = calculateDynastyRanks(rows);
    const after = calculateDynastyRanks([...rows, { id: 'spare', name: 'Spare', position: 'QB', ppg: 1, s27: 300, teamId: '0', team: 'Team 0', age: null, value: 100000 }]);
    expect(after.map(t => [t.id, t.grade, t.champ, t.ppw])).toEqual(before.map(t => [t.id, t.grade, t.champ, t.ppw]));
  });
});