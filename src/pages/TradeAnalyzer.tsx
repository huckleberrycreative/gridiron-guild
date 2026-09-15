import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useTeams, usePlayerSalaries, type PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeftRight, Star, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const weeksLeft = Math.max(0, REG_SEASON_WEEKS - weeksPlayed);

  // How much a team should care about this season: playoff odds from the
  // Power Ranks simulation (0 = out of it, 1 = firmly in the hunt).
  const contentionFor = (teamId: string) => {
    const row = powerRows.find((r) => r.team.id === teamId);
    if (!row) return 0.5;
    return Math.min(1, Math.max(0, row.odds.top5 / 100));
  };


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
        .sort((a, b) => b.ppg - a.ppg);
    return { A: teamA ? build(teamA) : [], B: teamB ? build(teamB) : [] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaries, teamA, teamB, proj]);

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
      const wWinNow = 0.35 + 0.5 * contention;
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
      const ppgDelta =
        gained.reduce((s, p) => s + p.healthyPpg, 0) -
        lost.reduce((s, p) => s + p.healthyPpg, 0);
      return {
        parts,
        overall,
        winNowPpw,
        dynastyPpw,
        contention,
        salaryDelta,
        futureDelta,
        counts,
        gained,
        lost,
        ppgDelta,
      };
    };

    return {
      A: build(teamA, rosters.A, afterA, outB, outA),
      B: build(teamB, rosters.B, afterB, outA, outB),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosters, selA, selB, teamA, teamB, powerRows, weeksLeft]);

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

  const renderColumn = (side: 'A' | 'B') => {
    const value = side === 'A' ? teamA : teamB;
    const setValue = side === 'A' ? setTeamA : setTeamB;
    const setSel = side === 'A' ? setSelA : setSelB;
    const sel = side === 'A' ? selA : selB;
    const roster = side === 'A' ? rosters.A : rosters.B;
    const other = side === 'A' ? teamB : teamA;

    return (
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <Select
            value={value}
            onValueChange={(v) => {
              setValue(v);
              setSel(new Set());
            }}
          >
            <SelectTrigger className="font-display uppercase tracking-wide text-sm">
              <SelectValue placeholder={`Select Team ${side}`} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {teams
                .filter((t) => t.id !== other)
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            {value ? `${sel.size} player${sel.size === 1 ? '' : 's'} selected` : 'Choose a franchise to load its roster'}
          </p>
        </div>

        {value && (
          <ul className="divide-y divide-border/50 max-h-[520px] overflow-y-auto">
            {roster.map((p) => {
              const active = sel.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(side, p.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
                      active ? 'bg-primary/10' : 'hover:bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-8 h-6 rounded text-[10px] font-display font-bold border shrink-0',
                        positionColors[p.position] || 'bg-gray-100 text-gray-700 border-gray-200'
                      )}
                    >
                      {p.position}
                    </span>
                    <span className="font-medium flex-1 truncate">
                      {p.name}
                      {p.practiceSquad && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">PS</span>
                      )}
                      {p.injuryStatus !== 'healthy' && (
                        <span
                          title={`${p.injuryStatus}${p.weeksOut ? ` · ~${p.weeksOut} wk${p.weeksOut === 1 ? '' : 's'} out` : ''}`}
                          className={cn(
                            'ml-2 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider border',
                            p.out
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          )}
                        >
                          {injuryLabel[p.injuryStatus] ?? p.injuryStatus}
                          {p.out && p.weeksOut ? ` ${p.weeksOut}w` : ''}
                        </span>
                      )}
                    </span>
                    {p.franchiseTag && <Star size={14} className="text-gold fill-gold shrink-0" />}
                    <span className="font-mono text-[11px] text-muted-foreground w-14 text-right">
                      {p.ppg.toFixed(1)} ppg
                    </span>
                    <span className="font-mono text-muted-foreground w-12 text-right">
                      ${p.effectiveSalary}
                    </span>
                  </button>
                </li>
              );
            })}
            {roster.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground text-center">No rostered players.</li>
            )}
          </ul>
        )}
      </div>
    );
  };

  const renderVerdict = (
    label: string,
    r: NonNullable<typeof analysis>['A']
  ) => {
    const up = r.overall >= 0;
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-bold uppercase tracking-wide text-sm text-center mb-3">{label}</h3>
        <div className={cn('flex items-center justify-center gap-2 mb-4', up ? 'text-emerald-600' : 'text-destructive')}>
          {up ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
          <span className="font-mono text-4xl font-extrabold tabular-nums">
            {up ? '+' : ''}
            {r.overall.toFixed(1)}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Win-Now Lineup', value: r.parts.winNow },
            { label: 'Dynasty Lineup', value: r.parts.dynasty },
            { label: 'Injury-Tested Depth', value: r.parts.depth },
            { label: 'Cap Efficiency', value: r.parts.cap },
          ].map((m) => (
            <div key={m.label} className="rounded-md bg-muted/50 border border-border/60 px-2 py-2 text-center">
              <div className="font-display uppercase tracking-wider text-[10px] text-muted-foreground mb-1">
                {m.label}
              </div>
              <div
                className={cn(
                  'font-mono font-bold text-sm',
                  m.value >= 0 ? 'text-emerald-600' : 'text-destructive'
                )}
              >
                {m.value >= 0 ? '+' : ''}
                {m.value.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Lineup impact:</span>{' '}
            {r.winNowPpw >= 0 ? '+' : ''}
            {r.winNowPpw.toFixed(1)} ppg rest of season &middot;{' '}
            {r.dynastyPpw >= 0 ? '+' : ''}
            {r.dynastyPpw.toFixed(1)} ppg at full health
          </p>
          <p>
            <span className="font-semibold text-foreground">Raw talent in/out:</span>{' '}
            {r.ppgDelta >= 0 ? '+' : ''}
            {r.ppgDelta.toFixed(1)} projected ppg &middot; graded{' '}
            {Math.round((0.35 + 0.5 * r.contention) * 100)}% win-now /{' '}
            {Math.round((1 - (0.35 + 0.5 * r.contention)) * 100)}% dynasty
          </p>
          <p>
            <span className="font-semibold text-foreground">Salary change:</span>{' '}
            {r.salaryDelta >= 0 ? '+' : '-'}${Math.abs(r.salaryDelta)} &middot; future years{' '}
            {r.futureDelta >= 0 ? '+' : '-'}${Math.abs(r.futureDelta)}
          </p>
          <p>
            <span className="font-semibold text-foreground">Roster construction:</span>{' '}
            {['QB', 'RB', 'WR', 'TE']
              .map((pos) => `${pos} ${r.counts[pos].before}→${r.counts[pos].after}`)
              .join(' · ')}
          </p>
          <p>
            <span className="font-semibold text-foreground">Acquires:</span>{' '}
            {r.gained.length ? r.gained.map((p) => p.name).join(', ') : 'nothing'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">TRADE ANALYZER</h1>
            <p className="text-muted-foreground max-w-3xl">
              Select two franchises, pick the players moving each way, and see how much better — or
              worse — each side gets. The model weighs expected weekly output, roster construction
              and depth, player age on the dynasty curve, and salary cap efficiency.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {renderColumn('A')}
                {renderColumn('B')}
              </div>

              <div className="flex items-center justify-center gap-3 my-8">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelA(new Set());
                    setSelB(new Set());
                  }}
                >
                  Clear Selections
                </Button>
              </div>

              {analysis ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {renderVerdict(teamName(teamA), analysis.A)}
                  {renderVerdict(teamName(teamB), analysis.B)}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Select two teams and at least one player to run the analysis.
                </p>
              )}

              <div className="mt-10 rounded-lg border border-border bg-muted/30 p-5 text-xs text-muted-foreground">
                <h2 className="font-display uppercase tracking-wider text-[11px] font-bold text-foreground mb-2">
                  How the grade is calculated
                </h2>
                <p>
                  Every player is valued at his 2026 projected points per game (season FPTS &divide;
                  17) — the same engine that drives the Power Ranks. Players with no projection fall
                  back to their league contract value. Current injuries are baked in: a questionable
                  or doubtful player is discounted for this week, and an out/IR player is valued only
                  for the weeks he's expected back for. Overall change = 55% starting lineup output
                  (best legal QB/RB/RB/WR/WR/3&times;FLEX/OP nine), 25% injury-tested depth (average
                  lineup output when any one starter misses a week), and 20% cap efficiency (output
                  per dollar committed, counting the higher of 2026/2027 salary plus a quarter of
                  remaining future years). Practice squad players are excluded from lineup math.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default TradeAnalyzer;
