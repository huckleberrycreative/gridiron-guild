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

  const ord = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 >> 3 ^ 1 && n % 10 < 4 ? n % 10 : 0] ?? 'th'}`;

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

    let bull: string;
    let bear: string;
    if (s.mode === 'rebuild') {
      bull = youngIn.length
        ? `At ${where}, this season is a sunk cost — ${youngIn.map((p) => p.name).join(' and ')} is exactly the kind of young piece a rebuild is built around.`
        : buying
          ? `At ${where}, stacking future value is the job, and this deal adds ${valueDiff} points of it.`
          : lineupDown
            ? `At ${where}, losing a few points a week costs you almost nothing — the Toilet Bowl doesn't care.`
            : `At ${where}, any move that doesn't cost you future assets is a free swing.`;
      bear = lineupUp && !buying
        ? `You'd be paying future value for ${r.winNowPpw.toFixed(1)} points a week on a team the simulation gives ${odds}% odds — that's decorating a house you're about to sell.`
        : bestOut && valueOf(bestOut.id) >= 60 && (age(bestOut) ?? 99) <= 26
          ? `${bestOut.name} is young enough to still be here when you're good again — rebuilds shouldn't ship out the foundation.`
          : injuredIn
            ? `${injuredIn.name} is out about ${injuredIn.weeksOut} more week${injuredIn.weeksOut === 1 ? '' : 's'}, though for a team playing for 2027 that matters less than it looks.`
            : `A ${odds}% team can still get hot — if you believe the roster is better than the standings, selling now locks in the bad start.`;
    } else if (s.mode === 'contender') {
      bull = lineupUp
        ? `At ${where}, the only thing that matters is December — and this adds ${r.winNowPpw.toFixed(1)} points a week to your starting lineup.`
        : buying
          ? `You're a contender (${where}) and still walking away with ${valueDiff} more points of value — rare to get richer and stay dangerous.`
          : `A ${odds}% playoff team can afford to spend a little future to smooth out the present.`;
      bear = lineupDown
        ? `You'd be giving back ${Math.abs(r.winNowPpw).toFixed(1)} points a week in the middle of a title push — contenders don't sell starters for prospects.`
        : injuredIn
          ? `${injuredIn.name} is in street clothes for about ${injuredIn.weeksOut} more week${injuredIn.weeksOut === 1 ? '' : 's'}, and you're trying to win now, not in November.`
          : r.salaryDelta > 0
            ? `$${r.salaryDelta} more salary lands on a contender's books — cap you'll wish you had when the injury bug hits.`
            : `A lead in the standings isn't a trophy; if this doesn't make the lineup better, it's just risk.`;
    } else {
      bull = lineupUp
        ? `At ${where}, you're a coin flip, and ${r.winNowPpw.toFixed(1)} more points a week is exactly what tips a coin flip.`
        : buying
          ? `Sitting on the bubble (${where}), banking ${valueDiff} points of value keeps both doors open — buy later or sell later.`
          : `On the bubble at ${odds}% odds, flexibility is worth something, and this keeps your options open.`;
      bear = lineupDown
        ? `A bubble team losing ${Math.abs(r.winNowPpw).toFixed(1)} points a week is effectively choosing to rebuild — make sure that's the plan.`
        : !buying && bestOut
          ? `You're paying ${bestOut.name} to maybe move from ${odds}% to a slightly better coin flip — half-measures are how teams finish 5th.`
          : injuredIn
            ? `${injuredIn.name} misses about ${injuredIn.weeksOut} more week${injuredIn.weeksOut === 1 ? '' : 's'}, and bubble teams can't spot anyone games.`
            : `Neither buyer nor seller — this doesn't clearly push you in either direction.`;
    }

    const plan = s.mode === 'rebuild' ? 'a rebuilding team' : s.mode === 'contender' ? 'a contender' : 'a bubble team';
    const base = Math.abs(r.score) <= 2
      ? r.score >= 0
        ? `Fair, with a slight lean your way for ${plan} — shake hands if it fills a real need.`
        : `Slightly against you for ${plan}, but inside the noise — only if it fixes a genuine hole.`
      : r.score > 0
        ? r.score > 5
          ? `Do it — for ${plan} at ${odds}% odds, this is exactly the direction you should be moving, and it isn't close.`
          : `Do it — it fits where ${plan} should be headed.`
        : r.score < -5
          ? `Hard pass — this points ${plan} the wrong way; counter or let it die in the DMs.`
          : `Pass for now — for ${plan} this is the wrong trade; counter before you sign.`;

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
