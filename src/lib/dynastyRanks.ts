import { ANNUAL_CAP, nextSeasonPpg, optimizeKeepers } from './keeperOptimizer';
export type DynastyInput = { id: string; name: string; position: string; ppg: number; s27: number; value: number; teamId: string | null; team: string; age: number | null; practiceSquad?: boolean };
export const CAP = ANNUAL_CAP;
const SIMS = 5000;
type P = { id: string; name: string; position: string; ppg: number; s27: number; value: number; practiceSquad?: boolean };

/** Compare like-for-like optimized retained lineups, including exempt Practice Squad output. */
export function coreWeeklyComparison(ppw: number, cores: { ppw: number }[]) {
  const average = cores.length ? cores.reduce((sum, core) => sum + core.ppw, 0) / cores.length : 0;
  return { average, aboveAverage: ppw - average };
}

export function calculateDynastyRanks(rows: DynastyInput[]) {
    const byTeam = new Map<string, { name: string; players: P[] }>();
    rows.forEach((r) => {
      if (!r.teamId) return;
      const t = byTeam.get(r.teamId) ?? { name: r.team, players: [] };
      t.players.push({ id: r.id, name: r.name, position: r.position, ppg: nextSeasonPpg(r.ppg, r.position, r.age), s27: r.s27, value: r.value, practiceSquad: r.practiceSquad });
      byTeam.set(r.teamId, t);
    });

    const out = Array.from(byTeam.entries()).map(([id, t]) => {
      const plan = optimizeKeepers(t.players);
      return { id, name: t.name, ...plan, space: plan.capSpace, cut: plan.excluded };
    });

    if (out.length < 5) return [];
    // Rank retained legal lineup output, not market value of players that cannot be kept.
    const strength = out.map((t) => t.ppw);
    // Monte Carlo: 13-week season, top 4 make playoffs, semis + 2-week final
    const champ = new Array(out.length).fill(0);
    const top4 = new Array(out.length).fill(0);
    let seed = 2027;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const gauss = () => Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());
    for (let s = 0; s < SIMS; s++) {
      const talent = strength.map((v) => v + gauss() * 10); // offseason uncertainty
      const season = talent.map((v) => v * 13 + gauss() * 20 * Math.sqrt(13));
      const seeds = season.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, 4).map((x) => x[1]);
      seeds.forEach((i) => top4[i]++);
      const wk = (i: number) => talent[i] + gauss() * 20;
      const sf = seeds.map((i) => [wk(i), i]).sort((a, b) => b[0] - a[0]).slice(0, 2).map((x) => x[1]);
      const final = sf.map((i) => [wk(i) + wk(i), i]).sort((a, b) => b[0] - a[0]);
      champ[final[0][1]]++;
    }
    const maxS = Math.max(...strength), minS = Math.min(...strength);
    return out
      .map((t, i) => ({
        ...t,
        grade: Math.round(60 + ((strength[i] - minS) / Math.max(1, maxS - minS)) * 39),
        playoff: (top4[i] / SIMS) * 100,
        champ: (champ[i] / SIMS) * 100,
      }))
      .sort((a, b) => b.champ - a.champ || b.grade - a.grade);

}
