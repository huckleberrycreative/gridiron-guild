import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

type Row = {
  id: string;
  name: string;
  position: string;
  team: string;
  teamId: string | null;
  status: string;
  weeksOut: number;
  note: string;
};

const STATUSES = ['healthy', 'questionable', 'doubtful', 'out', 'ir'] as const;

const statusLabel: Record<string, string> = {
  healthy: 'Healthy',
  questionable: 'Questionable',
  doubtful: 'Doubtful',
  out: 'Out',
  ir: 'Injured Reserve',
};

export default function Injuries() {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [onlyInjured, setOnlyInjured] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['injury-rows'],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from('player_salaries')
        .select('id, team_id, injury_status, injury_weeks_out, injury_note, player:players(first_name,last_name,position), team:teams(name)');
      if (error) throw error;
      return (data || [])
        .filter((s: any) => s.team_id)
        .map((s: any) => ({
          id: s.id,
          name: `${s.player?.first_name ?? ''} ${s.player?.last_name ?? ''}`.trim(),
          position: s.player?.position ?? '',
          team: s.team?.name ?? 'Free Agent',
          teamId: s.team_id,
          status: s.injury_status ?? 'healthy',
          weeksOut: s.injury_weeks_out ?? 0,
          note: s.injury_note ?? '',
        }))
        .sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { injury_status?: string; injury_weeks_out?: number; injury_note?: string } }) => {
      const { error } = await supabase.from('player_salaries').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injury-rows'] });
      queryClient.invalidateQueries({ queryKey: ['player-salaries'] });
    },
    onError: (e: any) =>
      toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const teams = useMemo(
    () => Array.from(new Set(rows.map((r) => r.team))).sort(),
    [rows]
  );

  const filtered = rows.filter((r) => {
    if (teamFilter !== 'all' && r.team !== teamFilter) return false;
    if (onlyInjured && r.status === 'healthy') return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Injury Report</h1>
        <p className="text-sm text-muted-foreground">
          Mark players out and set expected weeks missed. Power Ranks update automatically.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={onlyInjured ? 'default' : 'outline'}
          onClick={() => setOnlyInjured((v) => !v)}
        >
          Injured only
        </Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Pos</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="w-48">Status</TableHead>
                <TableHead className="w-28">Weeks out</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.name}{' '}
                    {r.status !== 'healthy' && (
                      <Badge variant="destructive" className="ml-1">
                        {statusLabel[r.status] ?? r.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{r.position}</TableCell>
                  <TableCell>{r.team}</TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        update.mutate({
                          id: r.id,
                          patch: {
                            injury_status: v,
                            injury_weeks_out:
                              v === 'healthy' ? 0 : Math.max(1, r.weeksOut || 1),
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabel[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      defaultValue={r.weeksOut}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0));
                        if (v !== r.weeksOut)
                          update.mutate({ id: r.id, patch: { injury_weeks_out: v } });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={r.note}
                      placeholder="e.g. hamstring"
                      onBlur={(e) => {
                        if (e.target.value !== r.note)
                          update.mutate({ id: r.id, patch: { injury_note: e.target.value } });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
