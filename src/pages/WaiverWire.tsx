import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useTeams, usePlayerSalaries, type PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { useTradeValues } from '@/hooks/useTradeValues';
import { usePowerRankRows, normalize, INJURY_MULTIPLIER, OUT_STATUSES, type Asset } from '@/hooks/usePowerRanks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Loader2, TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';

type EspnFA = {
  espnId: number;
  name: string;
  position: string;
  proTeam: string;
  injuryStatus: string;
  injuryNote: string | null;
  percentOwned: number;
  status: string;
  projPpg: number | null;
  weekProj: number | null;
  avgPpg: number | null;
  games: number;
  lastGame: number | null;
};

const posColors: Record<string, string> = {
  QB: 'bg-red-100 text-red-700 border-red-200',
  RB: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WR: 'bg-blue-100 text-blue-700 border-blue-200',
  TE: 'bg-amber-100 text-amber-700 border-amber-200',
};
const injLabel: Record<string, string> = { questionable: 'Q', doubtful: 'D', out: 'OUT', ir: 'IR' };
const f1 = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(1));
const valueTone = (v: number) =>
  v >= 80 ? 'bg-emerald-600 text-white' : v >= 60 ? 'bg-emerald-100 text-emerald-800' : v >= 40 ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground';

type SortKey = 'value' | 'ppg' | 'weekProj' | 'avgPpg' | 'lastGame';

const WaiverWire = () => {
  const { data: teams = [] } = useTeams();
  const { data: salaries = [] } = usePlayerSalaries();
  const [teamId, setTeamId] = useState('');
  const [drops, setDrops] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<string | null>(null);
  const [pos, setPos] = useState('ALL');
  const [sort, setSort] = useState<SortKey>('value');

  const { data: espn, isLoading: espnLoading, error } = useQuery({
    queryKey: ['espn-waivers'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('espn-waivers');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { week: number; players: EspnFA[] };
    },
  });

  // Anyone rostered in our league (incl. practice squads) is never a free agent here
  const rosteredNames = useMemo(
    () => new Set(salaries.filter((s) => s.teamId).map((s) => normalize(`${s.firstName} ${s.lastName}`.trim()))),
    [salaries]
  );
  const fas = useMemo(
    () => (espn?.players ?? []).filter((p) => !rosteredNames.has(normalize(p.name))),
    [espn, rosteredNames]
  );

  // Feed ESPN free agents into the Trade Value model on a fresh $1 → $1 → $125 → $150 deal
  const extra = useMemo<PlayerSalaryWithDetails[]>(
    () =>
      fas.map((p) => ({
        id: `espn-${p.espnId}`,
        firstName: p.name,
        lastName: '',
        position: p.position,
        fantasyTeam: 'Free Agent',
        teamId: null,
        franchiseTag: false,
        practiceSquad: false,
        salary2026: '1',
        salary2027: '1',
        salary2028: '125',
        salary2029: '150',
        actualPpg: p.avgPpg,
        gamesPlayed: p.games,
        espnProjPpg: p.projPpg,
        injuryStatus: p.injuryStatus,
        injuryWeeksOut: OUT_STATUSES.includes(p.injuryStatus) ? 1 : 0,
        injuryNote: p.injuryNote ?? null,
      })),
    [fas]
  );
  const { byName, byId, isLoading: tvLoading } = useTradeValues(extra);
  const { rows: prRows, whatIf, proj, loading: prLoading } = usePowerRankRows();

  const tableRows = useMemo(() => {
    const list = fas
      .filter((p) => pos === 'ALL' || (pos === 'PC' ? p.position === 'WR' || p.position === 'TE' : p.position === pos))
      .map((p) => {
        const tv = byName.get(normalize(p.name));
        return { ...p, key: String(p.espnId), value: tv?.value ?? 0, ppg: tv?.ppg ?? p.projPpg ?? 0 };
      });
    return list.sort((a, b) => ((b[sort] as number) ?? -1) - ((a[sort] as number) ?? -1));
  }, [fas, byName, pos, sort]);

  const myRoster = useMemo(() => prRows.find((r) => r.team.id === teamId)?.roster ?? [], [prRows, teamId]);
  const sortedRoster = useMemo(
    () => [...myRoster].sort((a, b) => (byId.get(a.id)?.value ?? 0) - (byId.get(b.id)?.value ?? 0)),
    [myRoster, byId]
  );

  const picked = tableRows.find((r) => r.key === pick) ?? null;

  const result = useMemo(() => {
    if (!teamId || !picked) return null;
    const before = prRows.findIndex((r) => r.team.id === teamId);
    if (before < 0) return null;
    const mult = INJURY_MULTIPLIER[picked.injuryStatus] ?? 1;
    const basePpg = proj[normalize(picked.name)] ?? picked.ppg ?? picked.avgPpg ?? 0;
    const asset: Asset = {
      id: `espn-${picked.espnId}`,
      name: picked.name,
      position: picked.position,
      ppg: basePpg * mult,
      projected: true,
      injuryStatus: picked.injuryStatus,
      weeksOut: OUT_STATUSES.includes(picked.injuryStatus) ? 1 : 0,
      out: OUT_STATUSES.includes(picked.injuryStatus),
    };
    const after = whatIf(teamId, drops, [asset]);
    const oldRow = prRows[before];
    const newIdx = after.findIndex((r) => r.team.id === teamId);
    const newRow = after[newIdx];
    const dropped = myRoster.filter((p) => drops.has(p.id));
    const dropVal = Math.max(0, ...dropped.map((p) => byId.get(p.id)?.value ?? 0));
    const lineupDelta = newRow.starterPpw - oldRow.starterPpw;
    const scoreDelta = newRow.score - oldRow.score;
    const rankDelta = before - newIdx; // positive = moved up
    const inLineup = newRow.starters.some((s) => s.id === asset.id);
    const topDrop = [...dropped].sort((a, b) => (byId.get(b.id)?.value ?? 0) - (byId.get(a.id)?.value ?? 0))[0];

    const bull = lineupDelta > 0.2
      ? `${picked.name} steps straight into your starting lineup and adds about ${lineupDelta.toFixed(1)} points a week.`
      : picked.value > dropVal
        ? `${picked.name} is worth more long-term than who you're cutting (${picked.value} vs ${dropVal}).`
        : (picked.weekProj ?? 0) >= 10
          ? `He's projected for ${f1(picked.weekProj)} points this week, a useful fill-in.`
          : `He costs just $1 for the next two seasons, so there's no cap risk.`;
    const bear = topDrop && (byId.get(topDrop.id)?.value ?? 0) > picked.value
      ? `Cutting ${topDrop.name} (${byId.get(topDrop.id)?.value ?? 0}) gives up more long-term value than you get back.`
      : OUT_STATUSES.includes(picked.injuryStatus)
        ? `He's currently injured, so he won't help you this week.`
        : !inLineup
          ? `He doesn't crack your starting lineup, so this is only a depth move.`
          : !drops.size
            ? `You haven't picked anyone to drop, and you'll need an open roster spot.`
            : `His salary jumps to $125 in 2028, so he's likely a short-term rental.`;
    const good = scoreDelta > 0 || rankDelta > 0 || (scoreDelta === 0 && picked.value > dropVal);
    const base = good
      ? `Make the claim${rankDelta > 0 ? ` — it moves you up ${rankDelta} spot${rankDelta === 1 ? '' : 's'} in the Power Ranks` : scoreDelta > 0 ? ' — it makes your team a little stronger' : ' as a stash'}.`
      : scoreDelta < 0 || rankDelta < 0
        ? `Pass — this makes your team weaker than it is now.`
        : `Pass unless you need the roster spot — it doesn't move the needle.`;

    return { oldRank: before + 1, newRank: newIdx + 1, rankDelta, oldScore: oldRow.score, newScore: newRow.score, scoreDelta, lineupDelta, bull, bear, base };
  }, [teamId, picked, drops, prRows, whatIf, proj, myRoster, byId]);

  const loading = espnLoading || tvLoading || prLoading;
  const teamName = teams.find((t) => t.id === teamId)?.name;

  const SortHead = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="px-2 py-2 text-right">
      <button type="button" onClick={() => setSort(k)} className={cn('inline-flex items-center gap-1 uppercase', sort === k && 'text-primary font-bold')}>
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );

  return (
    <Layout>
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold">WAIVER WIRE</h1>
            <p className="text-sm text-muted-foreground">
              Every available player on ESPN{espn?.week ? ` (Week ${espn.week})` : ''}. Pick your team, check who you'd drop, then click a free agent to see what the move does for you.
            </p>
          </div>

          {/* Recommendation */}
          <div className="mb-5 rounded-lg border border-border bg-card p-4 shadow-sm">
            {result && picked ? (
              <div className="grid gap-4 md:grid-cols-[auto,1fr] md:items-center">
                <div className="text-center md:border-r md:border-border md:pr-6">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Power Rank</div>
                  <div className={cn('flex items-center justify-center gap-2', result.rankDelta > 0 ? 'text-emerald-600' : result.rankDelta < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                    {result.rankDelta > 0 ? <TrendingUp className="h-7 w-7" /> : result.rankDelta < 0 ? <TrendingDown className="h-7 w-7" /> : <Minus className="h-7 w-7" />}
                    <span className="font-mono text-5xl font-extrabold tabular-nums">
                      {result.rankDelta > 0 ? '+' : ''}{result.rankDelta}
                    </span>
                  </div>
                  <div className="text-sm font-semibold">#{result.oldRank} → #{result.newRank}</div>
                  <div className="text-xs text-muted-foreground">
                    Score {result.oldScore} → {result.newScore} · Lineup {result.lineupDelta >= 0 ? '+' : ''}{result.lineupDelta.toFixed(1)} pts/wk
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {teamName}: add <b className="text-foreground">{picked.name}</b>
                    {drops.size ? <> · drop <b className="text-foreground">{myRoster.filter((p) => drops.has(p.id)).map((p) => p.name).join(', ')}</b></> : ' · no drop selected'}
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    <li><span className="font-bold text-emerald-600">Bull:</span> {result.bull}</li>
                    <li><span className="font-bold text-destructive">Bear:</span> {result.bear}</li>
                    <li><span className="font-bold text-foreground">Base:</span> {result.base}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-3">
                {!teamId ? 'Choose your team below to get started.' : 'Click a free agent in the list to see how he changes your Power Rank.'}
              </p>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
            {/* Team + drops */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden self-start">
              <div className="border-b border-border bg-muted/50 p-3">
                <Select value={teamId} onValueChange={(v) => { setTeamId(v); setDrops(new Set()); }}>
                  <SelectTrigger className="font-display uppercase tracking-wide text-sm">
                    <SelectValue placeholder="Select your team" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">Check who you plan to drop (lowest value first).</p>
              </div>
              <ul className="divide-y divide-border/40 max-h-[560px] overflow-y-auto">
                {sortedRoster.map((p) => {
                  const v = byId.get(p.id)?.value ?? 0;
                  const on = drops.has(p.id);
                  return (
                    <li key={p.id}>
                      <label className={cn('flex items-center gap-2 px-3 py-1 text-sm cursor-pointer', on ? 'bg-destructive/10' : 'hover:bg-muted/50')}>
                        <Checkbox
                          checked={on}
                          onCheckedChange={() => setDrops((prev) => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; })}
                        />
                        <span className={cn('inline-flex w-7 justify-center rounded text-[10px] font-bold border shrink-0', posColors[p.position])}>{p.position}</span>
                        <span className="truncate font-medium">{p.name}</span>
                        <span className={cn('ml-auto rounded px-1.5 text-[11px] font-bold tabular-nums', valueTone(v))}>{v}</span>
                      </label>
                    </li>
                  );
                })}
                {teamId && !sortedRoster.length && <li className="p-4 text-center text-sm text-muted-foreground">No players.</li>}
              </ul>
            </div>

            {/* Free agents */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2">
                {[['ALL', 'All'], ['QB', 'QB'], ['RB', 'RB'], ['PC', 'Pass Catchers']].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setPos(k)}
                    className={cn('rounded px-3 py-1 text-xs font-semibold uppercase', pos === k ? 'bg-primary text-primary-foreground' : 'hover:bg-background')}>
                    {l}
                  </button>
                ))}
                <span className="ml-auto text-xs text-muted-foreground pr-2">{tableRows.length} available</span>
              </div>
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
              ) : error ? (
                <p className="p-6 text-center text-sm text-destructive">Couldn't reach ESPN right now. Try again in a minute.</p>
              ) : (
                <div className="max-h-[640px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card text-[11px] text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-3 py-2 text-left uppercase">Player</th>
                        <SortHead k="value" label="Value" />
                        <SortHead k="ppg" label="Proj PPG" />
                        <SortHead k="weekProj" label="This Wk" />
                        <SortHead k="avgPpg" label="Avg" />
                        <SortHead k="lastGame" label="Last" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {tableRows.map((p) => (
                        <tr key={p.key} onClick={() => setPick(p.key)}
                          className={cn('cursor-pointer', pick === p.key ? 'bg-primary/10' : 'hover:bg-muted/50')}>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className={cn('inline-flex w-7 justify-center rounded text-[10px] font-bold border shrink-0', posColors[p.position])}>{p.position}</span>
                              <span className="font-medium">{p.name}</span>
                              <span className="text-[11px] text-muted-foreground">{p.proTeam}</span>
                              {p.injuryStatus !== 'healthy' && (
                                <span title={p.injuryNote ?? undefined} className={cn('rounded px-1 text-[9px] font-bold border', OUT_STATUSES.includes(p.injuryStatus) ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200', p.injuryNote && 'cursor-help')}>
                                  {injLabel[p.injuryStatus] ?? p.injuryStatus}
                                </span>
                              )}
                              {p.status === 'WAIVERS' && <span className="text-[9px] uppercase text-muted-foreground">WV</span>}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <span className={cn('rounded px-1.5 text-[11px] font-bold tabular-nums', valueTone(p.value))}>{p.value}</span>
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono tabular-nums">{f1(p.ppg)}</td>
                          <td className="px-2 py-1.5 text-right font-mono tabular-nums">{f1(p.weekProj)}</td>
                          <td className="px-2 py-1.5 text-right font-mono tabular-nums">{f1(p.avgPpg)}</td>
                          <td className="px-2 py-1.5 text-right font-mono tabular-nums">{f1(p.lastGame)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WaiverWire;
