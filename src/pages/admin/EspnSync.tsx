import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SyncResult = {
  ok?: boolean;
  error?: string;
  teamsSynced?: number;
  unmatchedTeams?: string[];
  playersAdded?: string[];
  rosterMoves?: number;
  released?: number;
  injuryUpdates?: number;
  weeksSynced?: number;
};

export default function EspnSync() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke<SyncResult>('espn-sync', {
        body: {},
      });
      if (error) throw error;
      setResult(data ?? null);
      if (data?.error) {
        toast({ title: 'Sync failed', description: data.error, variant: 'destructive' });
      } else {
        toast({
          title: 'Rosters refreshed',
          description: `${data?.teamsSynced ?? 0} teams updated from ESPN.`,
        });
        ['player-salaries', 'injury-rows', 'weekly-scores', 'teams'].forEach((k) =>
          queryClient.invalidateQueries({ queryKey: [k] })
        );
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
          ESPN league. Players ESPN shows on a roster are moved to that team; anyone no longer
          rostered becomes a free agent. New players are added at $1.
        </p>
      </div>

      <Button onClick={run} disabled={loading} size="lg">
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
          {!!result.unmatchedTeams?.length && (
            <p className="text-destructive">
              <strong>Could not match these ESPN teams:</strong>{' '}
              {result.unmatchedTeams.join(', ')} — rename them to match, then run again.
            </p>
          )}
        </div>
      )}

      {result?.error && (
        <div className="bg-white rounded-lg border border-destructive p-5 text-sm text-destructive">
          {result.error}
        </div>
      )}
    </div>
  );
}
