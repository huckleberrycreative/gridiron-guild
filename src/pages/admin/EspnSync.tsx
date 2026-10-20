import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type EspnTeam = { espnId: number; espnName: string; mappedTeamId: string | null };

type SyncResult = {
  ok?: boolean;
  error?: string;
  teamsSynced?: number;
  unmatchedTeams?: string[];
  espnTeams?: EspnTeam[];
  playersAdded?: string[];
  rosterMoves?: number;
  released?: number;
  injuryUpdates?: number;
  weeksSynced?: number;
  practiceSquad?: {
    holdingRosters?: string[];
    espnCount?: number;
    unassigned?: string[];
    dropped?: string[];
  };
};

const NONE = 'none';

export default function EspnSync() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [mappings, setMappings] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (result?.espnTeams) {
      setMappings(
        Object.fromEntries(result.espnTeams.map((t) => [t.espnId, t.mappedTeamId ?? NONE]))
      );
    }
  }, [result?.espnTeams]);

  const run = async (withMappings = false) => {
    setLoading(true);
    try {
      const body = withMappings
        ? {
            mappings: Object.fromEntries(
              Object.entries(mappings).map(([k, v]) => [k, v === NONE ? null : v])
            ),
          }
        : {};
      const { data, error } = await supabase.functions.invoke<SyncResult>('espn-sync', { body });
      if (error) throw error;
      setResult(data ?? null);
      if (data?.error) {
        toast({ title: 'Sync failed', description: data.error, variant: 'destructive' });
      } else {
        toast({
          title: 'Rosters refreshed',
          description: `${data?.teamsSynced ?? 0} teams updated from ESPN.`,
        });
        [
          'player-salaries',
          'injury-rows',
          'weekly-scores',
          'weekly-scores-admin',
          'teams',
          'standings',
          'active-season-standings',
        ].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      }
    } catch (e: any) {
      toast({ title: 'Sync failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">ESPN Sync</h1>
        <p className="text-sm text-muted-foreground">
          Pulls current rosters, injury statuses, and completed weekly scores straight from the
          ESPN league. Players ESPN shows on a roster move to that team, anyone no longer rostered
          becomes a free agent, and new players are added at $1.
        </p>
      </div>

      <Button onClick={() => run(false)} disabled={loading} size="lg">
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Refreshing from ESPN...' : 'Refresh from ESPN'}
      </Button>

      {result && !result.error && (
        <div className="bg-white rounded-lg border p-5 space-y-2 text-sm">
          <p><strong>{result.teamsSynced}</strong> teams synced</p>
          <p><strong>{result.rosterMoves}</strong> roster changes applied</p>
          <p><strong>{result.released}</strong> players moved to free agency</p>
          <p><strong>{result.injuryUpdates}</strong> injury statuses changed</p>
          <p><strong>{result.weeksSynced}</strong> completed weeks of scores loaded</p>
          {!!result.playersAdded?.length && (
            <p>
              <strong>New players added at $1:</strong> {result.playersAdded.join(', ')}
            </p>
          )}
        </div>
      )}

      {result && !result.error && result.practiceSquad && (
        <div className="bg-white rounded-lg border p-5 space-y-2 text-sm">
          <h2 className="font-semibold">Practice squad check</h2>
          <p className="text-muted-foreground">
            The ESPN practice squad rosters are never imported as teams. They're only used to
            double-check the practice squad players assigned to each league team.
          </p>
          <p>
            <strong>{result.practiceSquad.espnCount ?? 0}</strong> players sitting on ESPN's
            practice squad rosters
          </p>
          {result.practiceSquad.unassigned?.length ? (
            <p className="text-amber-700">
              <strong>Not assigned to a team's practice squad yet:</strong>{' '}
              {result.practiceSquad.unassigned.join(', ')}
            </p>
          ) : null}
          {result.practiceSquad.dropped?.length ? (
            <p className="text-destructive">
              <strong>Marked practice squad here but no longer on ESPN:</strong>{' '}
              {result.practiceSquad.dropped.join(', ')}
            </p>
          ) : null}
          {!result.practiceSquad.unassigned?.length && !result.practiceSquad.dropped?.length && (
            <p className="text-green-700">Everything matches up.</p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="bg-white rounded-lg border border-destructive p-5 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {!!result?.espnTeams?.length && (
        <div className="bg-white rounded-lg border p-5 space-y-4">
          <div>
            <h2 className="font-semibold">Team matching</h2>
            <p className="text-sm text-muted-foreground">
              Every ESPN team below needs to point at the right league team. Leave one as
              "Ignore" and its players won't be touched.
            </p>
          </div>
          <div className="space-y-2">
            {result.espnTeams.map((t) => (
              <div key={t.espnId} className="flex items-center gap-3">
                <span className="w-1/2 text-sm">{t.espnName}</span>
                <Select
                  value={mappings[t.espnId] ?? NONE}
                  onValueChange={(v) => setMappings((m) => ({ ...m, [t.espnId]: v }))}
                >
                  <SelectTrigger className="w-1/2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Ignore this team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => run(true)} disabled={loading}>
            Save matching and re-sync
          </Button>
        </div>
      )}
    </div>
  );
}
