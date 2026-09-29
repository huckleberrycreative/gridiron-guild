import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SEASON_YEAR, REGULAR_SEASON_WEEKS } from '@/hooks/useWeeklyScores';
import { useToast } from '@/hooks/use-toast';
import { Lock, Unlock, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Team = { id: string; name: string };
type RosterPlayer = { id: string; name: string; position: string; teamId: string };
type Pick = { id: string; week: number; teamId: string; playerId: string | null; locked: boolean };

const CAPTAIN_MULT = 0.25;
const shortName = (n: string) => n.replace(/^The /, '').split(' ').slice(-1)[0];
const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const TeamCaptains = () => {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // `${week}:${teamId}` -> playerId
  const [saving, setSaving] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ['captains', SEASON_YEAR],
    queryFn: async () => {
      const [salRes, pickRes, scoreRes, teamRes] = await Promise.all([
        supabase.from('player_salaries').select('team_id, player_id, players(full_name, position)').not('team_id', 'is', null),
        supabase.from('captain_picks').select('id, week, team_id, player_id, locked').eq('season_year', SEASON_YEAR),
        supabase.from('player_week_scores').select('week, player_id, points').eq('season_year', SEASON_YEAR),
        supabase.from('teams').select('id, name').order('name'),
      ]);
      const roster: RosterPlayer[] = (salRes.data || []).map((r: any) => ({
        id: r.player_id, teamId: r.team_id, name: r.players?.full_name ?? '?', position: r.players?.position ?? '',
      }));
      const withRoster = new Set(roster.map((r) => r.teamId));
      const teams: Team[] = (teamRes.data || []).filter((t) => withRoster.has(t.id) && !/Lurkers/i.test(t.name));
      const picks: Pick[] = (pickRes.data || []).map((p: any) => ({ id: p.id, week: p.week, teamId: p.team_id, playerId: p.player_id, locked: p.locked }));
      const scores = new Map<string, number>();
      (scoreRes.data || []).forEach((s: any) => scores.set(`${s.week}:${s.player_id}`, Number(s.points)));
      return { roster, teams, picks, scores };
    },
  });

  const teams = data?.teams ?? [];
  const roster = data?.roster ?? [];
  const picks = data?.picks ?? [];
  const scores = data?.scores ?? new Map<string, number>();
  const playerById = useMemo(() => new Map(roster.map((p) => [p.id, p])), [roster]);
  const pickAt = (week: number, teamId: string) => picks.find((p) => p.week === week && p.teamId === teamId);
  const valueAt = (week: number, teamId: string) => drafts[`${week}:${teamId}`] ?? pickAt(week, teamId)?.playerId ?? '';
  const weekLocked = (week: number) => picks.some((p) => p.week === week && p.locked);

  // Uses by a team in every week except the one being edited
  const usage = (teamId: string, exceptWeek: number) => {
    const counts = new Map<string, number>();
    let qbUsed = false;
    for (let w = 1; w <= REGULAR_SEASON_WEEKS; w++) {
      if (w === exceptWeek) continue;
      const pid = valueAt(w, teamId);
      if (!pid) continue;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
      if (playerById.get(pid)?.position === 'QB') qbUsed = true;
    }
    return { counts, qbUsed };
  };

  const captainPts = (week: number, pid: string | null | undefined) => {
    if (!pid) return null;
    const s = scores.get(`${week}:${pid}`);
    // A player who gets hurt and subbed out doesn't have negative points applied — floor at 0.
    return s == null ? null : Math.max(0, s) * CAPTAIN_MULT;
  };

  // Summary over locked picks with scores
  const summary = useMemo(() => {
    const all: number[] = [];
    const byTeam = new Map<string, number[]>();
    picks.filter((p) => p.locked).forEach((p) => {
      const c = captainPts(p.week, p.playerId);
      if (c == null) return;
      all.push(c);
      byTeam.set(p.teamId, [...(byTeam.get(p.teamId) ?? []), c]);
    });
    const avg = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
    const teamAvgs = teams
      .map((t) => { const a = byTeam.get(t.id) ?? []; return { team: t, avg: a.length ? a.reduce((x, y) => x + y, 0) / a.length : null }; })
      .filter((t): t is { team: Team; avg: number } => t.avg != null)
      .sort((a, b) => b.avg - a.avg);
    return { avg, med: median(all), top: teamAvgs[0], bottom: teamAvgs[teamAvgs.length - 1], n: all.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks, scores, teams]);

  const submitWeek = async (week: number) => {
    const missing = teams.filter((t) => !valueAt(week, t.id));
    if (missing.length === teams.length) {
      toast({ title: `No picks for Week ${week}`, variant: 'destructive' });
      return;
    }
    if (missing.length && !window.confirm(`No captain for: ${missing.map((t) => shortName(t.name)).join(', ')}. Lock anyway?`)) return;
    setSaving(week);
    const rows = teams.filter((t) => valueAt(week, t.id)).map((t) => ({ season_year: SEASON_YEAR, week, team_id: t.id, player_id: valueAt(week, t.id), locked: true }));
    const { error } = await supabase.from('captain_picks').upsert(rows, { onConflict: 'season_year,week,team_id' });
    setSaving(null);
    if (error) return toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith(`${week}:`))));
    qc.invalidateQueries({ queryKey: ['captains'] });
    toast({ title: `Week ${week} locked` });
  };

  const unlockWeek = async (week: number) => {
    const { error } = await supabase.from('captain_picks').update({ locked: false }).eq('season_year', SEASON_YEAR).eq('week', week);
    if (error) return toast({ title: 'Could not unlock', description: error.message, variant: 'destructive' });
    qc.invalidateQueries({ queryKey: ['captains'] });
  };

  const weeks = Array.from({ length: REGULAR_SEASON_WEEKS }, (_, i) => i + 1);
  const fmt = (n: number) => (Math.abs(n) < 0.05 ? 0 : n).toFixed(1);
  const weekAvg = (week: number) => {
    const pts = teams.map((t) => captainPts(week, valueAt(week, t.id))).filter((p): p is number => p != null);
    return pts.length ? pts.reduce((a, b) => a + b, 0) / pts.length : null;
  };

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">TEAM CAPTAINS</h1>
              <p className="text-sm text-muted-foreground">
                Captain points = 0.25 × that player's score for the week. A player can captain twice; any QB only once.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Avg captain score', value: summary.n ? summary.avg.toFixed(1) : '—' },
              { label: 'Median captain score', value: summary.n ? summary.med.toFixed(1) : '—' },
              { label: 'Top team', value: summary.top ? `${shortName(summary.top.team.name)} +${(summary.top.avg - summary.avg).toFixed(1)}` : '—', tone: 'text-primary' },
              { label: 'Bottom team', value: summary.bottom ? `${shortName(summary.bottom.team.name)} ${(summary.bottom.avg - summary.avg).toFixed(1)}` : '—', tone: 'text-accent' },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                <div className={cn('font-display text-lg font-bold', s.tone)}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="rounded-md border border-border bg-card">
            <table className="w-full table-fixed text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-16 p-2 text-left font-display">Week</th>
                  {teams.map((t) => (
                    <th key={t.id} className="p-1.5" title={t.name}>
                      <div className="flex flex-col items-center gap-1">
                        <TeamLogo teamName={t.name} size="lg" />
                        <span className="truncate w-full text-[10px] font-semibold text-muted-foreground">{shortName(t.name)}</span>
                      </div>
                    </th>
                  ))}
                  {isAdmin && <th className="w-20 p-2" />}
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => {
                  const locked = weekLocked(w);
                  return (
                    <tr key={w} className={cn('border-b border-border last:border-0', locked && 'bg-muted/30')}>
                      <td className="p-2 font-display font-bold">
                        <span className="inline-flex items-center gap-1">
                          {w}
                          {locked && <Lock size={11} className="text-muted-foreground" />}
                        </span>
                        {(() => { const a = weekAvg(w); return a != null ? <span className="block text-[10px] font-semibold text-win">avg {fmt(a)}</span> : null; })()}
                      </td>
                      {teams.map((t) => {
                        const pid = valueAt(w, t.id);
                        const player = pid ? playerById.get(pid) : undefined;
                        const pts = captainPts(w, pid);
                        const editable = isAdmin && !locked;
                         if (!editable) {
                           const { counts } = usage(t.id, w);
                           const timesUsed = pid ? (counts.get(pid) ?? 0) + 1 : 0;
                           const playerLocked = !!player && (timesUsed >= 2 || player.position === 'QB');
                           return (
                             <td key={t.id} className="p-1.5 align-middle">
                               {player ? (
                                 <div className="flex items-baseline justify-between gap-1">
                                   <span className={cn('truncate font-medium', playerLocked && 'text-red-600')} title={playerLocked ? `${player.name} — locked, can't be used again` : player.name}>{player.name}</span>
                                  <span className="shrink-0 text-[10px] text-muted-foreground">{pts != null ? fmt(pts) : '—'}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          );
                        }
                        const { counts, qbUsed } = usage(t.id, w);
                        const options = roster.filter((p) => p.teamId === t.id).sort((a, b) => a.position.localeCompare(b.position) || a.name.localeCompare(b.name));
                        return (
                          <td key={t.id} className="p-1 align-middle">
                            <div className="flex items-center gap-1">
                              <select
                                value={pid}
                                onChange={(e) => setDrafts((d) => ({ ...d, [`${w}:${t.id}`]: e.target.value }))}
                                className="h-7 w-full min-w-0 truncate rounded border border-input bg-background px-1 text-xs"
                              >
                                <option value="">—</option>
                                {options.map((p) => {
                                  const used = counts.get(p.id) ?? 0;
                                  const blocked = used >= 2 || (p.position === 'QB' && qbUsed);
                                  return (
                                    <option key={p.id} value={p.id} disabled={blocked}>
                                      {p.position} {p.name}{blocked ? ' 🔒' : used === 1 ? ' (1)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                              {pts != null && <span className="shrink-0 text-[10px] text-muted-foreground">{fmt(pts)}</span>}
                            </div>
                          </td>
                        );
                      })}
                      {isAdmin && (
                        <td className="p-1 text-center">
                          {locked ? (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => unlockWeek(w)}>
                              <Unlock size={12} /> Unlock
                            </Button>
                          ) : (
                            <Button size="sm" variant="accent" className="h-7 px-2 text-xs" disabled={saving === w} onClick={() => submitWeek(w)}>
                              Submit
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Crown size={12} className="text-gold" /> Scores fill in automatically after "Refresh from ESPN." Red name = locked (used twice, or a QB was already captained).
            {!isAdmin && ' Sign in as commissioner to make picks.'}
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default TeamCaptains;
