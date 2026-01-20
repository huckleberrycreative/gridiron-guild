import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Recap {
  id: string;
  title: string;
  content: string | null;
  season_year: number | null;
  week_number: number | null;
  recap_date: string | null;
  published: boolean;
}

const Recaps = () => {
  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  // Fetch all published recaps from database
  const { data: recaps, isLoading } = useQuery({
    queryKey: ['recaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, content, season_year, week_number, recap_date, published')
        .eq('published', true)
        .order('recap_date', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as Recap[];
    },
  });

  // Get unique seasons for filter
  const seasons = recaps 
    ? [...new Set(recaps.map((r) => r.season_year).filter(Boolean) as number[])].sort((a, b) => b - a)
    : [];

  // Filter recaps by season
  const filteredRecaps = recaps?.filter((r) => 
    selectedSeason === 'all' || r.season_year === parseInt(selectedSeason)
  ) || [];

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">HISTORIC RECAPS</h1>
            <p className="text-muted-foreground">
              The complete archive of weekly recaps. Filter by season to relive the glory.
            </p>
          </motion.div>

          {/* Season Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {seasons.map((season) => (
                  <SelectItem key={season} value={season.toString()}>
                    {season} Season
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecaps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No recaps found.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredRecaps.map((recap, index) => (
                <motion.article
                  key={recap.id}
                  id={`week-${recap.season_year}-${recap.week_number}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * Math.min(index, 5) }}
                  className="scroll-mt-24"
                >
                  <div className="bg-card rounded-lg border border-border overflow-hidden shadow-md hover-lift">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary/90 p-6 md:p-8">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-accent-foreground text-xs font-display font-semibold uppercase tracking-wider rounded-full">
                          <Calendar size={12} />
                          {recap.season_year && recap.week_number 
                            ? `Season ${recap.season_year} • Week ${recap.week_number}`
                            : 'Recap'
                          }
                        </span>
                        {index === 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold text-gold-foreground text-xs font-display font-semibold uppercase tracking-wider rounded-full">
                            Latest
                          </span>
                        )}
                        <span className="text-primary-foreground/60 text-sm ml-auto">
                          {recap.recap_date && new Date(recap.recap_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">
                        {recap.title}
                      </h2>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                      <div 
                        className="prose prose-invert max-w-none [&>p:first-child]:text-lg [&>p:first-child]:leading-relaxed [&>p:first-child]:first-letter:text-4xl [&>p:first-child]:first-letter:font-display [&>p:first-child]:first-letter:font-bold [&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-2 [&>p:first-child]:first-letter:mt-1"
                        dangerouslySetInnerHTML={{ __html: recap.content || '' }}
                      />
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Recaps;
