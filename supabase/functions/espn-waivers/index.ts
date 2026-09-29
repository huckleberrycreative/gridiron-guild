import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LEAGUE_ID = '357563';
const SEASON = 2026;
const POSITIONS: Record<number, string> = { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE' };
const INJURY_MAP: Record<string, string> = {
  ACTIVE: 'healthy', NORMAL: 'healthy', QUESTIONABLE: 'questionable', DOUBTFUL: 'doubtful',
  OUT: 'out', SUSPENSION: 'out', INJURY_RESERVE: 'ir', IR: 'ir', PUP: 'ir', NON_FOOTBALL_INJURY: 'ir',
};
const PRO_TEAMS: Record<number, string> = {
  0: 'FA', 1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET', 9: 'GB', 10: 'TEN',
  11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN', 17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ',
  21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC', 25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WSH', 29: 'CAR', 30: 'JAX',
  33: 'BAL', 34: 'HOU',
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const s2 = Deno.env.get('ESPN_S2');
    const swid = Deno.env.get('ESPN_SWID');
    if (!s2 || !swid) return json({ error: 'ESPN credentials are not configured.' }, 400);
    const base = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}`;
    const headers: Record<string, string> = {
      Cookie: `espn_s2=${s2}; SWID=${swid}`,
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0',
    };

    const status = await (await fetch(`${base}?view=mStatus`, { headers })).json();
    const week: number = status?.scoringPeriodId ?? status?.status?.currentMatchupPeriod ?? 1;

    const filter = {
      players: {
        filterStatus: { value: ['FREEAGENT', 'WAIVERS'] },
        filterSlotIds: { value: [0, 2, 4, 6] },
        limit: 400,
        sortPercOwned: { sortAsc: false, sortPriority: 1 },
      },
    };
    const res = await fetch(`${base}?scoringPeriodId=${week}&view=kona_player_info`, {
      headers: { ...headers, 'x-fantasy-filter': JSON.stringify(filter) },
    });
    if (!res.ok) return json({ error: `ESPN returned an error (${res.status}).` }, 502);
    const data = await res.json();

    // previous week's box scores for "last game"
    const lastById = new Map<number, number>();
    if (week > 1) {
      const prev = await fetch(`${base}?scoringPeriodId=${week - 1}&view=kona_player_info`, {
        headers: { ...headers, 'x-fantasy-filter': JSON.stringify(filter) },
      });
      if (prev.ok) {
        for (const e of (await prev.json()).players ?? []) {
          const st = (e.player?.stats ?? []).find((s: any) => s.seasonId === SEASON && s.statSourceId === 0 && s.statSplitTypeId === 1 && s.scoringPeriodId === week - 1);
          if (e.player?.id) lastById.set(e.player.id, st?.appliedTotal ?? 0);
        }
      }
    }

    const players = (data.players ?? [])
      .map((e: any) => {
        const p = e.player;
        const position = POSITIONS[p?.defaultPositionId];
        if (!p?.fullName || !position) return null;
        const stats: any[] = p.stats ?? [];
        const find = (src: number, split: number, period?: number) =>
          stats.find((s) => s.seasonId === SEASON && s.statSourceId === src && s.statSplitTypeId === split &&
            (period == null || s.scoringPeriodId === period));
        const seasonProj = find(1, 0);
        const seasonAct = find(0, 0);
        const weekProj = find(1, 1, week);
        const weeklyActuals = stats
          .filter((s) => s.seasonId === SEASON && s.statSourceId === 0 && s.statSplitTypeId === 1 && s.scoringPeriodId < week)
          .sort((a, b) => b.scoringPeriodId - a.scoringPeriodId);
        const last = weeklyActuals[0];
        const games = seasonAct?.appliedAverage
          ? Math.round((seasonAct.appliedTotal ?? 0) / seasonAct.appliedAverage)
          : weeklyActuals.filter((s) => (s.appliedTotal ?? 0) !== 0).length;
        return {
          espnId: p.id,
          name: p.fullName,
          position,
          proTeam: PRO_TEAMS[p.proTeamId] ?? '',
          injuryStatus: INJURY_MAP[p.injuryStatus ?? 'ACTIVE'] ?? 'healthy',
          percentOwned: p.ownership?.percentOwned ?? 0,
          status: e.status,
          projPpg: seasonProj?.appliedTotal ? seasonProj.appliedTotal / 17 : null,
          weekProj: weekProj?.appliedTotal ?? null,
          avgPpg: seasonAct?.appliedAverage ?? (games ? (seasonAct?.appliedTotal ?? 0) / games : null),
          games,
          lastGame: lastById.has(p.id) ? lastById.get(p.id) : last ? last.appliedTotal ?? 0 : null,
          lastWeek: week > 1 ? week - 1 : null,
        };
      })
      .filter(Boolean);

    return json({ week, players });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
