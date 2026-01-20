import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useActiveSeasonStandings, usePlayoffOutcomes } from '@/hooks/useLeagueData';
import { Trophy, Medal, AlertTriangle, Skull, Swords, Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const getPlayoffTier = (rank: number): 'playoff' | 'purgatory' | 'toilet' => {
  if (rank <= 4) return 'playoff';
  if (rank === 5) return 'purgatory';
  return 'toilet';
};

const Season2025 = () => {
  const { data: standings = [], isLoading: standingsLoading, error: standingsError } = useActiveSeasonStandings();
  const { data: playoffs = [], isLoading: playoffsLoading, error: playoffsError } = usePlayoffOutcomes();

  const isLoading = standingsLoading || playoffsLoading;
  const error = standingsError || playoffsError;

  // Derive playoff bracket info from outcomes
  const playoffBracket = useMemo(() => {
    if (playoffs.length === 0) return null;

    // Finalists are those who made the championship game
    const finalists = playoffs.filter(p => p.isFinalist);
    // Champion is the finalist with the higher finals score
    const sortedFinalists = [...finalists].sort((a, b) => (b.finalsScore || 0) - (a.finalsScore || 0));
    const champion = sortedFinalists[0];
    const runnerUp = sortedFinalists[1];
    
    // 3rd place match: non-finalists who have a finals score (played in consolation)
    const thirdPlaceMatch = playoffs.filter(p => !p.isFinalist && p.finalsScore);
    const sortedThirdPlace = [...thirdPlaceMatch].sort((a, b) => (b.finalsScore || 0) - (a.finalsScore || 0));
    const thirdPlace = sortedThirdPlace[0];
    const fourthPlace = sortedThirdPlace[1];
    
    const fifthSeed = playoffs.find(p => p.rank === 5);

    return { champion, runnerUp, thirdPlace, fourthPlace, fifthSeed };
  }, [playoffs]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-destructive">Error loading season data</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">2025 SEASON</h1>
            <p className="text-muted-foreground">
              13-week regular season • Weeks 14-15 Semifinals • Weeks 16-17 Finals
            </p>
          </motion.div>

          {/* Current Standings Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 grid md:grid-cols-3 gap-6"
          >
            {/* Playoffs Section (1-4) */}
            <div className="bg-card rounded-lg border border-win/30 overflow-hidden">
              <div className="bg-win/10 px-4 py-3 border-b border-win/20">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-win flex items-center gap-2">
                  <Trophy size={16} />
                  If Playoffs Started Tomorrow
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {standings.filter(s => s.rank <= 4).map((standing) => (
                  <div
                    key={standing.id}
                    className="flex items-center justify-between p-3 rounded-md bg-win/5 border border-win/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-lg w-6 text-win">
                        {standing.rank}
                      </span>
                      {standing.rank === 1 && <Trophy size={16} className="text-gold" />}
                      {standing.rank === 2 && <Medal size={16} className="text-muted-foreground" />}
                      {standing.rank === 3 && <Medal size={16} className="text-amber-700" />}
                      <div>
                        <p className="font-semibold text-sm">{standing.name}</p>
                        <p className="text-xs text-muted-foreground">{standing.owner}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-win">{standing.totalPoints}</p>
                      <p className="text-xs text-muted-foreground">{standing.pointsFor.toFixed(1)} PF</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purgatory Section (5) */}
            <div className="bg-card rounded-lg border border-amber-500/30 overflow-hidden">
              <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Purgatory
                </h3>
              </div>
              <div className="p-4">
                {standings.filter(s => s.rank === 5).map((standing) => (
                  <div
                    key={standing.id}
                    className="flex items-center justify-between p-4 rounded-md bg-amber-500/5 border border-amber-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-xl w-6 text-amber-500">
                        {standing.rank}
                      </span>
                      <div>
                        <p className="font-semibold">{standing.name}</p>
                        <p className="text-xs text-muted-foreground">{standing.owner}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-amber-500 text-lg">{standing.totalPoints}</p>
                      <p className="text-xs text-muted-foreground">{standing.pointsFor.toFixed(1)} PF</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center mt-3 italic">
                  Neither rewarded nor condemned
                </p>
              </div>
            </div>

            {/* Toilet Bowl Section (6-10) */}
            <div className="bg-card rounded-lg border border-loss/30 overflow-hidden">
              <div className="bg-loss/10 px-4 py-3 border-b border-loss/20">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-loss flex items-center gap-2">
                  <Skull size={16} />
                  The Toilet Bowl
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Presented by Ruggables™</p>
              </div>
              <div className="p-4 space-y-2">
                {standings.filter(s => s.rank >= 6).map((standing) => (
                  <div
                    key={standing.id}
                    className="flex items-center justify-between p-3 rounded-md bg-loss/5 border border-loss/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-lg w-6 text-loss">
                        {standing.rank}
                      </span>
                      {standing.rank === 10 && <Skull size={14} className="text-loss" />}
                      <div>
                        <p className="font-semibold text-sm">{standing.name}</p>
                        <p className="text-xs text-muted-foreground">{standing.owner}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-loss">{standing.totalPoints}</p>
                      <p className="text-xs text-muted-foreground">{standing.pointsFor.toFixed(1)} PF</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>


          {/* Playoff Bracket Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <Swords className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl font-bold">Playoff Bracket Results</h2>
            </div>
            
            {playoffBracket && playoffs.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Championship Match */}
                <div className="bg-card border border-gold/30 rounded-lg overflow-hidden">
                  <div className="bg-gold/10 px-4 py-3 border-b border-gold/20">
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider text-gold flex items-center gap-2">
                      <Crown size={16} />
                      Championship (Weeks 16-17)
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Champion */}
                    {playoffBracket.champion && (
                      <div className="flex items-center justify-between p-3 rounded-md bg-gold/10 border-2 border-gold/40">
                        <div className="flex items-center gap-3">
                          <Trophy size={20} className="text-gold" />
                          <div>
                            <p className="font-bold text-gold">{playoffBracket.champion.teamName}</p>
                            <p className="text-xs text-muted-foreground">{playoffBracket.champion.ownerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-gold text-lg">{playoffBracket.champion.finalsScore}</p>
                          <p className="text-xs text-gold uppercase">Champion</p>
                        </div>
                      </div>
                    )}
                    {/* Runner-up */}
                    {playoffBracket.runnerUp && (
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                        <div className="flex items-center gap-3">
                          <Medal size={18} className="text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{playoffBracket.runnerUp.teamName}</p>
                            <p className="text-xs text-muted-foreground">{playoffBracket.runnerUp.ownerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-muted-foreground">{playoffBracket.runnerUp.finalsScore}</p>
                          <p className="text-xs text-muted-foreground uppercase">Runner-Up</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3rd Place Match */}
                <div className="bg-card border border-amber-700/30 rounded-lg overflow-hidden">
                  <div className="bg-amber-700/10 px-4 py-3 border-b border-amber-700/20">
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider text-amber-700 flex items-center gap-2">
                      <Medal size={16} />
                      3rd Place Match (Weeks 16-17)
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* 3rd Place */}
                    {playoffBracket.thirdPlace && (
                      <div className="flex items-center justify-between p-3 rounded-md bg-amber-700/10 border border-amber-700/30">
                        <div className="flex items-center gap-3">
                          <Medal size={18} className="text-amber-700" />
                          <div>
                            <p className="font-semibold">{playoffBracket.thirdPlace.teamName}</p>
                            <p className="text-xs text-muted-foreground">{playoffBracket.thirdPlace.ownerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-amber-700">{playoffBracket.thirdPlace.finalsScore}</p>
                          <p className="text-xs text-amber-700 uppercase">3rd Place</p>
                        </div>
                      </div>
                    )}
                    {/* 4th Place */}
                    {playoffBracket.fourthPlace && (
                      <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border">
                        <div className="flex items-center gap-3">
                          <span className="font-display font-bold text-muted-foreground">4th</span>
                          <div>
                            <p className="font-semibold">{playoffBracket.fourthPlace.teamName}</p>
                            <p className="text-xs text-muted-foreground">{playoffBracket.fourthPlace.ownerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-muted-foreground">{playoffBracket.fourthPlace.semifinalScore}</p>
                          <p className="text-xs text-muted-foreground uppercase">4th Place</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Semifinals */}
                <div className="md:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-accent/10 px-4 py-3 border-b border-border">
                    <h3 className="font-display font-bold text-sm uppercase tracking-wider text-accent flex items-center gap-2">
                      <Swords size={16} />
                      Semifinals (Weeks 14-15)
                    </h3>
                  </div>
                  <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {playoffs.map((outcome) => (
                      <div
                        key={outcome.id}
                        className={cn(
                          "flex flex-col p-3 rounded-md border",
                          outcome.isFinalist 
                            ? "bg-win/5 border-win/30" 
                            : "bg-loss/5 border-loss/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-display font-bold text-xs text-muted-foreground">
                            Seed #{outcome.rank}
                          </span>
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded",
                            outcome.isFinalist 
                              ? "bg-win/20 text-win" 
                              : "bg-loss/20 text-loss"
                          )}>
                            {outcome.isFinalist ? "Advanced" : "Eliminated"}
                          </span>
                        </div>
                        <p className="font-semibold text-sm truncate">{outcome.teamName}</p>
                        <p className="text-xs text-muted-foreground">{outcome.ownerName}</p>
                        <p className="font-mono text-sm mt-1">{outcome.semifinalScore} pts</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  Playoff brackets will be populated when the regular season ends.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Season2025;
