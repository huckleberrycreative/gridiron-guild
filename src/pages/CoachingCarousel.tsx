import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useCoachesByTeam, TeamCoachData } from '@/hooks/useCoaches';
import { Coach } from '@/lib/api/coaches';
import { ChevronLeft, ChevronRight, Trophy, Target, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const CoachingCarousel = () => {
  const { data: teamCoaches, isLoading, error } = useCoachesByTeam();

  if (isLoading) {
    return (
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <p className="text-destructive">Error loading coaching data</p>
          </div>
        </section>
      </Layout>
    );
  }

  const hasCoaches = teamCoaches && teamCoaches.length > 0;

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">COACHING CAROUSEL</h1>
            <p className="text-muted-foreground">
              The complete head coaching history for every franchise. Navigate through the eras.
            </p>
          </motion.div>

          {!hasCoaches ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Coaching Data Yet</h3>
              <p className="text-muted-foreground">
                Coaching history will appear here once added via the admin panel.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {teamCoaches.map((team, index) => (
                <motion.div
                  key={team.teamId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 * index }}
                >
                  <TeamCoachCard team={team} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

interface TeamCoachCardProps {
  team: TeamCoachData;
}

const TeamCoachCard = ({ team }: TeamCoachCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultipleCoaches = team.coaches.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, team.coaches.length - 1));
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-md">
      {/* Team Header */}
      <div className="bg-primary px-6 py-4">
        <h2 className="font-display text-xl font-bold text-primary-foreground">
          {team.teamName}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          {/* Previous Arrow */}
          {hasMultipleCoaches && (
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                currentIndex === 0
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-secondary hover:bg-accent hover:text-accent-foreground'
              )}
              aria-label="Previous coach"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Coach Cards Container */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out gap-4"
              style={{ transform: `translateX(-${currentIndex * (100 / Math.min(team.coaches.length, 3))}%)` }}
            >
              {team.coaches.map((coach, idx) => (
                <div
                  key={coach.id}
                  className={cn(
                    'flex-shrink-0 transition-opacity duration-300',
                    team.coaches.length === 1 ? 'w-full' : 
                    team.coaches.length === 2 ? 'w-[calc(50%-0.5rem)]' : 
                    'w-[calc(33.333%-0.667rem)]'
                  )}
                >
                  <CoachCard coach={coach} isHighlighted={idx === currentIndex} />
                </div>
              ))}
            </div>
          </div>

          {/* Next Arrow */}
          {hasMultipleCoaches && (
            <button
              onClick={goToNext}
              disabled={currentIndex === team.coaches.length - 1}
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                currentIndex === team.coaches.length - 1
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-secondary hover:bg-accent hover:text-accent-foreground'
              )}
              aria-label="Next coach"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {hasMultipleCoaches && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {team.coaches.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  idx === currentIndex
                    ? 'bg-accent w-6'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                aria-label={`Go to coach ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CoachCardProps {
  coach: Coach;
  isHighlighted: boolean;
}

const CoachCard = ({ coach, isHighlighted }: CoachCardProps) => {
  const totalGames = coach.wins + coach.losses;
  const winPct = totalGames > 0 ? ((coach.wins / totalGames) * 100).toFixed(1) : '0.0';
  const playoffGames = coach.playoff_wins + coach.playoff_losses;
  const playoffWinPct = playoffGames > 0 ? ((coach.playoff_wins / playoffGames) * 100).toFixed(1) : '-';

  const getTenureDisplay = () => {
    if (coach.is_current) {
      return `${coach.tenure_start} - Present`;
    }
    return `${coach.tenure_start} - ${coach.tenure_end || '?'}`;
  };

  return (
    <div
      className={cn(
        'bg-secondary/50 rounded-lg p-4 border transition-all',
        isHighlighted ? 'border-accent shadow-lg' : 'border-transparent'
      )}
    >
      {/* Photo and Name */}
      <div className="flex items-center gap-4 mb-3">
        <div
          className={cn(
            'flex-shrink-0 w-16 h-16 rounded-full overflow-hidden border-2',
            coach.is_current ? 'border-accent' : 'border-muted'
          )}
        >
          {coach.photo_url ? (
            <img
              src={coach.photo_url}
              alt={coach.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User size={24} className="text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold">{coach.name}</h3>
            {coach.is_current && (
              <span className="px-2 py-0.5 bg-accent text-accent-foreground text-xs font-display font-semibold uppercase tracking-wider rounded">
                Current
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{getTenureDisplay()}</p>
        </div>
      </div>

      {/* Tenure Summary */}
      {coach.tenure_summary && (
        <p className="text-sm text-muted-foreground italic mb-3 line-clamp-2">
          "{coach.tenure_summary}"
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-background/50 rounded p-2 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">W-L</p>
          <p className="font-mono text-sm font-bold">
            <span className="text-win">{coach.wins}</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-loss">{coach.losses}</span>
          </p>
          <p className="text-xs text-muted-foreground">{winPct}%</p>
        </div>

        <div className="bg-background/50 rounded p-2 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Playoff</p>
          <p className="font-mono text-sm font-bold">
            <span className="text-win">{coach.playoff_wins}</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-loss">{coach.playoff_losses}</span>
          </p>
          <p className="text-xs text-muted-foreground">{playoffWinPct}%</p>
        </div>

        <div className="bg-background/50 rounded p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Trophy size={10} className="text-gold" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Titles</p>
          </div>
          <p
            className={cn(
              'font-mono text-xl font-bold',
              coach.championships > 0 ? 'text-gold' : 'text-muted-foreground'
            )}
          >
            {coach.championships}
          </p>
        </div>

        <div className="bg-background/50 rounded p-2 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Target size={10} className="text-accent" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Playoffs</p>
          </div>
          <p className="font-mono text-xl font-bold text-accent">
            {coach.playoff_wins + coach.playoff_losses > 0 ? '✓' : '-'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoachingCarousel;
