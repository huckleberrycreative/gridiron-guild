import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { SEASON_YEAR, REGULAR_SEASON_WEEKS } from '@/hooks/useWeeklyScores';

export default function WeeklyScores() {
  const [week, setWeek] = useState('1');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['weekly-scores-admin', SEASON_YEAR],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_scores')
        .select('id, week, team_id, score')
        .eq('season_year', SEASON_YEAR);
      if (error) throw error;
      return data as { id: string; week: number; team_id: string; score: number }[];
    },
  });

  const byKey = useMemo(() => {
    const m = new Map<string, { id: string; score: number }>();
    scores.forEach((s) => m.set(`${s.week}-${s.team_id}`, { id: s.id, score: Number(s.score) }));
    return m;
  }, [scores]);

  const save = useMutation({
    mutationFn: async ({ teamId, value }: { teamId: string; value: number | null }) => {
      const existing = byKey.get(`${week}-${teamId}`);
      if (value === null) {
        if (!existing) return;
        const { error } = await supabase.from('weekly_scores').delete().eq('id', existing.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('weekly_scores').upsert(
        {
          season_year: SEASON_YEAR,
          week: Number(week),
          team_id: teamId,
          score: value,
        },
        { onConflict: 'season_year,week,team_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-scores-admin', SEASON_YEAR] });
      queryClient.invalidateQueries({ queryKey: ['weekly-scores', SEASON_YEAR] });
    },
    onError: (e: any) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly Scores</h1>
        <p className="text-sm text-muted-foreground">
          Enter each team's score for a week. Weeks with no scores stay hidden on the 2026 Season page.
        </p>
      </div>

      <Select value={week} onValueChange={setWeek}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: REGULAR_SEASON_WEEKS }, (_, i) => i + 1).map((w) => (
            <SelectItem key={w} value={String(w)}>
              Week {w}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="w-48">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((t) => {
                const existing = byKey.get(`${week}-${t.id}`);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Input
                        key={`${week}-${t.id}-${existing?.score ?? 'empty'}`}
                        type="number"
                        step="0.01"
                        placeholder="—"
                        defaultValue={existing?.score ?? ''}
                        onBlur={(e) => {
                          const raw = e.target.value.trim();
                          const value = raw === '' ? null : parseFloat(raw);
                          if (value !== null && isNaN(value)) return;
                          if ((existing?.score ?? null) === value) return;
                          save.mutate({ teamId: t.id, value });
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
