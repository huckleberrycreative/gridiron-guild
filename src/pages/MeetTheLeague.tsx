import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useGovernorStats, GovernorStats } from '@/hooks/useGovernorStats';
import { User, Trophy, TrendingUp, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

// Generate dynamic bio content based on stats (fallback when no custom content)
const generateShieldBio = (governor: GovernorStats) => {
  const championshipText = governor.championships > 0 
    ? `a ${governor.championships}-time champion known for clutch playoff performances`
    : 'building competitive rosters year after year';
  
  return `${governor.name} has been a stalwart of Men's League for ${governor.yearsActive} seasons, commanding the ${governor.teamName} with a blend of shrewd drafting and calculated risk-taking. Known for ${championshipText}.`;
};

const generateGovernorResponse = (governor: GovernorStats) => {
  if (governor.championships >= 3) {
    return `"The Shield's bio is generous, but I'd add that my success comes from trusting the process and never panicking mid-season. Dynasty status achieved."`;
  } else if (governor.championships > 0) {
    return `"The Shield's bio is generous, but I'd add that my success comes from trusting the process and never panicking mid-season. Also, I've made some trades I'd rather forget."`;
  } else if (governor.playoffAppearances >= 5) {
    return `"Still chasing that elusive championship, but I've been knocking on the door. One of these years, it's going to break through."`;
  } else {
    return `"We're building something here. The foundation is solid, and the future is bright. Trust the process."`;
  }
};

const generateHighestHigh = (governor: GovernorStats) => {
  if (governor.championships > 0) {
    return `Winning ${governor.championships} Championship${governor.championships > 1 ? 's' : ''} - the ultimate glory`;
  } else if (governor.finalsAppearances > 0) {
    return `Making ${governor.finalsAppearances} Finals appearance${governor.finalsAppearances > 1 ? 's' : ''} - so close to glory`;
  } else if (governor.playoffAppearances > 0) {
    return `Making the playoffs ${governor.playoffAppearances} time${governor.playoffAppearances > 1 ? 's' : ''}`;
  }
  return `A strong regular season finish of ${governor.bestFinish}${getOrdinalSuffix(governor.bestFinish)} place`;
};

const generateLowestLow = (governor: GovernorStats) => {
  if (governor.worstFinish >= 9) {
    return `Finishing ${governor.worstFinish}${getOrdinalSuffix(governor.worstFinish)} place - a season best forgotten`;
  } else if (governor.worstFinish >= 7) {
    return `A disappointing ${governor.worstFinish}${getOrdinalSuffix(governor.worstFinish)} place finish`;
  }
  return `Even at worst, finishing ${governor.worstFinish}${getOrdinalSuffix(governor.worstFinish)} place`;
};

const getOrdinalSuffix = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

// Helper to get content with fallback
const getContent = (customValue: string | null | undefined, fallbackFn: () => string): string => {
  return customValue?.trim() || fallbackFn();
};

const MeetTheLeague = () => {
  const { data: governors, isLoading, error } = useGovernorStats();
  const [selectedGovernor, setSelectedGovernor] = useState<GovernorStats | null>(null);

  // Set default selected governor when data loads
  useEffect(() => {
    if (governors && governors.length > 0 && !selectedGovernor) {
      setSelectedGovernor(governors[0]);
    }
  }, [governors, selectedGovernor]);

  if (isLoading) {
    return (
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </section>
      </Layout>
    );
  }

  if (error || !governors) {
    return (
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <p className="text-destructive">Failed to load governor data.</p>
          </div>
        </section>
      </Layout>
    );
  }

  const currentGovernor = selectedGovernor || governors[0];
  const playoffPercentage = currentGovernor.yearsActive > 0 
    ? Math.round((currentGovernor.playoffAppearances / currentGovernor.yearsActive) * 100)
    : 0;

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">MEET THE LEAGUE</h1>
            <p className="text-muted-foreground">
              The Governors who shape the destiny of Men's League.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Sidebar - Governor List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:w-1/4"
            >
              <div className="bg-card rounded-lg border border-border overflow-hidden sticky top-24">
                <div className="bg-primary/10 px-4 py-3 border-b border-border">
                  <h2 className="font-display font-bold text-sm uppercase tracking-wider">
                    The Governors
                  </h2>
                </div>
                <nav className="divide-y divide-border">
                  {governors.map((governor) => (
                    <button
                      key={governor.id}
                      onClick={() => setSelectedGovernor(governor)}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-accent/10 flex items-center gap-3 ${
                        currentGovernor.id === governor.id
                          ? 'bg-accent/20 border-l-4 border-accent'
                          : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {governor.profileImageUrl ? (
                          <img 
                            src={governor.profileImageUrl} 
                            alt={governor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold block truncate">{governor.name}</span>
                        <span className="text-sm text-muted-foreground truncate block">{governor.teamName}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Right Content - Governor Profile */}
            <div className="md:w-3/4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentGovernor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-lg border border-border overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      {/* Avatar */}
                      <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-lg overflow-hidden">
                        {currentGovernor.profileImageUrl ? (
                          <img 
                            src={currentGovernor.profileImageUrl} 
                            alt={currentGovernor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={48} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="font-display text-2xl md:text-3xl font-bold mb-1">
                          {currentGovernor.name}
                        </h2>
                        <p className="text-lg text-accent font-semibold mb-2">
                          {currentGovernor.teamName}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-1 text-sm bg-background/50 px-3 py-1 rounded-full">
                            <Calendar size={14} />
                            {currentGovernor.yearsActive} Seasons
                          </span>
                          {currentGovernor.championships > 0 && (
                            <span className="inline-flex items-center gap-1 text-sm bg-gold/20 text-gold px-3 py-1 rounded-full">
                              <Trophy size={14} />
                              {currentGovernor.championships}x Champion
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Team Logo - Right Side */}
                      <TeamLogo teamName={currentGovernor.teamName} size="lg" className="w-16 h-16 md:w-20 md:h-20 hidden md:block" />
                    </div>
                  </div>

                  {/* Bio Sections */}
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Shield Bio */}
                    <div>
                      <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                        Official Shield Bio
                      </h3>
                      <p className="text-foreground leading-relaxed">
                        {getContent(currentGovernor.shieldBio, () => generateShieldBio(currentGovernor))}
                      </p>
                    </div>

                    {/* Governor's Response */}
                    <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-accent">
                      <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                        Governor's Response to the Shield's Bio
                      </h3>
                      <p className="text-foreground italic leading-relaxed">
                        {getContent(currentGovernor.governorResponse, () => generateGovernorResponse(currentGovernor))}
                      </p>
                    </div>

                    {/* Highs and Lows */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="text-green-500" size={20} />
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                            Highest High
                          </h3>
                        </div>
                        <p className="text-foreground">
                          {getContent(currentGovernor.highestHigh, () => generateHighestHigh(currentGovernor))}
                        </p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="text-red-500" size={20} />
                          <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                            Lowest Low
                          </h3>
                        </div>
                        <p className="text-foreground">
                          {getContent(currentGovernor.lowestLow, () => generateLowestLow(currentGovernor))}
                        </p>
                      </div>
                    </div>

                    {/* Stats Table */}
                    <div>
                      <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                        Career Statistics
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-3 font-semibold">Record</th>
                              <th className="text-left py-2 px-3 font-semibold">Playoff %</th>
                              <th className="text-left py-2 px-3 font-semibold">Playoff Record</th>
                              <th className="text-left py-2 px-3 font-semibold">Avg PF/Year</th>
                              <th className="text-left py-2 px-3 font-semibold">Total PF</th>
                              <th className="text-left py-2 px-3 font-semibold">Titles</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-2 px-3 font-mono">
                                {currentGovernor.totalWins}-{currentGovernor.totalLosses}
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {playoffPercentage}%
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {currentGovernor.playoffWins}-{currentGovernor.playoffLosses}
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {currentGovernor.avgPointsPerYear.toFixed(1)}
                              </td>
                              <td className="py-2 px-3 font-mono">
                                {currentGovernor.totalPointsFor.toFixed(0)}
                              </td>
                              <td className="py-2 px-3">
                                {currentGovernor.championships > 0 ? (
                                  <span className="text-gold font-bold">
                                    {currentGovernor.championships}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">0</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
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

export default MeetTheLeague;
