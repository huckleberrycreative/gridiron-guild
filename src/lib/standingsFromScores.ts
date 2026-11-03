// Derives league standings purely from weekly scores: finish points per the
// scoring rules, plus a weekly W/L/T record (top 4 = W, 5th = T, 6th-10th = L;
// rivalry weeks are head-to-head so winners get a W and losers an L).
import { weeklyPoints, RIVALRY_WEEKS } from '@/lib/scoring';

export interface ScoreRow {
  week: number;
  teamId: string;
  score: number;
}

export interface DerivedStanding {
  teamId: string;
  rank: number;
  points: number;
  pf: number;
  wins: number;
  losses: number;
  ties: number;
  weeks: number;
  avgPPW: number;
}

export function deriveStandings(rows: ScoreRow[]): DerivedStanding[] {
  const byWeek = new Map<number, { teamId: string; score: number }[]>();
  rows.forEach((r) => {
    const list = byWeek.get(r.week) || [];
    list.push({ teamId: r.teamId, score: r.score });
    byWeek.set(r.week, list);
  });

  const totals = new Map<
    string,
    { points: number; pf: number; wins: number; losses: number; ties: number; weeks: number }
  >();

  Array.from(byWeek.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([week, weekRows]) => {
      const ordered = [...weekRows].sort((a, b) => b.score - a.score);
      const fieldSize = ordered.length;
      const winnerMargin =
        fieldSize > 1 ? ordered[0].score - ordered[1].score : 0;
      ordered.forEach((row, index) => {
        const pts = weeklyPoints(week, row.teamId, index, fieldSize, winnerMargin);
        const cur =
          totals.get(row.teamId) || { points: 0, pf: 0, wins: 0, losses: 0, ties: 0, weeks: 0 };
        cur.points += pts;
        cur.pf += row.score;
        cur.weeks += 1;
        if (RIVALRY_WEEKS[week]) {
          if (pts > 0) cur.wins += 1;
          else cur.losses += 1;
        } else if (index < 4) cur.wins += 1;
        else if (index === 4) cur.ties += 1;
        else cur.losses += 1;
        totals.set(row.teamId, cur);
      });
    });

  return Array.from(totals.entries())
    .map(([teamId, t]) => ({
      teamId,
      rank: 0,
      points: t.points,
      pf: t.pf,
      wins: t.wins,
      losses: t.losses,
      ties: t.ties,
      weeks: t.weeks,
      avgPPW: t.weeks > 0 ? t.pf / t.weeks : 0,
    }))
    .sort((a, b) => b.points - a.points || b.pf - a.pf)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}
