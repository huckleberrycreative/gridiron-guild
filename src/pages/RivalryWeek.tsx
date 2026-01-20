import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Swords, Trophy, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRivalries, Rivalry } from '@/hooks/useRivalries';
import { Skeleton } from '@/components/ui/skeleton';

const RivalryWeek = () => {
  const { data: rivalries, isLoading, error } = useRivalries();
  const [selectedRivalry, setSelectedRivalry] = useState<Rivalry | null>(null);

  // Set first rivalry as selected when data loads
  useEffect(() => {
    if (rivalries && rivalries.length > 0 && !selectedRivalry) {
      setSelectedRivalry(rivalries[0]);
    }
  }, [rivalries, selectedRivalry]);

  // Calculate lifetime record
  const calculateRecord = (rivalry: Rivalry) => {
    const team1Wins = rivalry.matchups.filter(m => m.winner === 'team1').length;
    const team2Wins = rivalry.matchups.filter(m => m.winner === 'team2').length;
    return { team1Wins, team2Wins };
  };

  if (isLoading) {
    return (
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-8" />
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/4">
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="md:w-3/4">
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error || !rivalries || rivalries.length === 0) {
    return (
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">RIVALRY WEEK</h1>
            <p className="text-muted-foreground">No rivalries have been configured yet.</p>
          </div>
        </section>
      </Layout>
    );
  }

  const currentRivalry = selectedRivalry || rivalries[0];
  const record = calculateRecord(currentRivalry);

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">RIVALRY WEEK</h1>
            <p className="text-muted-foreground">
              When regular season matchups become legendary battles.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Sidebar - Rivalry List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:w-1/4"
            >
              <div className="bg-card rounded-lg border border-border overflow-hidden sticky top-24">
                <div className="bg-primary/10 px-4 py-3 border-b border-border">
                  <h2 className="font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Swords size={16} />
                    The Rivalries
                  </h2>
                </div>
                <nav className="divide-y divide-border">
                  {rivalries.map((rivalry) => (
                    <button
                      key={rivalry.id}
                      onClick={() => setSelectedRivalry(rivalry)}
                      className={cn(
                        'w-full text-left px-4 py-3 transition-colors hover:bg-accent/10',
                        currentRivalry.id === rivalry.id
                          ? 'bg-accent/20 border-l-4 border-accent'
                          : ''
                      )}
                    >
                      <span className="font-semibold block">{rivalry.game_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {rivalry.team1_governor} vs {rivalry.team2_governor}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Right Content - Rivalry Details */}
            <div className="md:w-3/4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRivalry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-lg border border-border overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-lg">
                        <Swords size={40} className="text-accent" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-display text-2xl md:text-3xl font-bold mb-1">
                          {currentRivalry.game_name}
                        </h2>
                        {currentRivalry.slogan && (
                          <p className="text-lg text-accent italic mb-3">
                            "{currentRivalry.slogan}"
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {currentRivalry.trophy_name && (
                            <span className="inline-flex items-center gap-1 text-sm bg-gold/20 text-gold px-3 py-1 rounded-full">
                              <Trophy size={14} />
                              {currentRivalry.trophy_name}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-sm bg-background/50 px-3 py-1 rounded-full">
                            <Award size={14} />
                            {currentRivalry.matchups.length} Meetings
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matchup Header */}
                  <div className="px-6 md:px-8 py-4 bg-muted/30 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <p className="font-display font-bold text-lg">{currentRivalry.team1_governor}</p>
                      </div>
                      <div className="px-6 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">All-Time</p>
                        <p className="font-mono font-bold text-xl">
                          <span className={cn(record.team1Wins > record.team2Wins ? 'text-win' : 'text-foreground')}>
                            {record.team1Wins}
                          </span>
                          <span className="text-muted-foreground mx-1">-</span>
                          <span className={cn(record.team2Wins > record.team1Wins ? 'text-win' : 'text-foreground')}>
                            {record.team2Wins}
                          </span>
                        </p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="font-display font-bold text-lg">{currentRivalry.team2_governor}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Origin Story */}
                    {currentRivalry.origin_story && currentRivalry.origin_story.length > 0 && (
                      <div>
                        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                          The Origins
                        </h3>
                        <div className="space-y-4">
                          {currentRivalry.origin_story.map((paragraph, idx) => (
                            <p key={idx} className="text-foreground leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lifetime Record Banner */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                          <p className="font-display font-bold text-2xl text-win">{record.team1Wins}</p>
                          <p className="text-sm text-muted-foreground">{currentRivalry.team1_governor}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Lifetime Record</p>
                          <Swords className="mx-auto my-1 text-accent" size={24} />
                        </div>
                        <div className="text-center">
                          <p className="font-display font-bold text-2xl text-win">{record.team2Wins}</p>
                          <p className="text-sm text-muted-foreground">{currentRivalry.team2_governor}</p>
                        </div>
                      </div>
                    </div>

                    {/* Historic Matchups Table */}
                    <div>
                      <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                        Season-by-Season Results
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left py-3 px-4 font-semibold">Season</th>
                              <th className="text-center py-3 px-4 font-semibold">{currentRivalry.team1_governor}</th>
                              <th className="text-center py-3 px-4 font-semibold">{currentRivalry.team2_governor}</th>
                              <th className="text-right py-3 px-4 font-semibold">Winner</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentRivalry.matchups.map((matchup) => (
                              <tr key={matchup.season} className="border-b border-border hover:bg-muted/20">
                                <td className="py-3 px-4 font-mono font-bold">{matchup.season}</td>
                                <td className={cn(
                                  'py-3 px-4 text-center font-mono',
                                  matchup.winner === 'team1' ? 'text-win font-bold' : ''
                                )}>
                                  {matchup.team1_score.toFixed(2)}
                                </td>
                                <td className={cn(
                                  'py-3 px-4 text-center font-mono',
                                  matchup.winner === 'team2' ? 'text-win font-bold' : ''
                                )}>
                                  {matchup.team2_score.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
                                    'bg-win/20 text-win'
                                  )}>
                                    <Trophy size={12} />
                                    {matchup.winner === 'team1' ? currentRivalry.team1_governor : currentRivalry.team2_governor}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Trophy Section */}
                    {currentRivalry.trophy_name && (
                      <div className="bg-gold/10 rounded-lg p-4 border border-gold/30 text-center">
                        <Trophy className="mx-auto mb-2 text-gold" size={32} />
                        <p className="font-display font-bold text-lg">{currentRivalry.trophy_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Current Holder: {record.team1Wins >= record.team2Wins ? currentRivalry.team1_governor : currentRivalry.team2_governor}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default RivalryWeek;
