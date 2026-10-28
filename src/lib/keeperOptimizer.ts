import { bestLineup } from './seasonSimulation';

export const ANNUAL_CAP = 1000;
export const SEVEN_KEEPER_BUDGET = 600;
export type KeeperPlayer = {
  id: string; name: string; position: string; ppg: number; s27: number;
  practiceSquad?: boolean; deadCap?: number;
};
const PRIME: Record<string, number> = { QB: 32, RB: 26, WR: 29, TE: 30 };
export function nextSeasonPpg(ppg: number, position: string, age: number | null | undefined) {
  if (age == null) return ppg;
  const nextAge = age + 1;
  const prime = PRIME[position] ?? 29;
  const multiplier = nextAge > prime
    ? Math.max(0.45, 1 - (nextAge - prime) * (position === 'RB' ? 0.09 : 0.08))
    : nextAge <= 24 ? 1.08 : nextAge <= 26 ? 1.03 : 1;
  return ppg * multiplier;
}

/** Exact keeper search. Vacant starting slots stay vacant; no invented auction acquisitions. */
export function optimizeKeepers<T extends KeeperPlayer>(roster: T[]) {
  const active = roster.filter(p => !p.practiceSquad).sort((a, b) => a.id.localeCompare(b.id));
  const practiceSquad = roster.filter(p => p.practiceSquad);
  // Broken-tag obligations survive even if the acquired player is not retained.
  const deadCap = roster.reduce((sum, p) => sum + Math.max(0, p.deadCap ?? 0), 0);
  const score = (keepers: T[]) => bestLineup([...keepers, ...practiceSquad].map(p => ({ ...p, projected: true })))
    .reduce((sum, p) => sum + p.ppg, 0);
  let keepers: T[] = [];
  let ppw = score([]);
  let payroll = 0;
  let route: 5 | 7 = 5;
  const selected: T[] = [];
  const consider = (salary: number, candidateRoute: 5 | 7) => {
    const output = score(selected);
    if (output > ppw + 1e-9 || (Math.abs(output - ppw) < 1e-9 &&
      (salary < payroll || (salary === payroll && selected.length > keepers.length)))) {
      keepers = [...selected]; ppw = output; payroll = salary; route = candidateRoute;
    }
  };
  const search = (index: number, salary: number, target: number, candidateRoute: 5 | 7) => {
    if (selected.length === target) { consider(salary, candidateRoute); return; }
    if (active.length - index < target - selected.length) return;
    for (let i = index; i <= active.length - (target - selected.length); i++) {
      const p = active[i];
      const nextSalary = salary + Math.max(0, p.s27);
      if (candidateRoute === 7 && nextSalary > SEVEN_KEEPER_BUDGET) continue;
      selected.push(p);
      search(i + 1, nextSalary, target, candidateRoute);
      selected.pop();
    }
  };
  search(0, 0, Math.min(5, active.length), 5);
  if (active.length >= 7) search(0, 0, 7, 7);
  const ids = new Set(keepers.map(p => p.id));
  const committed = payroll + deadCap;
  const luxuryTax = committed > ANNUAL_CAP;
  const capSpace = ANNUAL_CAP - committed;
  return {
    keepers, practiceSquad, excluded: active.filter(p => !ids.has(p.id)), route,
    ppw, payroll, deadCap, committed, capSpace, luxuryTax,
    draftBudget: luxuryTax ? 9 : Math.max(0, capSpace),
    // Salary utility credits only the selected group and its available auction budget.
    capUtility: ppw + (luxuryTax ? 9 : Math.max(0, capSpace)) * 0.02,
    lineup: bestLineup([...keepers, ...practiceSquad].map(p => ({ ...p, projected: true }))),
  };
}

export function keeperChanges<T extends KeeperPlayer>(before: ReturnType<typeof optimizeKeepers<T>>, after: ReturnType<typeof optimizeKeepers<T>>) {
  const beforeIds = new Set(before.keepers.map(p => p.id));
  const afterIds = new Set(after.keepers.map(p => p.id));
  return {
    added: after.keepers.filter(p => !beforeIds.has(p.id)),
    displaced: before.keepers.filter(p => !afterIds.has(p.id)),
  };
}