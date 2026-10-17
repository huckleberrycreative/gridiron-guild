export type DynastyInput = { id: string; name: string; position: string; ppg: number; s27: number; value: number; teamId: string | null; team: string; age: number | null };
export const CAP = 1000;
const SIMS = 5000;
const PRIME: Record<string, number> = { QB: 32, RB: 26, WR: 29, TE: 30 };

type P = { id: string; name: string; position: string; ppg: number; s27: number; value: number };

// Next-season PPG: age decline past prime, growth for young players
const nextPpg = (r: DynastyInput) => {
  const age = r.age as number | null;
  let m = 1;
  if (age != null) {
    const a = age + 1;
    if (a > PRIME[r.position]) m = Math.max(0.45, 1 - (a - PRIME[r.position]) * (r.position === 'RB' ? 0.09 : 0.08));
    else if (a <= 24) m = 1.08;
    else if (a <= 26) m = 1.03;
  }
  return r.ppg * m;
};

// Best legal nine: QB, RB, RB, WR, WR, 3 FLEX (RB/WR/TE), OP (any)
const bestNine = (list: P[]) => {
  const pool = [...list].sort((a, b) => b.ppg - a.ppg);
  const used = new Set<string>();
  const take = (ok: (p: P) => boolean) => {
    const p = pool.find((x) => !used.has(x.id) && ok(x));
    if (p) used.add(p.id);
    return p?.ppg ?? 0;
  };
  let total = 0;
  total += take((p) => p.position === 'QB');
  total += take((p) => p.position === 'RB') + take((p) => p.position === 'RB');
  total += take((p) => p.position === 'WR') + take((p) => p.position === 'WR');
  for (let i = 0; i < 3; i++) total += take((p) => p.position !== 'QB');
  total += take(() => true);
  return total;
};

export function calculateDynastyRanks(rows: DynastyInput[]) {
    const byTeam = new Map<string, { name: string; players: P[] }>();
    rows.forEach((r) => {
      if (!r.teamId) return;
      const t = byTeam.get(r.teamId) ?? { name: r.team, players: [] };
      t.players.push({ id: r.id, name: r.name, position: r.position, ppg: nextPpg(r), s27: r.s27, value: r.value });
      byTeam.set(r.teamId, t);
    });

    const out = Array.from(byTeam.entries()).map(([id, t]) => {
      // Fit the 2027 roster under the cap: cut worst points-per-dollar players first
      let kept = [...t.players];
      const cut: P[] = [];
      let payroll = kept.reduce((a, p) => a + p.s27, 0);
      while (payroll > CAP && kept.length) {
        kept.sort((a, b) => a.ppg / Math.max(1, a.s27) - b.ppg / Math.max(1, b.s27));
        const worst = kept.find((p) => p.s27 > 1) ?? kept[0];
        kept = kept.filter((p) => p !== worst);
        cut.push(worst);
        payroll -= worst.s27;
      }
      const ppw = bestNine(kept);
      const avgTv = kept.length ? kept.reduce((a, p) => a + p.value, 0) / kept.length : 0;
      return { id, name: t.name, ppw, payroll, space: CAP - payroll, cut, avgTv };
    });

    if (out.length < 5) return [];
    // Strength = projected lineup + small credit for cap space and roster value
    const strength = out.map((t) => t.ppw + Math.max(0, t.space) * 0.02 + t.avgTv * 0.1);
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
