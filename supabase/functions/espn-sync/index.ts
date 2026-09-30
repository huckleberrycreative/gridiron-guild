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
    // Match salary rows by normalized NAME (not player id) so duplicate player
    // records can never spawn a second salary row for the same person.
    const nameByPlayerId = new Map<string, string>();
    for (const p of players ?? []) nameByPlayerId.set(p.id, norm(p.full_name));
    const salaryByName = new Map<string, { id: string; team_id: string | null; practice_squad: boolean }>();
    for (const s of salaryRows ?? []) {
      const row = { id: s.id, team_id: s.team_id, practice_squad: !!s.practice_squad };
      salaryByPlayer.set(s.player_id, row);
      const nk = nameByPlayerId.get(s.player_id);
      const prev = nk ? salaryByName.get(nk) : undefined;
      if (nk && (!prev || (!prev.team_id && row.team_id))) salaryByName.set(nk, row);
    }

    const seenSalaryIds = new Set<string>();
    const added: string[] = [];
    const moved: string[] = [];
    let injuryUpdates = 0;

    // --- player news blurbs (ESPN news_wl view) ---
    const stripHtml = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const newsByName = new Map<string, string>();
    try {
      const newsFilter = { players: { filterStatus: { value: ['FREEAGENT', 'WAIVERS', 'ONTEAM'] }, limit: 600 } };
      const newsRes = await fetch(
        `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}?scoringPeriodId=${league?.scoringPeriodId ?? 1}&view=kona_player_info&view=news_wl`,
        {
          headers: {
            Cookie: `espn_s2=${s2}; SWID=${swid}`,
            Accept: 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'x-fantasy-filter': JSON.stringify(newsFilter),
          },
        }
      );
      console.log('news fetch status:', newsRes.status);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        console.log('news players returned:', (newsData.players ?? []).length);
        for (const e of newsData.players ?? []) {
          const p = e.player;
          if (!p?.fullName) continue;
          // ESPN ships analysis blurbs as seasonOutlook / weekly outlooks.
          const weeklyOutlooks = p.outlooks?.outlooksByWeek ?? {};
          const latestWeek = Object.keys(weeklyOutlooks).map(Number).filter((n) => !isNaN(n)).sort((a, b) => b - a)[0];
          const raw = (latestWeek != null ? weeklyOutlooks[latestWeek] : null) ?? p.seasonOutlook ?? null;
          if (raw) newsByName.set(norm(p.fullName), stripHtml(String(raw)).slice(0, 500));
        }
      }
    } catch (e) {
      console.error('news fetch failed', e);
    } finally {
      console.log('news notes collected:', newsByName.size);
    }

    for (const t of realEspnTeams) {
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

        // News blurb from the news_wl fetch; fall back to injury details if present.
        const injuries: any[] = Array.isArray(p.injuries) ? p.injuries : [];
        const latestInjury = injuries
          .slice()
          .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))[0];
        const injuryNote: string | null =
          status === 'healthy'
            ? null
            : (newsByName.get(key) ??
               latestInjury?.details?.longDetail ??
               latestInjury?.details?.shortDetail ??
               latestInjury?.details?.detail ??
               null);

        const injuryPatch = (prevWeeks: number) => {
          const weeks =
            status === 'healthy'
              ? 0
              : status === 'questionable' || status === 'doubtful'
                ? 0
                : Math.max(1, prevWeeks || (status === 'ir' ? 6 : 1));
          return { injury_status: status, injury_weeks_out: weeks, injury_note: injuryNote };
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

    // --- practice squad holding rosters: cross-reference only, never import ---
    const playerNameById = new Map<string, string>();
    for (const p of players ?? []) playerNameById.set(p.id, p.full_name);

    const espnPsNames: string[] = [];
    for (const t of practiceSquadEspnTeams) {
      for (const entry of t.roster?.entries ?? []) {
        const name = entry.playerPoolEntry?.player?.fullName;
        if (name) espnPsNames.push(name);
      }
    }
    const espnPsKeys = new Set(espnPsNames.map(norm));

    const assignedPsNames = new Set<string>();
    for (const s of salaryRows ?? []) {
      if (!s.practice_squad) continue;
      const name = playerNameById.get(s.player_id);
      if (name) assignedPsNames.add(norm(name));
    }

    // on an ESPN practice squad roster but not assigned to a team's practice squad here
    const unassignedPracticeSquad = espnPsNames.filter((n) => !assignedPsNames.has(norm(n)));
    // assigned to a practice squad here but no longer on an ESPN practice squad roster
    const droppedPracticeSquad = (salaryRows ?? [])
      .filter((s) => s.practice_squad)
      .map((s) => playerNameById.get(s.player_id) ?? '')
      .filter((n) => n && !espnPsKeys.has(norm(n)));

    // --- players no longer rostered on ESPN become free agents ---
    let released = 0;
    const syncedLeagueTeamIds = new Set(teamIdByEspn.values());
    if (teamIdByEspn.size > 0) {
      for (const s of salaryRows ?? []) {
        // practice squad stashes live on the holding rosters, so never release them here
        if (s.practice_squad || espnPsKeys.has(norm(playerNameById.get(s.player_id) ?? ''))) continue;
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

    // --- live player stats (all rosters, incl. practice squad holding teams) ---
    let statsUpdated = 0;
    const nowIso = new Date().toISOString();
    for (const t of league.teams ?? []) {
      for (const entry of t.roster?.entries ?? []) {
        const p = entry.playerPoolEntry?.player;
        if (!p?.fullName) continue;
        const pid = playerIdByName.get(norm(p.fullName));
        const sal = pid ? salaryByPlayer.get(pid) : undefined;
        if (!sal) continue;
        const stats: any[] = p.stats ?? [];
        const actual = stats.find((s) => s.seasonId === SEASON && s.statSourceId === 0 && s.statSplitTypeId === 0);
        const proj = stats.find((s) => s.seasonId === SEASON && s.statSourceId === 1 && s.statSplitTypeId === 0);
        const weekly = stats.filter(
          (s) => s.seasonId === SEASON && s.statSourceId === 0 && s.statSplitTypeId === 1 && (s.appliedTotal ?? 0) !== 0
        );
        const games = actual?.appliedAverage ? Math.round((actual.appliedTotal ?? 0) / actual.appliedAverage) : weekly.length;
        const actualPpg = actual?.appliedAverage ?? (games ? (actual?.appliedTotal ?? 0) / games : null);
        const projPpg = proj?.appliedTotal ? proj.appliedTotal / 17 : null;
        await admin
          .from('player_salaries')
          .update({ actual_ppg: actualPpg, games_played: games, espn_proj_ppg: projPpg, espn_lineup_slot: entry.lineupSlotId ?? null, stats_updated_at: nowIso })
          .eq('id', sal.id);
        statsUpdated++;
        const weekRows = weekly
          .filter((s) => s.scoringPeriodId)
          .map((s) => ({ season_year: SEASON, week: s.scoringPeriodId, player_id: pid, points: s.appliedTotal ?? 0 }));
        if (weekRows.length) {
          const { error: wErr } = await admin
            .from('player_week_scores')
            .upsert(weekRows, { onConflict: 'season_year,week,player_id' });
          if (wErr) console.error('player_week_scores upsert', wErr);
        }
      }
    }

    // --- backfill earlier weeks' player scores (ESPN only returns the latest week by default) ---
    const curWeek: number = league.scoringPeriodId ?? 1;
    const { data: haveRows } = await admin.from('player_week_scores').select('week').eq('season_year', SEASON);
    const haveWeeks = new Set((haveRows ?? []).map((r: any) => r.week));
    for (let w = 1; w <= curWeek; w++) {
      if (haveWeeks.has(w) && w < curWeek - 1) continue;
      const r = await fetch(
        `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}?view=mRoster&scoringPeriodId=${w}`,
        { headers: { Cookie: `espn_s2=${s2}; SWID=${swid}`, Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' } }
      );
      if (!r.ok) continue;
      const wk = await r.json();
      const rows: any[] = [];
      for (const t of wk.teams ?? []) {
        for (const entry of t.roster?.entries ?? []) {
          const p = entry.playerPoolEntry?.player;
          const pid = p?.fullName ? playerIdByName.get(norm(p.fullName)) : undefined;
          if (!pid) continue;
          const st = (p.stats ?? []).find(
            (s: any) => s.seasonId === SEASON && s.statSourceId === 0 && s.statSplitTypeId === 1 && s.scoringPeriodId === w
          );
          if (st) rows.push({ season_year: SEASON, week: w, player_id: pid, points: st.appliedTotal ?? 0 });
        }
      }
      if (rows.length) {
        const { error: bErr } = await admin.from('player_week_scores').upsert(rows, { onConflict: 'season_year,week,player_id' });
        if (bErr) console.error('backfill', w, bErr);
      }
    }


    return json({
      ok: true,
      teamsSynced: teamIdByEspn.size,
      newsNotes: newsByName.size,
      unmatchedTeams,
      espnTeams,
      playersAdded: added,
      rosterMoves: moved.length,
      released,
      injuryUpdates,
      weeksSynced,
      statsUpdated,
      practiceSquad: {
        holdingRosters: practiceSquadEspnTeams.map((t: any) => espnTeamName(t)),
        espnCount: espnPsNames.length,
        unassigned: unassignedPracticeSquad,
        dropped: droppedPracticeSquad,
      },
    });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
