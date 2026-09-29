import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useTeams, usePlayerSalaries, type PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeftRight, TrendingUp, TrendingDown, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useTradeValues } from '@/hooks/useTradeValues';
import { getTeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import {
  bestLineup,
  normalize,
  toNum,
  salaryImpliedPpg,
  NFL_WEEKS,
  REG_SEASON_WEEKS,
  OUT_STATUSES,
  INJURY_MULTIPLIER,
  usePowerRankRows,
  type Asset as PRAsset,
} from '@/hooks/usePowerRanks';

const injuryLabel: Record<string, string> = {
  questionable: 'Q',
  doubtful: 'D',
  out: 'OUT',
  ir: 'IR',
};

const positionColors: Record<string, string> = {
  QB: 'bg-red-100 text-red-700 border-red-200',
  RB: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WR: 'bg-blue-100 text-blue-700 border-blue-200',
  TE: 'bg-amber-100 text-amber-700 border-amber-200',
};

type Asset = {
  id: string;
  name: string;
  position: string;
  ppg: number;
  projected: boolean;
  franchiseTag: boolean;
  practiceSquad: boolean;
  salary2026: number;
  effectiveSalary: number;
  futureSalary: number;
  healthyPpg: number;
  injuryStatus: string;
  weeksOut: number;
  out: boolean;
};

const lineupTotal = (roster: PRAsset[], excluded?: Set<string>) =>
  bestLineup(roster, excluded).reduce((s, p) => s + p.ppg, 0);

// Value a roster at full health — the dynasty view. A player is only worth
// what he adds to the best legal nine, so a 5th QB is worth ~nothing.
const healthyLineupPpw = (roster: Asset[]) =>
  lineupTotal(roster.map((p) => ({ ...p, ppg: p.healthyPpg })));

// Week-by-week rest-of-season value: injured players re-enter the lineup the
// week they're projected back, so a star missing 6 weeks still carries the
// stretch run.
const restOfSeasonPpw = (roster: Asset[], weeksLeft: number) => {
  if (weeksLeft <= 0) return healthyLineupPpw(roster);
  let sum = 0;
  for (let w = 1; w <= weeksLeft; w++) {
    const pool = roster
      .filter((p) => !(p.out && p.weeksOut >= w))
      .map((p) => ({
        ...p,
        ppg:
          w === 1 && !p.out
            ? p.healthyPpg * (INJURY_MULTIPLIER[p.injuryStatus] ?? 1)
            : p.healthyPpg,
      }));
    sum += lineupTotal(pool);
  }
  return sum / weeksLeft;
};

// Average lineup output across "any one starter is out this week" scenarios —
// this is what real depth buys you.
const injuryAdjustedOutput = (roster: Asset[]) => {
  const healthy = roster.map((p) => ({ ...p, ppg: p.healthyPpg }));
  const starters = bestLineup(healthy);
  if (!starters.length) return 0;
  let sum = 0;
  for (const s of starters) sum += lineupTotal(healthy, new Set([s.id]));
  return sum / starters.length;
};

const capEfficiency = (roster: Asset[]) => {
  const spend = roster.reduce(
    (s, p) => s + p.effectiveSalary + p.futureSalary * 0.25,
    0
  );
  const production = healthyLineupPpw(roster) + injuryAdjustedOutput(roster) * 0.5;
  return production / Math.max(50, spend / 100);
};

const TradeAnalyzer = () => {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: salaries = [], isLoading: salariesLoading } = usePlayerSalaries();
  const [proj, setProj] = useState<Record<string, number>>({});
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  const [selA, setSelA] = useState<Set<string>>(new Set());
  const [selB, setSelB] = useState<Set<string>>(new Set());
  const { rows: powerRows, weeksPlayed } = usePowerRankRows();
  const { byId: tv } = useTradeValues();
  const valueOf = (id: string) => tv.get(id)?.value ?? 0;

  // Open with the first two franchises loaded so there's nothing to pick first.
  useEffect(() => {
    if (teams.length >= 2 && !teamA && !teamB) {
      setTeamA(teams[0].id);
      setTeamB(teams[1].id);
    }
  }, [teams, teamA, teamB]);
  const weeksLeft = Math.max(0, REG_SEASON_WEEKS - weeksPlayed);

  // How much a team should care about this season: playoff odds from the
  // Power Ranks simulation (0 = out of it, 1 = firmly in the hunt).
  // Where each team actually sits: standings place, Power Rank, and the
  // Monte Carlo odds of finishing top 4 from current points + current roster.
  const situationFor = (teamId: string) => {
    const row = powerRows.find((r) => r.team.id === teamId);
    if (!row) return { mode: 'bubble' as const, contention: 0.5, playoff: 50, champ: 0, standRank: 0, prRank: 0, points: 0 };
    const standRank = [...powerRows].sort((a, b) => b.team.totalPoints - a.team.totalPoints).findIndex((r) => r.team.id === teamId) + 1;
    const prRank = powerRows.findIndex((r) => r.team.id === teamId) + 1;
    const playoff = row.odds.top4;
    // Top-4 odds dominate; a sniff of 5th (purgatory) keeps a team half-interested.
    const contention = Math.min(1, Math.max(0, (row.odds.top4 * 0.8 + row.odds.top5 * 0.2) / 100));
    const mode = playoff >= 60 ? ('contender' as const) : playoff <= 25 ? ('rebuild' as const) : ('bubble' as const);
    return { mode, contention, playoff, champ: row.odds.champ, standRank, prRank, points: row.team.totalPoints };
  };
  const contentionFor = (teamId: string) => situationFor(teamId).contention;


  useEffect(() => {
    (async () => {
      try {
        const text = await (await fetch('/data/projections-2026.csv')).text();
        const map: Record<string, number> = {};
        text
          .split(/\r?\n/)
          .slice(1)
          .filter(Boolean)
          .forEach((line) => {
            const cells = line.split(',');
            if (cells.length < 3) return;
            const name = normalize(cells[0].replace(/"/g, ''));
            const fpts = parseFloat(cells[2]);
            if (!name || isNaN(fpts)) return;
            map[name] = fpts / NFL_WEEKS;
          });
        setProj(map);
      } catch {
        setProj({});
      }
    })();
  }, []);

  const toAsset = (s: PlayerSalaryWithDetails): Asset => {
    const name = `${s.firstName} ${s.lastName}`.trim();
    const projected = proj[normalize(name)];
    const salary2026 = toNum(s.salary2026);
    const effectiveSalary = Math.max(
      salary2026,
      toNum(s.salary2027),
      s.franchiseTag ? 100 : 0
    );
    const futureSalary =
      toNum(s.salary2027) + toNum(s.salary2028) + toNum(s.salary2029);
    const healthyPpg = projected ?? salaryImpliedPpg(s.position, effectiveSalary);
    const injuryStatus = s.injuryStatus ?? 'healthy';
    const weeksOut = s.injuryWeeksOut ?? 0;
    const out = OUT_STATUSES.includes(injuryStatus) && weeksOut > 0;
    // Out/IR players keep the value of the weeks they'll be back for;
    // questionable/doubtful players get this week's availability haircut.
    const availability = out
      ? Math.max(0, (REG_SEASON_WEEKS - Math.min(weeksOut, REG_SEASON_WEEKS)) / REG_SEASON_WEEKS)
      : INJURY_MULTIPLIER[injuryStatus] ?? 1;
    return {
      id: s.id,
      name,
      position: s.position,
      ppg: healthyPpg * availability,
      healthyPpg,
      injuryStatus,
      weeksOut,
      out,
      projected: projected != null,
      franchiseTag: s.franchiseTag,
      practiceSquad: s.practiceSquad,
      salary2026,
      effectiveSalary,
      futureSalary,
    };
  };

  const rosters = useMemo(() => {
    const build = (teamId: string) =>
      salaries
        .filter((s) => s.teamId === teamId)
        .map(toAsset)
        .sort((a, b) => valueOf(b.id) - valueOf(a.id) || b.ppg - a.ppg);
    return { A: teamA ? build(teamA) : [], B: teamB ? build(teamB) : [] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaries, teamA, teamB, proj, tv]);

  const evaluate = (roster: Asset[]) => {
    const active = roster.filter((p) => !p.practiceSquad);
    return {
      winNow: restOfSeasonPpw(active, weeksLeft),
      dynasty: healthyLineupPpw(active),
      depth: injuryAdjustedOutput(active),
      cap: capEfficiency(active),
    };
  };

  const analysis = useMemo(() => {
    if (!teamA || !teamB || (selA.size === 0 && selB.size === 0)) return null;

    const outA = rosters.A.filter((p) => selA.has(p.id));
    const outB = rosters.B.filter((p) => selB.has(p.id));

    const afterA = [...rosters.A.filter((p) => !selA.has(p.id)), ...outB];
    const afterB = [...rosters.B.filter((p) => !selB.has(p.id)), ...outA];

    const build = (
      teamId: string,
      before: Asset[],
      after: Asset[],
      gained: Asset[],
      lost: Asset[]
    ) => {
      // Taking back more bodies than you send means cutting your worst active
      // players to make room — those cuts count as value going out.
      const extra = gained.filter((p) => !p.practiceSquad).length - lost.filter((p) => !p.practiceSquad).length;
      const drops =
        extra > 0
          ? after
              .filter((p) => !p.practiceSquad)
              .sort((x, y) => valueOf(x.id) - valueOf(y.id) || x.ppg - y.ppg)
              .slice(0, extra)
          : [];
      const dropIds = new Set(drops.map((p) => p.id));
      after = after.filter((p) => !dropIds.has(p.id));
      const b = evaluate(before);
      const a = evaluate(after);
      const pct = (x: number, y: number) => (y === 0 ? 0 : ((x - y) / y) * 100);
      const parts = {
        winNow: pct(a.winNow, b.winNow),
        dynasty: pct(a.dynasty, b.dynasty),
        depth: pct(a.depth, b.depth),
        cap: pct(a.cap, b.cap),
      };
      // Contenders are graded on this season; teams out of the race are graded
      // on the long-term roster.
      const contention = contentionFor(teamId);
      const wWinNow = 0.1 + 0.8 * contention;
      const overall =
        (parts.winNow * wWinNow + parts.dynasty * (1 - wWinNow)) * 0.72 +
        parts.depth * 0.14 +
        parts.cap * 0.14;
      const winNowPpw = a.winNow - b.winNow;
      const dynastyPpw = a.dynasty - b.dynasty;
      const salaryDelta =
        gained.reduce((s, p) => s + p.effectiveSalary, 0) -
        lost.reduce((s, p) => s + p.effectiveSalary, 0);
      const futureDelta =
        gained.reduce((s, p) => s + p.futureSalary, 0) -
        lost.reduce((s, p) => s + p.futureSalary, 0);
      const counts: Record<string, { before: number; after: number }> = {};
      for (const pos of ['QB', 'RB', 'WR', 'TE']) {
        counts[pos] = {
          before: before.filter((p) => p.position === pos).length,
          after: after.filter((p) => p.position === pos).length,
        };
      }
      // Trade Value Chart: best asset counts fully, extras count less, so
      // three nickels don't automatically beat a quarter.
      const pkg = (xs: Asset[]) =>
        xs
          .map((p) => valueOf(p.id))
          .sort((x, y) => y - x)
          .reduce((s, v, i) => s + v * Math.pow(0.6, i), 0);
      const valueIn = pkg(gained);
      const valueOut = pkg([...lost, ...drops]);
      const valueScore = ((valueIn - valueOut) / Math.max(valueIn, valueOut, 1)) * 100;
      // Headline grade is a % change, same scale as the Power Ranks-based grade.
      // Trade value gap maps onto that scale (a 100% value gap ≈ 15%).
      const fitScore = overall;
      // Long-term trade value matters more to teams whose season is slipping away.
      const valueWeight = 0.6 + 0.8 * (1 - contention);
      const score = Math.round((overall * 0.5 + valueScore * 0.15 * 0.5 * valueWeight) * 10) / 10;
      const situation = situationFor(teamId);
      const ppgDelta =
        gained.reduce((s, p) => s + p.healthyPpg, 0) -
        lost.reduce((s, p) => s + p.healthyPpg, 0);
      // Roster context: does the best incoming player actually start here,
      // and is he covering an injury hole?
      const remaining = before.filter(
        (p) => !p.practiceSquad && !lost.some((l) => l.id === p.id)
      );
      const bestIn = [...gained]
        .filter((p) => !p.practiceSquad)
        .sort((a, b) => valueOf(b.id) - valueOf(a.id))[0];
      let starterIn: { p: Asset; over: Asset | null; hurt: Asset | null; bump: number } | null = null;
      if (bestIn) {
        const samePos = remaining
          .filter((p) => p.position === bestIn.position)
          .sort((a, b) => b.healthyPpg - a.healthyPpg);
        const cur = samePos[0] ?? null;
        const hurt = samePos.find((p) => p.out) ?? null;
        const bump = cur ? bestIn.healthyPpg - cur.healthyPpg : bestIn.healthyPpg;
        if (!cur || bestIn.healthyPpg >= cur.healthyPpg * 0.9 || hurt) {
          starterIn = { p: bestIn, over: cur, hurt, bump };
        }
      }
      const eliteOut =
        [...lost].sort((a, b) => valueOf(b.id) - valueOf(a.id))[0] ?? null;
      return {
        parts,
        overall,
        winNowPpw,
        dynastyPpw,
        contention,
        situation,
        salaryDelta,
        futureDelta,
        counts,
        gained,
        lost,
        drops,
        ppgDelta,
        valueIn,
        valueOut,
        valueScore,
        fitScore,
        score,
        starterIn,
        eliteOut,
      };
    };

    return {
      A: build(teamA, rosters.A, afterA, outB, outA),
      B: build(teamB, rosters.B, afterB, outA, outB),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosters, selA, selB, teamA, teamB, powerRows, weeksLeft, tv]);

  const isLoading = teamsLoading || salariesLoading;
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? 'Team';

  const toggle = (side: 'A' | 'B', id: string) => {
    const setter = side === 'A' ? setSelA : setSelB;
    setter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const valueTone = (v: number) =>
    v >= 80 ? 'bg-emerald-600 text-white' : v >= 60 ? 'bg-emerald-100 text-emerald-800' : v >= 40 ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground';

  const renderColumn = (side: 'A' | 'B') => {
    const value = side === 'A' ? teamA : teamB;
    const setValue = side === 'A' ? setTeamA : setTeamB;
    const setSel = side === 'A' ? setSelA : setSelB;
    const sel = side === 'A' ? selA : selB;
    const roster = side === 'A' ? rosters.A : rosters.B;
    const other = side === 'A' ? teamB : teamA;

    return (
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {teams.map((t) => {
              const logo = getTeamLogo(t.name);
              const on = t.id === value;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={t.id === other}
                  title={t.name}
                  onClick={() => {
                    setValue(t.id);
                    setSel(new Set());
                  }}
                  className={cn(
                    'h-9 w-9 rounded-md border flex items-center justify-center transition',
                    on ? 'border-primary ring-2 ring-primary bg-background' : 'border-transparent hover:bg-background',
                    t.id === other && 'opacity-25 cursor-not-allowed'
                  )}
                >
                  {logo ? <img src={logo} alt={t.name} className="h-7 w-7 object-contain" /> : <span className="text-[10px] font-bold">{t.name.slice(0, 3)}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <h2 className="font-display font-bold uppercase tracking-wide text-sm truncate">{teamName(value)}</h2>
            <span className="text-xs text-muted-foreground shrink-0">{sel.size} selected</span>
          </div>
        </div>

        <ul className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
          {roster.map((p) => {
            const active = sel.has(p.id);
            const v = valueOf(p.id);
            return (
              <li key={p.id}>
                <label
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 text-sm cursor-pointer transition-colors',
                    active ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                >
                  <Checkbox checked={active} onCheckedChange={() => toggle(side, p.id)} />
                  <span className={cn('inline-flex w-7 justify-center rounded text-[10px] font-bold border shrink-0', positionColors[p.position])}>
                    {p.position}
                  </span>
                  <span className="font-medium truncate">{p.name}</span>
                  <span title="Trade value (0–100)" className={cn('rounded px-1.5 text-[11px] font-bold tabular-nums shrink-0', valueTone(v))}>
                    {v}
                  </span>
                  {p.franchiseTag && <span title="Franchise tag" className="rounded bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">F</span>}
                  {p.practiceSquad && <span className="text-[10px] uppercase text-muted-foreground">PS</span>}
                  {p.injuryStatus !== 'healthy' && (
                    <span className={cn('rounded px-1 text-[9px] font-bold uppercase border', p.out ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200')}>
                      {injuryLabel[p.injuryStatus] ?? p.injuryStatus}
                      {p.out && p.weeksOut ? ` ${p.weeksOut}w` : ''}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground w-12 text-right shrink-0">{p.ppg.toFixed(1)}</span>
                  <span className="font-mono text-[11px] text-muted-foreground w-10 text-right shrink-0">${p.effectiveSalary}</span>
                </label>
              </li>
            );
          })}
          {roster.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground text-center">No rostered players.</li>}
        </ul>
      </div>
    );
  };

  type Result = NonNullable<typeof analysis>['A'];
  const names = (xs: Asset[]) => (xs.length ? xs.map((p) => p.name).join(', ') : 'nothing');

  const ord = (n: number) => { const t = n % 100; const suf = t >= 11 && t <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'; return `${n}${suf}`; };

  const cases = (r: Result) => {
    const bestIn = [...r.gained].sort((a, b) => valueOf(b.id) - valueOf(a.id))[0];
    const bestOut = [...r.lost].sort((a, b) => valueOf(b.id) - valueOf(a.id))[0];
    const injuredIn = r.gained.find((p) => p.out);
    const age = (p?: Asset) => (p ? tv.get(p.id)?.age ?? null : null);
    const youngIn = r.gained.filter((p) => (age(p) ?? 99) <= 25 && valueOf(p.id) >= 55);
    const s = r.situation;
    const odds = Math.round(s.playoff);
    const where = `${ord(s.standRank)} in the standings with ${Math.round(s.points)} points, ${ord(s.prRank)} on the Power Ranks, ${odds}% playoff odds in our simulation`;
    const valueDiff = Math.abs(Math.round(r.valueIn) - Math.round(r.valueOut));
    const buying = r.valueIn > r.valueOut;
    const lineupUp = r.winNowPpw > 0.3;
    const lineupDown = r.winNowPpw < -0.3;

    // Deterministic variety: same trade reads the same, different trades read differently.
    const seedStr = `${s.standRank}-${s.prRank}-${Math.round(s.points)}|${r.gained.map((p) => p.id).sort().join(',')}|${r.lost.map((p) => p.id).sort().join(',')}`;
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
    const pick = (variants: string[], salt: number) => variants[(h + salt * 7919) % variants.length];

    const st = r.starterIn;
    const eo = r.eliteOut;
    const sellingStarForDepth =
      !!eo && valueOf(eo.id) >= 65 && r.gained.length > r.lost.length;

    let bull: string;
    let bear: string;

    // Roster-specific reads take priority over generic standings talk.
    if (st?.hurt) {
      bull = pick([
        `${st.p.name} isn't a stash — he starts tomorrow, and with ${st.hurt.name} sidelined you need him to.`,
        `With ${st.hurt.name} in street clothes, ${st.p.name} isn't depth — he's your starter the moment the trade clears.`,
        `This is really about the ${st.hurt.name} hole — ${st.p.name} plugs it immediately, no waiting around.`,
      ], 1);
    } else if (st && st.bump > 1.5) {
      bull = pick([
        `${st.p.name} walks straight in as your best ${st.p.position} — about ${st.bump.toFixed(1)} more points a week from that slot.`,
        `Your ${st.p.position} room gets a real upgrade: ${st.p.name} is worth roughly ${st.bump.toFixed(1)} more points a week than what you're rolling out now.`,
        `${st.p.name} doesn't sit — he takes over the ${st.p.position} spot and adds about ${st.bump.toFixed(1)} points a week to your lineup.`,
      ], 2);
    } else if (s.mode === 'rebuild') {
      bull = youngIn.length
        ? pick([
            `At ${where}, this season is a sunk cost — ${youngIn.map((p) => p.name).join(' and ')} is exactly the kind of young piece a rebuild is built around.`,
            `The standings say ${where}, so the only wins that matter are in 2027 — ${youngIn.map((p) => p.name).join(' and ')} is that kind of win.`,
            `You're ${where}; the playoffs are someone else's problem. ${youngIn.map((p) => p.name).join(' and ')} is the kind of asset that makes next season yours.`,
          ], 3)
        : buying
          ? pick([
              `At ${where}, stacking future value is the job, and this deal adds ${valueDiff} points of it.`,
              `A team at ${where} should be hoarding value — this banks ${valueDiff} points of it.`,
              `This adds ${valueDiff} points of long-term value to a team sitting ${where} — that's the whole game right now.`,
            ], 4)
          : lineupDown
            ? pick([
                `At ${where}, losing a few points a week costs you almost nothing — the Toilet Bowl doesn't care.`,
                `You're ${where}; a slightly worse Sunday lineup is a small price for a better 2027.`,
              ], 5)
            : pick([
                `At ${where}, any move that doesn't cost you future assets is a free swing.`,
                `With your season at ${where}, there's no such thing as a risky trade — only missed ones.`,
              ], 6);
      bear = lineupUp && !buying
        ? pick([
            `You'd be paying future value for ${r.winNowPpw.toFixed(1)} points a week on a team the simulation gives ${odds}% odds — that's decorating a house you're about to sell.`,
            `${r.winNowPpw.toFixed(1)} extra points a week doesn't change a ${odds}% playoff picture — it just costs you pieces you'll want next year.`,
            `Spending future assets to win more games at ${odds}% odds is how rebuilds stay rebuilds.`,
          ], 7)
        : bestOut && valueOf(bestOut.id) >= 60 && (age(bestOut) ?? 99) <= 26
          ? pick([
              `${bestOut.name} is young enough to still be here when you're good again — rebuilds shouldn't ship out the foundation.`,
              `Trading ${bestOut.name} now means watching him anchor someone else's contender while you're still rebuilding.`,
            ], 8)
          : injuredIn
            ? pick([
                `${injuredIn.name} is out about ${injuredIn.weeksOut} more week${injuredIn.weeksOut === 1 ? '' : 's'}, though for a team playing for 2027 that matters less than it looks.`,
                `You're buying ${injuredIn.name} on the injury discount — fine for a rebuild, as long as the ~${injuredIn.weeksOut}-week wait is priced in.`,
              ], 9)
            : pick([
                `A ${odds}% team can still get hot — if you believe the roster is better than the standings, selling now locks in the bad start.`,
                `Standings in September lie sometimes; sell now and you've made the bad start permanent.`,
              ], 10);
    } else if (s.mode === 'contender') {
      bull = lineupUp
        ? pick([
            `At ${where}, the only thing that matters is December — and this adds ${r.winNowPpw.toFixed(1)} points a week to your starting lineup.`,
            `You're built to win now (${where}), and this makes your best nine ${r.winNowPpw.toFixed(1)} points better every single week.`,
            `Contenders buy points, and this buys ${r.winNowPpw.toFixed(1)} a week — no waiting, no projecting.`,
          ], 11)
        : buying
          ? pick([
              `You're a contender (${where}) and still walking away with ${valueDiff} more points of value — rare to get richer and stay dangerous.`,
              `Most contenders mortgage the future; you'd be adding ${valueDiff} points of value while staying in the hunt.`,
            ], 12)
          : pick([
              `A ${odds}% playoff team can afford to spend a little future to smooth out the present.`,
              `At ${odds}% playoff odds, you've earned the right to buy — depth now is insurance in December.`,
            ], 13);
      bear = lineupDown
        ? pick([
            `You'd be giving back ${Math.abs(r.winNowPpw).toFixed(1)} points a week in the middle of a title push — contenders don't sell starters for prospects.`,
            `Losing ${Math.abs(r.winNowPpw).toFixed(1)} points a week from your lineup is how a favorite becomes a first-round exit.`,
            `Every point you shed now (${Math.abs(r.winNowPpw).toFixed(1)} a week) is a point you're chasing in a playoff semifinal.`,
          ], 14)
        : injuredIn
          ? pick([
              `${injuredIn.name} is in street clothes for about ${injuredIn.weeksOut} more week${injuredIn.weeksOut === 1 ? '' : 's'}, and you're trying to win now, not in November.`,
              `A contender can't wait ~${injuredIn.weeksOut} weeks for ${injuredIn.name} — the race doesn't pause for rehab.`,
            ], 15)
          : r.salaryDelta > 0
            ? pick([
                `$${r.salaryDelta} more salary lands on a contender's books — cap you'll wish you had when the injury bug hits.`,
                `Taking on $${r.salaryDelta} in salary shrinks the wiggle room every contender needs in November.`,
              ], 16)
            : pick([
                `A lead in the standings isn't a trophy; if this doesn't make the lineup better, it's just risk.`,
                `You're already where you want to be — a trade that doesn't add points only adds ways to lose.`,
              ], 17);
    } else {
      bull = lineupUp
        ? pick([
            `At ${where}, you're a coin flip, and ${r.winNowPpw.toFixed(1)} more points a week is exactly what tips a coin flip.`,
            `Bubble teams live and die on margins like this — ${r.winNowPpw.toFixed(1)} points a week could be the difference between 4th and 6th.`,
          ], 18)
        : buying
          ? pick([
              `Sitting on the bubble (${where}), banking ${valueDiff} points of value keeps both doors open — buy later or sell later.`,
              `At ${where} you can't commit to a direction yet, and ${valueDiff} points of extra value lets you pick one later.`,
            ], 19)
          : pick([
              `On the bubble at ${odds}% odds, flexibility is worth something, and this keeps your options open.`,
              `At ${odds}% playoff odds you're not locked into buying or selling — this deal preserves that.`,
            ], 20);
      bear = lineupDown
        ? pick([
            `A bubble team losing ${Math.abs(r.winNowPpw).toFixed(1)} points a week is effectively choosing to rebuild — make sure that's the plan.`,
            `Shedding ${Math.abs(r.winNowPpw).toFixed(1)} points a week at ${odds}% odds is a quiet surrender — own it if you mean it.`,
          ], 21)
        : !buying && bestOut
          ? pick([
              `You're paying ${bestOut.name} to maybe move from ${odds}% to a slightly better coin flip — half-measures are how teams finish 5th.`,
              `Giving up ${bestOut.name} for a marginal nudge at ${odds}% odds is the classic bubble trap — neither all-in nor all-out.`,
            ], 22)
          : injuredIn
            ? pick([
                `${injuredIn.name} misses about ${injuredIn.weeksOut} more week${injuredIn.weeksOut === 1 ? '' : 's'}, and bubble teams can't spot anyone games.`,
                `Waiting ~${injuredIn.weeksOut} weeks on ${injuredIn.name} is a luxury a ${odds}% team doesn't have.`,
              ], 23)
            : pick([
                `Neither buyer nor seller — this doesn't clearly push you in either direction.`,
                `This is a sideways move for a team that needs a direction.`,
              ], 24);
    }

    // If a roster-specific bull short-circuited the mode chain, bear still needs a value.
    if (!bear!) {
      bear = lineupDown
        ? pick([
            `You'd be giving back ${Math.abs(r.winNowPpw).toFixed(1)} points a week from your starting lineup — that's real ground to concede.`,
            `Your starting nine gets ${Math.abs(r.winNowPpw).toFixed(1)} points a week worse — that shows up on the scoreboard, not just the spreadsheet.`,
          ], 25)
        : injuredIn
          ? pick([
              `${injuredIn.name} is out about ${injuredIn.weeksOut} more week${injuredIn.weeksOut === 1 ? '' : 's'} — you'd be paying now for points later.`,
              `${injuredIn.name} won't help you for ~${injuredIn.weeksOut} weeks — you're buying a wait.`,
            ], 26)
          : r.salaryDelta > 0
            ? pick([
                `$${r.salaryDelta} more salary lands on your books — cap you'll wish you had when the injury bug hits.`,
                `The $${r.salaryDelta} salary bump is the quiet cost here — it limits every future move you make.`,
              ], 27)
            : pick([
                `If the best player in the deal is already yours, this doesn't clearly make you better.`,
                `When you already hold the best piece, the burden of proof is on the trade — and this one doesn't meet it.`,
              ], 28);
    }

    // Roster-specific bear cases override the generic ones.
    if (sellingStarForDepth && eo) {
      bear = pick([
        `You're giving up ${eo.name}, a legitimate top ${eo.position}, for depth — it might help this week, but it's the kind of deal you regret in December.`,
        `Breaking up a star like ${eo.name} into spare parts almost never ages well — quantity has a quality problem.`,
        `${eo.name} is the kind of player you build a Sunday around; spreading him across your bench is a downgrade disguised as depth.`,
      ], 29);
    } else if (buying && st && st.over && st.bump < 1.5 && !st.hurt) {
      bear = pick([
        `You're paying real future value for a guy scoring only ${Math.max(0, st.bump).toFixed(1)} more points a week than ${st.over.name} — that's a marginal upgrade at a premium price.`,
        `The gap between ${st.p.name} and ${st.over.name} is about ${Math.max(0, st.bump).toFixed(1)} points a week — you're paying star prices for a rounding error.`,
        `${st.over.name} already gives you most of what ${st.p.name} does; the extra ${Math.max(0, st.bump).toFixed(1)} points a week isn't worth the asset cost.`,
      ], 30);
    } else if (buying && st?.hurt) {
      bear = pick([
        `${st.p.name} fills the ${st.hurt.name} hole, but you're paying full price for a rental — when ${st.hurt.name} is back, where does everyone fit?`,
        `Once ${st.hurt.name} is healthy, ${st.p.name} becomes an expensive insurance policy — make sure the price reflects that.`,
      ], 31);
    }

    const plan = s.mode === 'rebuild' ? 'a rebuilding team' : s.mode === 'contender' ? 'a contender' : 'a bubble team';
    const base = Math.abs(r.score) <= 2
      ? r.score >= 0
        ? pick([
            `Fair, with a slight lean your way for ${plan} — shake hands if it fills a real need.`,
            `Essentially even, maybe a hair in your favor — fine to do if it fixes something specific.`,
            `A wash on paper with a whisper of an edge to you — do it for the fit, not the math.`,
          ], 32)
        : pick([
            `Slightly against you for ${plan}, but inside the noise — only if it fixes a genuine hole.`,
            `Marginally underwater, but close enough that need can justify it — don't do it just to do something.`,
            `A tick against you, nothing more — acceptable if the roster fit is real.`,
          ], 33)
      : r.score > 0
        ? r.score > 5
          ? pick([
              `Do it — for ${plan} at ${odds}% odds, this is exactly the direction you should be moving, and it isn't close.`,
              `Take it and run — this is the move ${plan} at ${odds}% odds is supposed to make.`,
              `Yes, before they reconsider — this is squarely in your interest and then some.`,
            ], 34)
          : pick([
              `Do it — it fits where ${plan} should be headed.`,
              `Yes — the edge is modest but it's yours, and it matches your situation.`,
              `Lean in — small edge, right direction.`,
            ], 35)
        : r.score < -5
          ? pick([
              `Hard pass — this points ${plan} the wrong way; counter or let it die in the DMs.`,
              `No — this is the opposite of what ${plan} should be doing. Send back a counter or nothing at all.`,
              `Walk away — the shape of this deal works against everything your season is telling you.`,
            ], 36)
          : pick([
              `Pass for now — for ${plan} this is the wrong trade; counter before you sign.`,
              `Not at these terms — the idea might work, but this version costs you too much.`,
              `Hold off — there's a version of this worth doing, but it isn't this one.`,
            ], 37);

    return { bull, bear, base };
  };

  const renderVerdict = (label: string, r: Result) => {
    const up = r.score >= 0;
    const c = cases(r);
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold uppercase tracking-wide text-sm truncate">{label}</h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {r.situation.mode === 'rebuild' ? 'Rebuilding' : r.situation.mode === 'contender' ? 'Contending' : 'On the bubble'} · {Math.round(r.situation.playoff)}% playoff odds
            </p>
            <p className="text-xs text-muted-foreground truncate">Gets: {names(r.gained)}</p>
            {r.drops.length > 0 && (
              <p className="text-xs text-destructive truncate">Must cut to make room: {names(r.drops)}</p>
            )}
          </div>
          <div className={cn('flex items-center gap-1 shrink-0', up ? 'text-emerald-600' : 'text-destructive')}>
            {up ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <div className="text-right">
              <span className="font-mono text-3xl font-extrabold tabular-nums">{up ? '+' : ''}{r.score.toFixed(1)}%</span>
              <div className="text-[10px] font-bold uppercase tracking-wider">
                {Math.abs(r.score) <= 2 ? 'Fair' : Math.abs(r.score) <= 5 ? (up ? 'Favors you' : 'Against you') : 'Lopsided'}
              </div>
            </div>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm mb-3">
          <li><span className="font-bold text-emerald-600">Bull:</span> {c.bull}</li>
          <li><span className="font-bold text-destructive">Bear:</span> {c.bear}</li>
          <li><span className="font-bold text-foreground">Base:</span> {c.base}</li>
        </ul>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { k: 'Trade value', v: `${Math.round(r.valueIn)} in / ${Math.round(r.valueOut)} out`, good: r.valueIn >= r.valueOut },
            { k: 'This season', v: `${r.winNowPpw >= 0 ? '+' : ''}${r.winNowPpw.toFixed(1)} pts/wk`, good: r.winNowPpw >= 0 },
            { k: 'Long term', v: `${r.dynastyPpw >= 0 ? '+' : ''}${r.dynastyPpw.toFixed(1)} pts/wk`, good: r.dynastyPpw >= 0 },
            { k: 'Salary', v: `${r.salaryDelta > 0 ? '+' : r.salaryDelta < 0 ? '−' : ''}$${Math.abs(r.salaryDelta)}`, good: r.salaryDelta <= 0 },
          ].map((m) => (
            <div key={m.k} className="rounded-md bg-muted/50 border border-border/60 px-1 py-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.k}</div>
              <div className={cn('font-mono text-xs font-bold', m.good ? 'text-emerald-600' : 'text-destructive')}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">TRADE ANALYZER</h1>
              <p className="text-sm text-muted-foreground">Pick two teams, check the players moving, and the grade updates instantly.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSelA(new Set()); setSelB(new Set()); }}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="mb-5">
                {analysis ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {renderVerdict(teamName(teamA), analysis.A)}
                    {renderVerdict(teamName(teamB), analysis.B)}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-5 text-sm text-muted-foreground">
                    <ArrowLeftRight className="h-4 w-4 text-primary" /> Check at least one player below to see the grade.
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {renderColumn('A')}
                {renderColumn('B')}
              </div>

              <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                <h2 className="font-display uppercase tracking-wider text-xs font-bold text-foreground mb-2">How the grade works</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b className="text-foreground">Half Trade Value</b> — the number next to each name, from the Trade Value Chart. Your best player in the deal counts fully; extras count less.</li>
                  <li><b className="text-foreground">Half Power Rank impact</b> — does your starting lineup actually get better, this year and long term, counting injuries, depth and salary.</li>
                  <li>Taking back more players than you send? Your lowest-value players get cut to make room, and they count as value you give up.</li>
                  <li>Contenders are judged more on this season; rebuilding teams more on the future.</li>
                  <li>The grade is the % your team gets better or worse. Within ±2% is <b className="text-foreground">Fair</b>; ±2–5% favors one side; beyond ±5% is <b className="text-foreground">Lopsided</b>.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default TradeAnalyzer;
