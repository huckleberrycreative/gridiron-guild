import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Award } from 'lucide-react';

interface TeamStats {
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  totalPoints: number;
  avgPointsPerWeek: number;
  bestFinish: number;
  worstFinish: number;
  playoffAppearances: number;
  championships: number;
  seasons: Array<{
    year: number;
    wins: number;
    losses: number;
    rank: number;
    points: number;
  }>;
}

export default function TeamProfile() {
  const { teamSlug } = useParams<{ teamSlug: string }>();

  // Fetch team information
  const { data: team } = useQuery({
    queryKey: ['team', teamSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('name', teamSlug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch and calculate team stats from standings
  const { data: stats, isLoading } = useQuery({
    queryKey: ['team-stats', team?.id],
    queryFn: async () => {
      if (!team?.id) return null;

      // Get all regular season standings for this team
      const { data: standings, error } = await supabase
        .from('regular_season_standings')
        .select(`
          *,
          seasons (year)
        `)
        .eq('team_id', team.id)
        .order('seasons(year)', { ascending: true });

      if (error) throw error;

      // Get playoff statistics
      const { data: playoffStats } = await supabase
        .from('playoff_statistics')
        .select('*')
        .eq('team_id', team.id)
        .single();

      // Calculate aggregate stats
      const totalWins = standings.reduce((sum, s) => sum + (s.wins || 0), 0);
      const totalLosses = standings.reduce((sum, s) => sum + (s.losses || 0), 0);
      const totalPoints = standings.reduce((sum, s) => sum + (s.total_points_for || 0), 0);
      const totalGames = totalWins + totalLosses;

      const seasons = standings.map(s => ({
        year: s.seasons?.year || 0,
        wins: s.wins || 0,
        losses: s.losses || 0,
        rank: s.rank || 0,
        points: s.total_points_for || 0,
      }));

      const ranks = standings.map(s => s.rank).filter(r => r);
      const bestFinish = ranks.length > 0 ? Math.min(...ranks) : 0;
      const worstFinish = ranks.length > 0 ? Math.max(...ranks) : 0;

      return {
        totalWins,
        totalLosses,
        winPercentage: totalGames > 0 ? (totalWins / totalGames) * 100 : 0,
        totalPoints,
        avgPointsPerWeek: totalGames > 0 ? totalPoints / totalGames : 0,
        bestFinish,
        worstFinish,
        playoffAppearances: playoffStats?.playoff_appearances || 0,
        championships: playoffStats?.finals_wins || 0,
        seasons,
      } as TeamStats;
    },
    enabled: !!team?.id,
  });

  if (isLoading || !team || !stats) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
          {team.owner_name && (
            <p className="text-xl opacity-90">Owner: {team.owner_name}</p>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Career Record</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalWins}-{stats.totalLosses}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.winPercentage.toFixed(1)}% Win Rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Championships</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.championships}</div>
              <p className="text-xs text-muted-foreground">
                {stats.playoffAppearances} Playoff Appearances
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Finish</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{stats.bestFinish}</div>
              <p className="text-xs text-muted-foreground">
                Worst: #{stats.worstFinish}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Points/Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgPointsPerWeek.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPoints.toLocaleString()} Total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Season by Season */}
        <Card>
          <CardHeader>
            <CardTitle>Season by Season Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Season</th>
                    <th className="text-left py-3 px-4">Record</th>
                    <th className="text-left py-3 px-4">Win %</th>
                    <th className="text-left py-3 px-4">Finish</th>
                    <th className="text-right py-3 px-4">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.seasons.map((season) => {
                    const totalGames = season.wins + season.losses;
                    const winPct = totalGames > 0 ? (season.wins / totalGames) * 100 : 0;

                    return (
                      <tr key={season.year} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{season.year}</td>
                        <td className="py-3 px-4">
                          {season.wins}-{season.losses}
                        </td>
                        <td className="py-3 px-4">{winPct.toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            season.rank === 1 ? 'text-yellow-600' :
                            season.rank <= 3 ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            #{season.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {season.points.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
