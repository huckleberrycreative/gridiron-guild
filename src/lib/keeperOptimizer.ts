import { bestLineup } from './seasonSimulation';
import { completedDraftLineup, type ReplacementLevels } from './draftReplacement';

export const ANNUAL_CAP = 1000;
export const SEVEN_KEEPER_BUDGET = 600;
export const FRANCHISE_TAG_SALARY = 100;
export const FRANCHISE_TAG_SLOTS = 2;
export type KeeperPlayer = {
  id: string; name: string; position: string; ppg: number; s27: number;
  practiceSquad?: boolean; deadCap?: number;
  franchiseTag?: boolean; tagEligible?: boolean; proposedTag?: boolean; originalSalary?: number;
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

/** Exact keeper search with a fixed, position-aware fall-draft completion baseline. */
export function optimizeKeepers<T extends KeeperPlayer>(roster: T[], replacements?: ReplacementLevels) {
  const active = roster.filter(p => !p.practiceSquad).sort((a, b) => a.id.localeCompare(b.id));
  const practiceSquad = roster.filter(p => p.practiceSquad);
  // Broken-tag obligations survive even if the acquired player is not retained.
  const deadCap = roster.reduce((sum, p) => sum + Math.max(0, p.deadCap ?? 0), 0);
  const lineupFor = (keepers: T[]) => replacements
    ? completedDraftLineup([...keepers, ...practiceSquad], replacements)
    : bestLineup([...keepers, ...practiceSquad].map(p => ({ ...p, projected: true })));
  const score = (keepers: T[]) => lineupFor(keepers).reduce((sum, p) => sum + p.ppg, 0);
  let keepers: (T & { proposedTag?: boolean; originalSalary?: number })[] = [];
  let ppw = Number.NEGATIVE_INFINITY;
  let payroll = 0;
  let route: 5 | 7 = 5;
  const selected: T[] = [];
  const tagAllocation = (players: T[]) => {
    const occupiedTags = [...players, ...practiceSquad].filter(p => p.franchiseTag).length;
    const openTagSlots = Math.max(0, FRANCHISE_TAG_SLOTS - occupiedTags);
    const newTags = [...players].filter(p => !p.franchiseTag && p.tagEligible === true && p.s27 > FRANCHISE_TAG_SALARY)
      .sort((a, b) => b.s27 - a.s27 || a.id.localeCompare(b.id)).slice(0, openTagSlots);
    const taggedIds = new Set(newTags.map(p => p.id));
    const adjusted: (T & { proposedTag?: boolean; originalSalary?: number })[] = players.map(p => taggedIds.has(p.id)
      ? { ...p, s27: FRANCHISE_TAG_SALARY, proposedTag: true, originalSalary: p.s27 }
      : p);
    return { adjusted, salary: adjusted.reduce((sum, p) => sum + Math.max(0, p.s27), 0) };
  };
  const consider = (candidateRoute: 5 | 7) => {
    const { adjusted, salary } = tagAllocation(selected);
    if (candidateRoute === 7 && salary > SEVEN_KEEPER_BUDGET) return;
    const output = score(selected);
    if (output > ppw + 1e-9 || (Math.abs(output - ppw) < 1e-9 &&
      (salary < payroll || (salary === payroll && selected.length > keepers.length)))) {
      keepers = adjusted; ppw = output; payroll = salary; route = candidateRoute;
    }
  };
  const search = (index: number, salary: number, target: number, candidateRoute: 5 | 7) => {
    if (selected.length === target) { consider(candidateRoute); return; }
    if (active.length - index < target - selected.length) return;
    for (let i = index; i <= active.length - (target - selected.length); i++) {
      const p = active[i];
      const nextSalary = salary + Math.max(0, p.s27);
      selected.push(p);
      if (candidateRoute === 7 && tagAllocation(selected).salary > SEVEN_KEEPER_BUDGET) { selected.pop(); continue; }
      search(i + 1, nextSalary, target, candidateRoute);
      selected.pop();
    }
  };
  search(0, 0, Math.min(5, active.length), 5);
  if (active.length >= 7) search(0, 0, 7, 7);
  const ids = new Set(keepers.map(p => p.id));
  const occupiedTags = [...keepers, ...practiceSquad].filter(p => p.franchiseTag).length;
  const openTagSlots = Math.max(0, FRANCHISE_TAG_SLOTS - occupiedTags);
  const committed = payroll + deadCap;
  const luxuryTax = committed > ANNUAL_CAP;
  const capSpace = ANNUAL_CAP - committed;
  const lineup = lineupFor(keepers);
  const draftReplacements = lineup.filter(p => 'replacement' in p && p.replacement === true);
  const replacementPpw = draftReplacements.reduce((sum, p) => sum + p.ppg, 0);
  return {
    keepers, practiceSquad, excluded: active.filter(p => !ids.has(p.id)), route,
    proposedTags: keepers.filter(p => p.proposedTag), occupiedTags, openTagSlots,
    ppw, payroll, deadCap, committed, capSpace, luxuryTax,
    draftReplacements, replacementPpw, retainedPpw: ppw - replacementPpw,
    draftBudget: luxuryTax ? 9 : Math.max(0, capSpace),
    // Salary utility credits only the selected group and its available auction budget.
    capUtility: ppw + (luxuryTax ? 9 : Math.max(0, capSpace)) * 0.02,
    lineup,
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