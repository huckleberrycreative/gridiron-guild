import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Public schedule data only: fixed ESPN URL, no credentials, no client-controlled destination.
let cache: { expires: number; data: unknown } | undefined;
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!cache || cache.expires < Date.now()) {
      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&limit=1000', { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('ESPN schedule unavailable');
      const json = await response.json();
      const events = (json.events ?? []).filter((e: any) => e.season?.year === 2026 && e.season?.type === 2).map((e: any) => ({
        season: e.season, week: e.week, status: { type: { completed: e.status?.type?.completed ?? false } },
        competitions: [{ competitors: (e.competitions?.[0]?.competitors ?? []).map((c: any) => ({ team: { abbreviation: c.team?.abbreviation }, score: c.score })) }],
      }));
      if (!events.length) throw new Error('ESPN schedule empty');
      cache = { expires: Date.now() + 3600000, data: { events } };
    }
    return new Response(JSON.stringify(cache.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return new Response(JSON.stringify({ error: 'NFL schedule unavailable' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});