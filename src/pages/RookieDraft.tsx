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
import { Users, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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
  const [draggedPlayer, setDraggedPlayer] = useState<RookiePlayer | null>(null);

  const { isAdmin } = useAuth();
  const { data: rookiePool, isLoading: poolLoading } = useRookiePool(draftYear);
  const { data: draftPicks, isLoading: picksLoading } = useDraftPicks(draftYear);
  const { data: teams } = useTeams();
  const updatePick = useUpdateDraftPick();
  const initializePicks = useInitializeDraftPicks();

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

  // Filter available players
  const availablePlayers = rookiePool?.filter(player => {
    if (draftedPlayerIds.has(player.id)) return false;
    if (positionFilter !== 'all' && player.position !== positionFilter) return false;
    return true;
  }) || [];

  // Get unique positions for filter
  const positions = [...new Set(rookiePool?.map(p => p.position) || [])].sort();

  // Group picks by round
  const picksByRound = draftPicks?.reduce((acc, pick) => {
    if (!acc[pick.round]) acc[pick.round] = [];
    acc[pick.round].push(pick);
    return acc;
  }, {} as Record<number, DraftPick[]>) || {};

  const handleDragStart = (player: RookiePlayer) => {
    setDraggedPlayer(player);
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
  };

  const handleDrop = (pick: DraftPick) => {
    if (!draggedPlayer || !isAdmin) return;
    if (pick.selected_player_id) return; // Already has a player

    updatePick.mutate({
      pickId: pick.id,
      selectedPlayerId: draggedPlayer.id,
    });
    setDraggedPlayer(null);
  };

  const handleRemovePlayer = (pick: DraftPick) => {
    if (!isAdmin) return;
    updatePick.mutate({
      pickId: pick.id,
      selectedPlayerId: null,
    });
  };

  const handleTeamChange = (pickId: string, teamId: string) => {
    if (!isAdmin) return;
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
                        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Array(10).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-24" />
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
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {(picksByRound[round] || []).map(pick => (
                              <div
                                key={pick.id}
                                className={cn(
                                  "border-2 rounded-lg p-3 min-h-[120px] transition-all",
                                  draggedPlayer && !pick.selected_player_id && "border-dashed border-accent bg-accent/5",
                                  pick.selected_player_id && "bg-secondary/50"
                                )}
                                onDragOver={(e) => {
                                  if (!pick.selected_player_id) e.preventDefault();
                                }}
                                onDrop={() => handleDrop(pick)}
                              >
                                {/* Pick Number */}
                                <div className="text-xs text-muted-foreground mb-2 font-medium">
                                  Pick {round}.{pick.pick_number}
                                </div>

                                {/* Team Selector */}
                                {isAdmin ? (
                                  <Select
                                    value={pick.team_id || 'none'}
                                    onValueChange={(v) => handleTeamChange(pick.id, v)}
                                  >
                                    <SelectTrigger className="h-7 text-xs mb-2">
                                      <SelectValue placeholder="Select team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No team</SelectItem>
                                      {teams?.map(team => (
                                        <SelectItem key={team.id} value={team.id}>
                                          {team.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="text-xs font-medium text-foreground mb-2 truncate">
                                    {pick.team?.name || 'TBD'}
                                  </div>
                                )}

                                {/* Selected Player or Empty Slot */}
                                {pick.selected_player_id && pick.selected_player ? (
                                  <div className="relative group">
                                    <div className="text-sm font-semibold truncate">
                                      {pick.selected_player.player_name}
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs mt-1", positionColors[pick.selected_player.position])}
                                    >
                                      {pick.selected_player.position}
                                    </Badge>
                                    {isAdmin && (
                                      <button
                                        onClick={() => handleRemovePlayer(pick)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-12 text-muted-foreground/50">
                                    <Users className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                          {availablePlayers.map(player => (
                            <div
                              key={player.id}
                              draggable={isAdmin}
                              onDragStart={() => handleDragStart(player)}
                              onDragEnd={handleDragEnd}
                              className={cn(
                                "p-3 rounded-lg border bg-card transition-all",
                                isAdmin && "cursor-grab hover:shadow-md hover:border-accent active:cursor-grabbing",
                                draggedPlayer?.id === player.id && "opacity-50"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                {isAdmin && (
                                  <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {player.player_name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="outline" 
                                      className={cn("text-xs", positionColors[player.position])}
                                    >
                                      {player.position}
                                    </Badge>
                                    {player.college && (
                                      <span className="text-xs text-muted-foreground truncate">
                                        {player.college}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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
