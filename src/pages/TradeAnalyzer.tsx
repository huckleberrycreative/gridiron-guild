import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
      // Trade Value Chart: best asset counts fully, extras count less, so
      // three nickels don't automatically beat a quarter.
      const pkg = (xs: Asset[]) =>
        xs
          .map((p) => valueOf(p.id))
          .sort((x, y) => y - x)
          .reduce((s, v, i) => s + v * Math.pow(0.6, i), 0);
      const valueIn = pkg(gained);
      const valueOut = pkg(lost);
      const valueScore = ((valueIn - valueOut) / Math.max(valueIn, valueOut, 1)) * 100;
      const fitScore = Math.max(-100, Math.min(100, overall * 5));
      const score = Math.round(valueScore * 0.6 + fitScore * 0.4);
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
