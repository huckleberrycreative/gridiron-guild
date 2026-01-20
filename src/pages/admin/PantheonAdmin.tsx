import { useQuery } from '@tanstack/react-query';
import { seasonsApi } from '@/lib/api/seasons';
import { teamsApi } from '@/lib/api/teams';
import { playoffsApi } from '@/lib/api/playoffs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

export default function PantheonAdmin() {
  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  });

  const { data: allPlayoffs, isLoading } = useQuery({
    queryKey: ['all-playoffs'],
    queryFn: async () => {
      if (!seasons) return [];
      const results = await Promise.all(
        seasons.map(async (season) => {
          const outcomes = await playoffsApi.getOutcomesBySeason(season.id);
          return { season, outcomes };
        })
      );
      return results;
    },
    enabled: !!seasons && seasons.length > 0,
  });

  const getTeamName = (teamId: string) => {
    return teams?.find((t) => t.id === teamId)?.name || 'Unknown';
  };

  const champions = allPlayoffs
    ?.map((p) => {
      const champion = p.outcomes.find((o) => o.rank === 1);
      const runnerUp = p.outcomes.find((o) => o.rank === 2);
      return champion ? { 
        year: p.season.year, 
        championId: champion.team_id,
        runnerUpId: runnerUp?.team_id,
        finalsScore: champion.finals_score
      } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.year || 0) - (a?.year || 0));

  // Calculate championship counts
  const championshipCounts = champions?.reduce((acc, champ) => {
    if (champ?.championId) {
      acc[champ.championId] = (acc[champ.championId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedByTitles = Object.entries(championshipCounts || {})
    .map(([teamId, count]) => ({ teamId, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hall of Fame (Pantheon)</h1>
        <p className="text-gray-600 mt-2">
          Championship history is automatically generated from playoff outcomes. 
          Add playoff outcomes in the Playoffs admin page.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Championship Count
            </CardTitle>
            <CardDescription>Titles won by each team</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedByTitles.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No championship data yet</p>
            ) : (
              <div className="space-y-2">
                {sortedByTitles.map(({ teamId, count }, index) => (
                  <div key={teamId} className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                      {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                      {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                      <span className="font-medium">{getTeamName(teamId)}</span>
                    </div>
                    <Badge variant="secondary">{count} {count === 1 ? 'Title' : 'Titles'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              Quick Stats
            </CardTitle>
            <CardDescription>League overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">{seasons?.length || 0}</div>
                <div className="text-sm text-gray-600">Seasons</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">{teams?.length || 0}</div>
                <div className="text-sm text-gray-600">Teams</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">{champions?.length || 0}</div>
                <div className="text-sm text-gray-600">Championships</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded">
                <div className="text-2xl font-bold">{sortedByTitles.length || 0}</div>
                <div className="text-sm text-gray-600">Teams w/ Titles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Championship History</CardTitle>
          <CardDescription>Complete list of league champions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : champions && champions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Champion</TableHead>
                  <TableHead>Runner-Up</TableHead>
                  <TableHead>Finals Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {champions.map((champ) => champ && (
                  <TableRow key={champ.year}>
                    <TableCell className="font-medium">{champ.year}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        {getTeamName(champ.championId)}
                      </div>
                    </TableCell>
                    <TableCell>{champ.runnerUpId ? getTeamName(champ.runnerUpId) : '—'}</TableCell>
                    <TableCell>{champ.finalsScore?.toFixed(2) || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-gray-500">
              No championship data yet. Add playoff outcomes with rank 1 to create championship records.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
