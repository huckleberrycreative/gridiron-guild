import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { emptySchedule, type ScheduleContext } from '@/lib/seasonSimulation';

type Event = { season?: { year: number; type: number }; week?: { number: number }; status?: { type?: { completed?: boolean } }; competitions?: { competitors?: { team?: { abbreviation?: string }; score?: string }[] }[] };
export function parseSchedule(events: Event[]): ScheduleContext {
  const opponents: ScheduleContext['opponents'] = {};
  const allowed: Record<string, number[]> = {};
  let completedGames = 0;
  for (const event of events) {
    if (event.season?.year !== 2026 || event.season.type !== 2 || !event.week?.number) continue;
    const [a, b] = event.competitions?.[0]?.competitors ?? [];
    const at = a?.team?.abbreviation, bt = b?.team?.abbreviation;
    if (!at || !bt) continue;
    (opponents[at] ??= {})[event.week.number] = bt;
    (opponents[bt] ??= {})[event.week.number] = at;
    if (event.status?.type?.completed && Number.isFinite(Number(a.score)) && Number.isFinite(Number(b.score))) {
      (allowed[at] ??= []).push(Number(b.score)); (allowed[bt] ??= []).push(Number(a.score)); completedGames++;
    }
  }
  const scores = Object.values(allowed).flat();
  const league = scores.reduce((s, p) => s + p, 0) / Math.max(1, scores.length);
  // Scoring allowed is a coarse defense proxy, NOT position-specific fantasy points allowed.
  // Eight league-average pseudo-games shrink early-season extremes; cap effect at +/-8% PPG.
  const defense = Object.fromEntries(Object.entries(allowed).map(([team, points]) => {
    const adjusted = (points.reduce((s, p) => s + p, 0) + league * 8) / (points.length + 8);
    return [team, Math.max(0.92, Math.min(1.08, 1 + (adjusted / Math.max(1, league) - 1) * 0.35))];
  }));
  return { opponents, defense, completedGames };
}
export function useNflSchedule() {
  return useQuery({
    queryKey: ['nfl-schedule-defense', 2026], staleTime: 60 * 60 * 1000, retry: 1,
    queryFn: async () => {
      const { data: json, error } = await supabase.functions.invoke('nfl-schedule');
      let events = json?.events;
      if (error || json?.error) {
        const backup = await fetch('/data/nfl-schedule-2026.json');
        if (!backup.ok) throw new Error('NFL schedule unavailable');
        const snapshot = await backup.json();
        events = snapshot.events;
      }
      const result = parseSchedule(events ?? []);
      if (!Object.keys(result.opponents).length) throw new Error('NFL schedule empty');
      return result;
    },
  });
}
export { emptySchedule };