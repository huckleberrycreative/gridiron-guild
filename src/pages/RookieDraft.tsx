import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { 
  useRookiePool, 
  useDraftPicks, 
  useTeams, 
  useUpdateDraftPick,
  useInitializeDraftPicks,
  RookiePlayer,
  DraftPick 
} from '@/hooks/useRookieDraft';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();

const positionColors: Record<string, string> = {
  QB: 'bg-red-500/20 text-red-700 border-red-300',
  RB: 'bg-green-500/20 text-green-700 border-green-300',
  WR: 'bg-blue-500/20 text-blue-700 border-blue-300',
  TE: 'bg-orange-500/20 text-orange-700 border-orange-300',
  K: 'bg-purple-500/20 text-purple-700 border-purple-300',
  DEF: 'bg-gray-500/20 text-gray-700 border-gray-300',
};

const RookieDraft = () => {
  const [draftYear, setDraftYear] = useState(CURRENT_YEAR);
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [selectedPickId, setSelectedPickId] = useState<string | null>(null);

  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { data: rookiePool, isLoading: poolLoading } = useRookiePool(draftYear);
  const { data: draftPicks, isLoading: picksLoading } = useDraftPicks(draftYear);
  const { data: teams } = useTeams();
  const updatePick = useUpdateDraftPick();
  const initializePicks = useInitializeDraftPicks();

  // Lock state stored in page_content
  const lockKey = `locked_${draftYear}`;
  const { data: lockRow } = useQuery({
    queryKey: ['rookie-draft-lock', draftYear],
    queryFn: async () => {
      const { data } = await supabase
        .from('page_content')
        .select('id, content')
        .eq('page_slug', 'rookie_draft')
        .eq('section_key', lockKey)
        .maybeSingle();
      return data;
    },
  });
  const isLocked = lockRow?.content === 'true';

  const handleFinalize = async () => {
    if (!confirm('Finalize the draft? This will lock the page and prevent further changes.')) return;
    if (lockRow?.id) {
      await supabase.from('page_content').update({ content: 'true' }).eq('id', lockRow.id);
    } else {
      await supabase.from('page_content').insert({
        page_slug: 'rookie_draft',
        section_key: lockKey,
        content_type: 'flag',
        content: 'true',
      });
    }
    queryClient.invalidateQueries({ queryKey: ['rookie-draft-lock', draftYear] });
    toast.success('Draft finalized and locked.');
  };

  const handleUnlock = async () => {
    if (!lockRow?.id) return;
    await supabase.from('page_content').update({ content: 'false' }).eq('id', lockRow.id);
    queryClient.invalidateQueries({ queryKey: ['rookie-draft-lock', draftYear] });
    toast.success('Draft unlocked.');
  };

  // Initialize draft picks for the year if they don't exist
  useEffect(() => {
    if (!picksLoading && draftPicks?.length === 0) {
      initializePicks.mutate(draftYear);
    }
  }, [draftYear, picksLoading, draftPicks]);

  // Get drafted player IDs to filter them out of the pool
  const draftedPlayerIds = new Set(
    draftPicks?.filter(p => p.selected_player_id).map(p => p.selected_player_id) || []
  );

  // Parse rank from notes ("Rank 12") for sort/display
  const parseRank = (notes: string | null): number => {
    const m = notes?.match(/Rank\s+(\d+)/i);
    return m ? parseInt(m[1], 10) : 9999;
  };

  // Filter available players, sorted by rank
  const availablePlayers = (rookiePool || [])
    .filter((player) => {
      if (draftedPlayerIds.has(player.id)) return false;
      if (positionFilter !== 'all' && player.position !== positionFilter) return false;
      return true;
    })
    .sort((a, b) => parseRank(a.notes) - parseRank(b.notes));

  // Get unique positions for filter
  const positions = [...new Set(rookiePool?.map(p => p.position) || [])].sort();

  // Group picks by round
  const picksByRound = draftPicks?.reduce((acc, pick) => {
    if (!acc[pick.round]) acc[pick.round] = [];
    acc[pick.round].push(pick);
    return acc;
  }, {} as Record<number, DraftPick[]>) || {};

  const handleDraftPlayer = (player: RookiePlayer) => {
    if (isLocked) return;
    if (!selectedPickId) {
      toast.error('Select a draft pick first');
      return;
    }
    const pick = draftPicks?.find(p => p.id === selectedPickId);
    if (!pick) return;
    if (pick.selected_player_id) {
      toast.error('That pick already has a player');
      return;
    }
    updatePick.mutate({
      pickId: selectedPickId,
      selectedPlayerId: player.id,
    });
    setSelectedPickId(null);
    try {
      const audio = new Audio('/sounds/draft-chime.mp3');
      audio.play().catch(() => {});
    } catch {}
  };

  const handleRemovePlayer = (pick: DraftPick) => {
    if (isLocked) return;
    updatePick.mutate({
      pickId: pick.id,
      selectedPlayerId: null,
    });
  };

  const handleTeamChange = (pickId: string, teamId: string) => {
    if (isLocked) return;
    updatePick.mutate({
      pickId,
      teamId: teamId === 'none' ? null : teamId,
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Rookie Draft
            </h1>
            <p className="font-body text-lg text-muted-foreground">
              3 Rounds • 10 Picks Per Round
            </p>
            
            {/* Year Selector */}
            <div className="mt-6 flex justify-center">
              <Select value={draftYear.toString()} onValueChange={(v) => setDraftYear(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR + 1].sort((a, b) => b - a).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Draft Board - Left Side */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {picksLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3].map(r => (
                      <Card key={r}>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="space-y-2">
                          {Array(10).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-12" />
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {[1, 2, 3].map(round => (
                      <Card key={round} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="font-display text-xl flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                              {round}
                            </span>
                            Round {round}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Header Row */}
                          <div className="grid grid-cols-[80px_1fr_1fr] gap-4 pb-2 mb-2 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <div>Pick</div>
                            <div>Team</div>
                            <div>Player</div>
                          </div>
                          {/* Pick Rows */}
                          <div className="space-y-2">
                            {(picksByRound[round] || []).map(pick => {
                              const isSelected = selectedPickId === pick.id;
                              const canSelect = !isLocked && !pick.selected_player_id;
                              return (
                              <div
                                key={pick.id}
                                className={cn(
                                  "grid grid-cols-[80px_1fr_1fr] gap-4 items-center p-3 rounded-lg border transition-all",
                                  isSelected && "border-accent border-2 bg-accent/10 ring-2 ring-accent/30",
                                  pick.selected_player_id && "bg-secondary/50"
                                )}
                              >
                                {/* Pick Number — click to select */}
                                <button
                                  type="button"
                                  disabled={!canSelect}
                                  onClick={() => setSelectedPickId(isSelected ? null : pick.id)}
                                  className={cn(
                                    "font-bold text-foreground px-2 py-1 rounded border text-left",
                                    canSelect && "hover:bg-accent hover:text-accent-foreground cursor-pointer",
                                    isSelected && "bg-accent text-accent-foreground border-accent",
                                    !canSelect && "opacity-60 cursor-not-allowed"
                                  )}
                                >
                                  {round}.{pick.pick_number}
                                </button>

                                {/* Team */}
                                <div>
                                  {isLocked ? (
                                    <div className="text-sm font-medium text-foreground">
                                      {pick.team?.name || 'TBD'}
                                    </div>
                                  ) : (
                                    <Select
                                      value={pick.team_id || 'none'}
                                      onValueChange={(v) => handleTeamChange(pick.id, v)}
                                    >
                                      <SelectTrigger className="h-9 text-sm bg-background">
                                        <SelectValue placeholder="Select team" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-popover border shadow-lg z-50">
                                        <SelectItem value="none">No team</SelectItem>
                                        {teams?.map(team => (
                                          <SelectItem key={team.id} value={team.id}>
                                            {team.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>

                                {/* Player Space */}
                                <div className="min-h-[36px] flex items-center">
                                  {pick.selected_player_id && pick.selected_player ? (
                                    <div className="flex items-center gap-2 group w-full">
                                      <Badge 
                                        variant="outline" 
                                        className={cn("text-xs flex-shrink-0", positionColors[pick.selected_player.position])}
                                      >
                                        {pick.selected_player.position}
                                      </Badge>
                                      <span className="text-sm font-semibold truncate">
                                        {pick.selected_player.player_name}
                                      </span>
                                      {isAdmin && (
                                        <button
                                          onClick={() => handleRemovePlayer(pick)}
                                          className="ml-auto w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-shrink-0"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 text-muted-foreground/50">
                                      <Users className="w-4 h-4" />
                                      <span className="text-sm italic">
                                        {selectedPickId === pick.id ? 'Selected — pick a player →' : 'Click to select'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Finalize / Lock controls */}
                <div className="mt-6 flex justify-center">
                  {isLocked ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary bg-primary/10 text-primary font-semibold">
                        <Lock className="w-4 h-4" />
                        Draft Finalized — Locked for Posterity
                      </div>
                      {isAdmin && (
                        <Button variant="outline" size="sm" onClick={handleUnlock}>
                          Admin: Unlock
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleFinalize}
                      className="font-display text-lg px-10"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      FINALIZE
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Rookie Pool - Right Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24"
              >
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg">Rookie Pool</CardTitle>
                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Filter by position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        {positions.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-300px)]">
                      {poolLoading ? (
                        <div className="p-4 space-y-2">
                          {Array(8).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-14" />
                          ))}
                        </div>
                      ) : availablePlayers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">
                            {rookiePool?.length === 0 
                              ? 'No rookies uploaded for this year' 
                              : 'All players have been drafted'}
                          </p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {availablePlayers.map(player => {
                            const rank = parseRank(player.notes);
                            return (
                              <div
                                key={player.id}
                                onClick={() => handleDraftPlayer(player)}
                                className={cn(
                                  "p-3 rounded-lg border bg-card transition-all",
                                  selectedPickId && !isLocked
                                    ? "cursor-pointer hover:shadow-md hover:border-accent hover:bg-accent/5"
                                    : "cursor-default opacity-90"
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {rank < 9999 && (
                                        <span className="text-xs font-mono text-muted-foreground w-6 flex-shrink-0">
                                          #{rank}
                                        </span>
                                      )}
                                      <span className="font-medium text-sm truncate">
                                        {player.player_name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        variant="outline"
                                        className={cn("text-xs", positionColors[player.position])}
                                      >
                                        {player.position}
                                      </Badge>
                                      {player.college && (
                                        <span className="text-xs text-muted-foreground truncate font-semibold">
                                          {player.college}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RookieDraft;
