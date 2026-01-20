import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Crown, Skull, AlertTriangle, ChevronRight, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { teams, comments, Comment, getAvgPPW } from '@/data/leagueData';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Index = () => {
  const [newComment, setNewComment] = useState({ teamName: '', comment: '' });
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  // Fetch latest published recap from database
  const { data: latestRecap, isLoading: recapLoading } = useQuery({
    queryKey: ['latest-recap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('recap_date', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Sort teams by total ranking points
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  // Split into playoff tiers
  const playoffTeams = sortedTeams.slice(0, 4);
  const purgatoryTeam = sortedTeams[4];
  const toiletBowlTeams = sortedTeams.slice(5);

  // Get comments for the current recap
  const recapComments = localComments.filter((c) => c.recapId === latestRecap?.id);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.teamName.trim() && newComment.comment.trim() && latestRecap) {
      const comment: Comment = {
        id: Date.now().toString(),
        teamName: newComment.teamName,
        comment: newComment.comment,
        date: new Date().toISOString().split('T')[0],
        recapId: latestRecap.id,
      };
      setLocalComments([...localComments, comment]);
      setNewComment({ teamName: '', comment: '' });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Weekly Recap (75%) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            {/* Featured Recap */}
            <motion.article
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
            >
              {recapLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-1/4" />
                  <div className="h-12 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              ) : latestRecap ? (
                <>
                  <div className="mb-6">
                    <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-xs font-display font-semibold uppercase tracking-wider rounded-full mb-4">
                      Season {latestRecap.season_year} • Week {latestRecap.week_number}
                    </span>
                    <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                      {latestRecap.title}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      {latestRecap.recap_date && new Date(latestRecap.recap_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Content from WYSIWYG */}
                  <div 
                    className="prose prose-lg max-w-none mb-10 [&>p:first-child]:first-letter:text-5xl [&>p:first-child]:first-letter:font-display [&>p:first-child]:first-letter:font-bold [&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-3 [&>p:first-child]:first-letter:mt-1"
                    dangerouslySetInnerHTML={{ __html: latestRecap.content || '' }}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No weekly recaps published yet.</p>
                </div>
              )}

              {/* View All Recaps Link */}
              <div className="border-t border-border pt-6 mb-10">
                <Link
                  to="/recaps"
                  className="inline-flex items-center gap-2 text-accent font-semibold hover:underline"
                >
                  View All Historic Recaps <ChevronRight size={18} />
                </Link>
              </div>

              {/* Letters to the Editor */}
              <motion.section
                variants={fadeInUp}
                transition={{ delay: 0.4 }}
                className="border-t border-border pt-10"
              >
                <h2 className="font-display text-2xl font-bold mb-6">
                  LETTERS TO THE EDITOR
                </h2>

                {/* Existing Comments */}
                <div className="space-y-4 mb-8">
                  {recapComments.length === 0 ? (
                    <p className="text-muted-foreground italic">No letters yet. Be the first to comment!</p>
                  ) : (
                    recapComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-card border border-border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-bold text-accent">
                            {comment.teamName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-foreground">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Form */}
                <form onSubmit={handleSubmitComment} className="bg-secondary/50 rounded-lg p-6">
                  <h3 className="font-display font-semibold mb-4">Submit Your Letter</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="teamName" className="block text-sm font-medium mb-1">
                        Team Name *
                      </label>
                      <Input
                        id="teamName"
                        value={newComment.teamName}
                        onChange={(e) => setNewComment({ ...newComment, teamName: e.target.value })}
                        placeholder="Enter your team name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium mb-1">
                        Comment *
                      </label>
                      <Textarea
                        id="comment"
                        value={newComment.comment}
                        onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                        placeholder="Share your thoughts..."
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" variant="accent" className="gap-2">
                      <Send size={16} />
                      Submit Letter
                    </Button>
                  </div>
                </form>
              </motion.section>
            </motion.article>
          </div>

          {/* Sidebar - Standings (25%) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sticky top-24"
            >
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
                <div className="bg-primary p-4">
                  <h2 className="font-display text-lg font-bold text-primary-foreground text-center">
                    LEAGUE STANDINGS
                  </h2>
                </div>

                {/* If the Playoffs Started Tomorrow */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} className="text-gold" />
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      If the Playoffs Started Tomorrow
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {playoffTeams.map((team, index) => (
                      <StandingsRow
                        key={team.id}
                        rank={index + 1}
                        team={team}
                        variant="playoff"
                      />
                    ))}
                  </div>
                </div>

                {/* Purgatory */}
                <div className="p-4 border-b border-border bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-amber-600">
                      Purgatory
                    </h3>
                  </div>
                  <StandingsRow
                    rank={5}
                    team={purgatoryTeam}
                    variant="purgatory"
                  />
                </div>

                {/* The Toilet Bowl */}
                <div className="p-4 bg-loss/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Skull size={16} className="text-loss" />
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-loss">
                      The Toilet Bowl, Presented by Ruggables™
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {toiletBowlTeams.map((team, index) => (
                      <StandingsRow
                        key={team.id}
                        rank={index + 6}
                        team={team}
                        variant="toilet"
                      />
                    ))}
                  </div>
                </div>

                {/* View Full Standings Link */}
                <div className="p-4 border-t border-border">
                  <Link
                    to="/standings"
                    className="flex items-center justify-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    Full Standings <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

interface StandingsRowProps {
  rank: number;
  team: typeof teams[0];
  variant: 'playoff' | 'purgatory' | 'toilet';
}

const StandingsRow = ({ rank, team, variant }: StandingsRowProps) => {
  const avgPPW = getAvgPPW(team);
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-md transition-colors',
        variant === 'playoff' && 'hover:bg-gold/10',
        variant === 'purgatory' && 'hover:bg-amber-500/10',
        variant === 'toilet' && 'hover:bg-loss/10'
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold',
          variant === 'playoff' && rank === 1 && 'bg-gold text-gold-foreground',
          variant === 'playoff' && rank > 1 && 'bg-primary/10 text-primary',
          variant === 'purgatory' && 'bg-amber-500/20 text-amber-600',
          variant === 'toilet' && 'bg-loss/20 text-loss'
        )}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{team.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{team.wins}-{team.losses}</span>
          <span>•</span>
          <span className="font-mono">{avgPPW.toFixed(1)} PPW</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-xs font-semibold text-accent">{team.totalPoints}</p>
        <p className="font-mono text-xs text-muted-foreground">{team.pointsFor.toFixed(0)}</p>
      </div>
    </div>
  );
};

export default Index;
