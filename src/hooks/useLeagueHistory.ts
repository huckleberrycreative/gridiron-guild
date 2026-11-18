import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GOVERNORS, type SeasonHistory } from '@/data/leagueHistory';
import { deriveStandings } from '@/lib/standingsFromScores';
import { buildHistory, STATIC_HISTORY, type LeagueHistory, type WeeklyMap } from '@/lib/leagueHistory';

export const LIVE_SEASON = 2026;

/** Static 2017–2025 history plus the live season derived from saved weekly scores. */
export function useLeagueHistory(): { history: LeagueHistory; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['league-history', LIVE_SEASON],
    queryFn: async () => {
      const [{ data: teams }, { data: scores }] = await Promise.all([
        supabase.from('teams').select('id, name'),
        supabase.from('weekly_scores').select('team_id, week, score').eq('season_year', LIVE_SEASON),
      ]);
      return { teams: teams ?? [], scores: scores ?? [] };
    },
  });
  if (!data || !data.scores.length) return { history: STATIC_HISTORY, isLoading };

  const govByTeam = new Map<string, string>();
  data.teams.forEach((t) => {
    const g = GOVERNORS.find((x) => x.currentTeam === t.name);
    if (g) govByTeam.set(t.id, g.slug);
  });
  const scores = data.scores.filter((s) => govByTeam.has(s.team_id));
  const standings = deriveStandings(scores.map((s) => ({ week: s.week, teamId: s.team_id, score: Number(s.score) })));
  const maxWeek = Math.max(...scores.map((s) => s.week));
  const weekly: WeeklyMap = { [LIVE_SEASON]: {} };
  scores.forEach((s) => {
    const g = govByTeam.get(s.team_id)!;
    (weekly[LIVE_SEASON][g] ??= Array(maxWeek).fill(undefined));
    // A 0 means ESPN returned no lineup; keep it in standings but out of weekly highs/lows.
    if (Number(s.score) > 0) weekly[LIVE_SEASON][g][s.week - 1] = Number(s.score);
  });
  const season: SeasonHistory = {
    year: LIVE_SEASON,
    weeks: maxWeek,
    inProgress: true,
    note: `In progress — through Week ${maxWeek}.`,
    playoffs: [],
    entries: standings.map((s) => {
      const g = govByTeam.get(s.teamId)!;
      return { gov: g, team: GOVERNORS.find((x) => x.slug === g)!.currentTeam!, wins: s.wins, losses: s.losses, ties: s.ties, ap: s.points, pf: Math.round(s.pf * 10) / 10 };
    }),
  };
  return { history: buildHistory([season], weekly), isLoading };
}
