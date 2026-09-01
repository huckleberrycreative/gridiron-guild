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

const positionColors: Record<string, string> = {
  QB: 'bg-red-100 text-red-700 border-red-200',
  RB: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WR: 'bg-blue-100 text-blue-700 border-blue-200',
  TE: 'bg-amber-100 text-amber-700 border-amber-200',
};

type Meta = { rank: number; posRank: number; age: number | null };

const normalize = (n: string) =>
  n
    .toLowerCase()
    .replace(/[.''`]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

// Expected weekly fantasy output by positional rank (decaying curve)
const WEEKLY_CURVE: Record<string, { base: number; drop: number; floor: number }> = {
  QB: { base: 22, drop: 0.55, floor: 8 },
  RB: { base: 19, drop: 0.5, floor: 4 },
  WR: { base: 18, drop: 0.4, floor: 4 },
  TE: { base: 14, drop: 0.55, floor: 3 },
};

// Salary is the league's own market signal — used when a player isn't in the
// public rankings file (i.e. he's rostered, not in the fall draft pool).
const SALARY_CEILING = 203;

const weeklyOutput = (position: string, posRank: number | null, salary2026: number) => {
  const c = WEEKLY_CURVE[position] ?? WEEKLY_CURVE.WR;
  if (posRank != null) return Math.max(c.floor, c.base - c.drop * (posRank - 1));
  const pct = Math.min(1, salary2026 / SALARY_CEILING);
  // salary-implied output, mildly convex so top contracts separate from mid-tier
  return c.floor + (c.base - c.floor) * Math.pow(pct, 0.75);
};

// Dynasty age curve — multiplier on long-term value
const ageMultiplier = (position: string, age: number | null) => {
  if (age == null) return 1;
  const peak = position === 'RB' ? 24 : position === 'QB' ? 27 : 25;
  if (age <= peak) return 1.08;
  const decline = position === 'RB' ? 0.055 : position === 'QB' ? 0.025 : 0.035;
  return Math.max(0.55, 1.08 - decline * (age - peak));
};

const toNum = (v?: string) => {
  if (!v) return 0;
  const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

type Asset = {
  id: string;
  name: string;
  position: string;
  age: number | null;
  weekly: number;
  franchiseTag: boolean;
  practiceSquad: boolean;
  salary2026: number;
  futureSalary: number;
  dynastyValue: number;
};

const STARTER_SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'FLEX', 'FLEX', 'FLEX', 'OP'];
const eligible = (slot: string, pos: string) =>
  slot === 'OP' ? true : slot === 'FLEX' ? ['RB', 'WR', 'TE'].includes(pos) : slot === pos;

// Best-lineup weekly output using greedy fill from most restrictive slots
const startingOutput = (roster: Asset[]) => {
  const pool = [...roster].sort((a, b) => b.weekly - a.weekly);
  const used = new Set<string>();
  let total = 0;
  for (const slot of STARTER_SLOTS) {
    const pick = pool.find((p) => !used.has(p.id) && eligible(slot, p.position));
    if (pick) {
      used.add(pick.id);
      total += pick.weekly;
    }
  }
  return total;
};

// Depth adequacy: rewards having usable backups at each position, penalizes holes
const IDEAL_DEPTH: Record<string, number> = { QB: 2, RB: 4, WR: 5, TE: 2 };
const depthScore = (roster: Asset[]) => {
  let score = 0;
  for (const pos of Object.keys(IDEAL_DEPTH)) {
    const group = roster
      .filter((p) => p.position === pos)
      .sort((a, b) => b.weekly - a.weekly);
    const ideal = IDEAL_DEPTH[pos];
    for (let i = 0; i < ideal; i++) {
      const p = group[i];
      // later depth slots matter less; missing bodies score zero
      score += (p ? p.weekly : 0) * Math.pow(0.6, i);
    }
  }
  return score;
};

const capScore = (roster: Asset[]) => {
  const spend = roster.reduce((s, p) => s + p.salary2026 + p.futureSalary * 0.5, 0);
  const production = roster.reduce((s, p) => s + p.dynastyValue, 0);
  // points of dynasty value per $100 of committed salary
  return production / Math.max(1, spend / 100);
};

const WEIGHTS = { starters: 0.45, depth: 0.2, dynasty: 0.2, cap: 0.15 };

const TradeAnalyzer = () => {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: salaries = [], isLoading: salariesLoading } = usePlayerSalaries();
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  const [selA, setSelA] = useState<Set<string>>(new Set());
  const [selB, setSelB] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const text = await (await fetch('/data/fantasypros-2026-dynasty.csv')).text();
        const lines = text.split(/\r?\n/).filter(Boolean);
        const map: Record<string, Meta> = {};
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(',');
          const rank = parseInt(cells[0], 10);
          const name = cells[1]?.trim();
          const posRaw = cells[3]?.trim() || '';
          const age = parseInt(cells[4]?.trim() || '', 10);
          if (!name || isNaN(rank)) continue;
          const posRank = parseInt(posRaw.replace(/\D/g, ''), 10);
          map[normalize(name)] = {
            rank,
            posRank: isNaN(posRank) ? 99 : posRank,
            age: isNaN(age) ? null : age,
          };
        }
        setMeta(map);
      } catch {
        setMeta({});
      }
    })();
  }, []);

  const toAsset = (s: PlayerSalaryWithDetails): Asset => {
    const name = `${s.firstName} ${s.lastName}`.trim();
    const m = meta[normalize(name)];
    const weekly = weeklyOutput(s.position, m?.posRank ?? null);
    const salary2026 = toNum(s.salary2026);
    const futureSalary =
      toNum(s.salary2027) + toNum(s.salary2028) + toNum(s.salary2029);
    return {
      id: s.id,
      name,
      position: s.position,
      age: m?.age ?? null,
      weekly,
      franchiseTag: s.franchiseTag,
      practiceSquad: s.practiceSquad,
      salary2026,
      futureSalary,
      dynastyValue: weekly * ageMultiplier(s.position, m?.age ?? null),
    };
  };

  const rosters = useMemo(() => {
    const build = (teamId: string) =>
      salaries
        .filter((s) => s.teamId === teamId)
        .map(toAsset)
        .sort((a, b) => b.weekly - a.weekly);
    return { A: teamA ? build(teamA) : [], B: teamB ? build(teamB) : [] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaries, teamA, teamB, meta]);

  const evaluate = (roster: Asset[]) => ({
    starters: startingOutput(roster),
    depth: depthScore(roster),
    dynasty: roster.reduce((s, p) => s + p.dynastyValue, 0),
    cap: capScore(roster),
  });

  const analysis = useMemo(() => {
    if (!teamA || !teamB || (selA.size === 0 && selB.size === 0)) return null;

    const outA = rosters.A.filter((p) => selA.has(p.id));
    const outB = rosters.B.filter((p) => selB.has(p.id));

    const afterA = [...rosters.A.filter((p) => !selA.has(p.id)), ...outB];
    const afterB = [...rosters.B.filter((p) => !selB.has(p.id)), ...outA];

    const build = (before: Asset[], after: Asset[], gained: Asset[], lost: Asset[]) => {
      const b = evaluate(before);
      const a = evaluate(after);
      const pct = (x: number, y: number) => (y === 0 ? 0 : ((x - y) / y) * 100);
      const parts = {
        starters: pct(a.starters, b.starters),
        depth: pct(a.depth, b.depth),
        dynasty: pct(a.dynasty, b.dynasty),
        cap: pct(a.cap, b.cap),
      };
      const overall =
        parts.starters * WEIGHTS.starters +
        parts.depth * WEIGHTS.depth +
        parts.dynasty * WEIGHTS.dynasty +
        parts.cap * WEIGHTS.cap;
      const salaryDelta =
        gained.reduce((s, p) => s + p.salary2026, 0) -
        lost.reduce((s, p) => s + p.salary2026, 0);
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
      return { parts, overall, salaryDelta, futureDelta, counts, gained, lost };
    };

    return {
      A: build(rosters.A, afterA, outB, outA),
      B: build(rosters.B, afterB, outA, outB),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosters, selA, selB, teamA, teamB]);

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
                    </span>
                    {p.franchiseTag && <Star size={14} className="text-gold fill-gold shrink-0" />}
                    <span className="font-mono text-[11px] text-muted-foreground w-10 text-right">
                      {p.age ? `${p.age}y` : '-'}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground w-12 text-right">
                      {p.weekly.toFixed(1)}
                    </span>
                    <span className="font-mono text-muted-foreground w-12 text-right">
                      ${p.salary2026}
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
            { label: 'Starting Output', value: r.parts.starters },
            { label: 'Depth', value: r.parts.depth },
            { label: 'Dynasty (Age-Adj.)', value: r.parts.dynasty },
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
            <span className="font-semibold text-foreground">2026 salary change:</span>{' '}
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
                  Overall change = 45% starting lineup output (best legal QB/RB/RB/WR/WR/3&times;FLEX/OP
                  lineup), 20% positional depth (diminishing credit for each backup, holes score zero),
                  20% age-adjusted dynasty value (RBs decline fastest, QBs slowest), and 15% cap
                  efficiency (value produced per dollar committed in 2026 plus half of 2027-2029).
                  Weekly output is projected from each player's dynasty positional rank.
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
