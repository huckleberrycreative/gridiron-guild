import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const LEAGUE_ID = '357563';
const SEASON = 2026;

const POSITIONS: Record<number, string> = { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE' };

const INJURY_MAP: Record<string, string> = {
  ACTIVE: 'healthy',
  NORMAL: 'healthy',
  QUESTIONABLE: 'questionable',
  DOUBTFUL: 'doubtful',
  OUT: 'out',
  SUSPENSION: 'out',
  INJURY_RESERVE: 'ir',
  IR: 'ir',
  PUP: 'ir',
  NON_FOOTBALL_INJURY: 'ir',
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.'’"`]/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (s: string) => new Set(norm(s).split(' ').filter(Boolean));

function bestTeamMatch(espnName: string, teams: { id: string; name: string }[]) {
  const a = tokens(espnName);
  let best: { id: string; score: number } | null = null;
  for (const t of teams) {
    const b = tokens(t.name);
    let hits = 0;
    for (const w of a) if (b.has(w)) hits++;
    const score = hits / Math.max(1, Math.min(a.size, b.size));
    if (!best || score > best.score) best = { id: t.id, score };
  }
  return best && best.score >= 0.5 ? best.id : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // --- auth: refreshing is open to everyone; team re-mapping stays admin-only ---
    const admin = createClient(url, service);

    let isAdmin = false;
    const authHeader = req.headers.get('Authorization') ?? '';
    if (authHeader.startsWith('Bearer ')) {
      const userClient = createClient(url, anon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      const user = userData?.user;
      if (user) {
        const { data: roleCheck } = await admin.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });
        isAdmin = !!roleCheck;
      }
    }

    const s2 = Deno.env.get('ESPN_S2');
    const swid = Deno.env.get('ESPN_SWID');
    if (!s2 || !swid) return json({ error: 'ESPN credentials are not configured.' }, 400);

    // --- optional manual team mappings from the admin UI ---
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const mappings = body?.mappings as Record<string, string | null> | undefined;
    if (mappings && !isAdmin) return json({ error: 'Admins only.' }, 403);
    if (mappings) {
      for (const [espnIdRaw, leagueTeamId] of Object.entries(mappings)) {
        const espnId = parseInt(espnIdRaw, 10);
        if (!espnId) continue;
        // clear this espn id from any other team first
        await admin.from('teams').update({ espn_team_id: null }).eq('espn_team_id', espnId);
        if (leagueTeamId) {
          await admin.from('teams').update({ espn_team_id: espnId }).eq('id', leagueTeamId);
        }
      }
    }

    // --- fetch league ---
    const espnUrl =
      `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}` +
      `/segments/0/leagues/${LEAGUE_ID}?view=mRoster&view=mTeam&view=mMatchupScore&view=mSettings`;

    const res = await fetch(espnUrl, {
      headers: {
        Cookie: `espn_s2=${s2}; SWID=${swid}`,
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('ESPN error', res.status, text.slice(0, 300));
      return json(
        {
          error:
            res.status === 401
              ? 'ESPN rejected the saved login. The espn_s2 / SWID values likely expired.'
              : `ESPN returned an error (${res.status}).`,
        },
        502
      );
    }
    const league = await res.json();

    // --- team mapping ---
    const { data: dbTeams } = await admin.from('teams').select('id, name, espn_team_id');
    const teams = dbTeams ?? [];
    const teamIdByEspn = new Map<number, string>();
    const unmatchedTeams: string[] = [];

    const espnTeamName = (t: any): string =>
      t.name ?? `${t.location ?? ''} ${t.nickname ?? ''}`.trim();
    const isPracticeSquadTeam = (t: any) => /practice\s*squad/i.test(espnTeamName(t));

    const practiceSquadEspnTeams = (league.teams ?? []).filter(isPracticeSquadTeam);
    const realEspnTeams = (league.teams ?? []).filter((t: any) => !isPracticeSquadTeam(t));

    // never let a practice-squad holding roster be mapped to a league team
    for (const t of practiceSquadEspnTeams) {
      await admin.from('teams').update({ espn_team_id: null }).eq('espn_team_id', t.id);
    }

    for (const t of realEspnTeams) {
      const espnId: number = t.id;
      const espnName: string = espnTeamName(t);
      const existing = teams.find((x: any) => x.espn_team_id === espnId);
      if (existing) {
        teamIdByEspn.set(espnId, existing.id);
        continue;
      }
      const matchId = bestTeamMatch(espnName, teams as any);
      if (matchId) {
        teamIdByEspn.set(espnId, matchId);
        await admin.from('teams').update({ espn_team_id: espnId }).eq('id', matchId);
      } else {
        unmatchedTeams.push(espnName);
      }
    }

    const espnTeams = realEspnTeams.map((t: any) => ({
      espnId: t.id as number,
      espnName: espnTeamName(t),
      mappedTeamId: teamIdByEspn.get(t.id) ?? null,
    }));

    // --- existing players / salary rows ---
    const { data: players } = await admin.from('players').select('id, full_name, position');
    const playerIdByName = new Map<string, string>();
    for (const p of players ?? []) playerIdByName.set(norm(p.full_name), p.id);

    const { data: salaryRows } = await admin
      .from('player_salaries')
      .select('id, player_id, team_id, practice_squad');
    const salaryByPlayer = new Map<
      string,
      { id: string; team_id: string | null; practice_squad: boolean }
    >();
    for (const s of salaryRows ?? [])
      salaryByPlayer.set(s.player_id, {
        id: s.id,
        team_id: s.team_id,
        practice_squad: !!s.practice_squad,
      });

    const seenSalaryIds = new Set<string>();
    const added: string[] = [];
    const moved: string[] = [];
    let injuryUpdates = 0;

    for (const t of league.teams ?? []) {
      const teamId = teamIdByEspn.get(t.id);
      if (!teamId) continue;

      for (const entry of t.roster?.entries ?? []) {
        const p = entry.playerPoolEntry?.player;
        if (!p) continue;
        const position = POSITIONS[p.defaultPositionId];
        if (!position) continue;

        const fullName: string = p.fullName ?? '';
        if (!fullName) continue;
        const key = norm(fullName);

        let playerId = playerIdByName.get(key);
        if (!playerId) {
          const parts = fullName.split(' ');
          const { data: created, error: createErr } = await admin
            .from('players')
            .insert({
              first_name: parts[0] ?? fullName,
              last_name: parts.slice(1).join(' ') || fullName,
              full_name: fullName,
              position,
            })
            .select('id')
            .single();
          if (createErr || !created) continue;
          playerId = created.id;
          playerIdByName.set(key, playerId);
          added.push(fullName);
        }

        const status = INJURY_MAP[p.injuryStatus ?? 'ACTIVE'] ?? 'healthy';
        const existingSalary = salaryByPlayer.get(playerId);

        const injuryPatch = (prevWeeks: number) => {
          const weeks =
            status === 'healthy'
              ? 0
              : status === 'questionable' || status === 'doubtful'
                ? 0
                : Math.max(1, prevWeeks || (status === 'ir' ? 6 : 1));
          return { injury_status: status, injury_weeks_out: weeks };
        };

        if (existingSalary) {
          seenSalaryIds.add(existingSalary.id);
          const { data: prev } = await admin
            .from('player_salaries')
            .select('injury_weeks_out, injury_status')
            .eq('id', existingSalary.id)
            .single();
          const patch: Record<string, unknown> = {
            team_id: teamId,
            ...injuryPatch(prev?.injury_weeks_out ?? 0),
          };
          if (existingSalary.team_id !== teamId) moved.push(fullName);
          await admin.from('player_salaries').update(patch).eq('id', existingSalary.id);
          if ((prev?.injury_status ?? 'healthy') !== status) injuryUpdates++;
        } else {
          const { data: inserted } = await admin
            .from('player_salaries')
            .insert({
              player_id: playerId,
              team_id: teamId,
              salary_2026: '1',
              franchise_tag: false,
              practice_squad: false,
              acquired_via_waivers: false,
              ...injuryPatch(0),
            })
            .select('id')
            .single();
          if (inserted) seenSalaryIds.add(inserted.id);
          moved.push(fullName);
        }
      }
    }

    // --- players no longer rostered on ESPN become free agents ---
    let released = 0;
    const syncedLeagueTeamIds = new Set(teamIdByEspn.values());
    if (teamIdByEspn.size > 0) {
      for (const s of salaryRows ?? []) {
        // only touch teams that ESPN actually reported on
        if (s.team_id && syncedLeagueTeamIds.has(s.team_id) && !seenSalaryIds.has(s.id)) {
          await admin.from('player_salaries').update({ team_id: null }).eq('id', s.id);
          released++;
        }
      }
    }

    // --- weekly scores ---
    let weeksSynced = 0;
    const scoreRows: any[] = [];
    for (const m of league.schedule ?? []) {
      const week: number = m.matchupPeriodId;
      if (!week || m.winner === 'UNDECIDED') continue;
      for (const side of [m.home, m.away]) {
        if (!side) continue;
        const teamId = teamIdByEspn.get(side.teamId);
        const score = side.totalPoints;
        if (!teamId || typeof score !== 'number' || score <= 0) continue;
        scoreRows.push({ season_year: SEASON, week, team_id: teamId, score });
      }
    }
    if (scoreRows.length) {
      const { error: scoreErr } = await admin
        .from('weekly_scores')
        .upsert(scoreRows, { onConflict: 'season_year,week,team_id' });
      if (scoreErr) console.error('weekly_scores upsert', scoreErr);
      weeksSynced = new Set(scoreRows.map((r) => r.week)).size;
    }

    return json({
      ok: true,
      teamsSynced: teamIdByEspn.size,
      unmatchedTeams,
      espnTeams,
      playersAdded: added,
      rosterMoves: moved.length,
      released,
      injuryUpdates,
      weeksSynced,
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
