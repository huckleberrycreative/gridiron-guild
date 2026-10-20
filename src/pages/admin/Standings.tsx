import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { seasonsApi } from '@/lib/api/seasons';
import { teamsApi } from '@/lib/api/teams';
import { deriveStandings } from '@/lib/standingsFromScores';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';

export default function Standings() {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  });

  const selectedSeason = seasons?.find((s) => s.id === selectedSeasonId);

  const { data: weeklyScores, isLoading } = useQuery({
    queryKey: ['weekly-scores-admin', selectedSeason?.year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_scores')
        .select('week, team_id, score')
        .eq('season_year', selectedSeason!.year);
      if (error) throw error;
      return data as { week: number; team_id: string; score: number }[];
    },
    enabled: !!selectedSeason,
  });

  const standings = useMemo(() => {
    if (!weeklyScores?.length) return [];
    return deriveStandings(
      weeklyScores.map((r) => ({ week: r.week, teamId: r.team_id, score: Number(r.score) }))
    );
  }, [weeklyScores]);

  const getTeamName = (teamId: string) =>
    teams?.find((t) => t.id === teamId)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Regular Season Standings</h1>
        <p className="text-sm text-muted-foreground">
          Calculated automatically from weekly scores: each week the top 4 teams get a win, 5th
          place gets a tie, and 6th-10th get a loss. Refresh from ESPN or edit weekly scores and
          this updates itself — nothing to enter by hand.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="season-select">Select Season</Label>
        <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a season" />
          </SelectTrigger>
          <SelectContent>
            {seasons?.map((season) => (
              <SelectItem key={season.id} value={season.id}>
                {season.year} {season.is_active && '(Active)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedSeasonId ? (
        <div className="text-center py-8 text-gray-500">
          Select a season to view standings
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>W</TableHead>
                <TableHead>L</TableHead>
                <TableHead>T</TableHead>
                <TableHead>Standings Pts</TableHead>
                <TableHead>PF</TableHead>
                <TableHead>Avg PPW</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((s) => (
                <TableRow key={s.teamId}>
                  <TableCell>{s.rank}</TableCell>
                  <TableCell className="font-medium">{getTeamName(s.teamId)}</TableCell>
                  <TableCell>{s.wins}</TableCell>
                  <TableCell>{s.losses}</TableCell>
                  <TableCell>{s.ties}</TableCell>
                  <TableCell>{s.points}</TableCell>
                  <TableCell>{s.pf.toFixed(1)}</TableCell>
                  <TableCell>{s.avgPPW.toFixed(1)}</TableCell>
                </TableRow>
              ))}
              {standings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No weekly scores for this season yet. Use Refresh from ESPN or the Weekly
                    Scores page to add them.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
