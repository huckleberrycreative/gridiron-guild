import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Save, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

interface RosterRow {
  id: string;
  playerId: string;
  name: string;
  position: string;
  teamId: string | null;
  franchiseTag: boolean;
  practiceSquad: boolean;
  rookieDraftRound: string | null;
  salary_2026: string;
  salary_2027: string;
  salary_2028: string;
  salary_2029: string;
}

export default function AdminRosters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    first_name: '',
    last_name: '',
    position: 'QB',
    practice_squad: false,
    franchise_tag: false,
    salary_2026: '',
    salary_2027: '',
    salary_2028: '',
    salary_2029: '',
  });
  const [drafts, setDrafts] = useState<Record<string, Partial<RosterRow>>>({});

  const { data: teams } = useQuery({
    queryKey: ['admin-roster-teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin-roster-salaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_salaries')
        .select('*, player:players(*), team:teams(id,name)');
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        playerId: s.player_id,
        name: s.player?.full_name || '',
        position: s.player?.position || '',
        teamId: s.team_id,
        franchiseTag: !!s.franchise_tag,
        practiceSquad: !!s.practice_squad,
        rookieDraftRound: s.rookie_draft_round,
        salary_2026: s.salary_2026 || '',
        salary_2027: s.salary_2027 || '',
        salary_2028: s.salary_2028 || '',
        salary_2029: s.salary_2029 || '',
      })) as RosterRow[];
    },
  });

  const teamRows = useMemo(
    () => (rows || []).filter((r) => r.teamId === selectedTeamId),
    [rows, selectedTeamId]
  );
  const active = teamRows.filter((r) => !r.practiceSquad).sort((a, b) => a.name.localeCompare(b.name));
  const practice = teamRows.filter((r) => r.practiceSquad).sort((a, b) => a.name.localeCompare(b.name));

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('player_salaries')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roster-salaries'] });
      queryClient.invalidateQueries({ queryKey: ['player-salaries'] });
      toast({ title: 'Roster updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('player_salaries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roster-salaries'] });
      queryClient.invalidateQueries({ queryKey: ['player-salaries'] });
      toast({ title: 'Player removed from roster' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const full = `${newPlayer.first_name} ${newPlayer.last_name}`.trim();
      let playerId: string | null = null;
      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('full_name', full)
        .maybeSingle();
      if (existing) {
        playerId = existing.id;
      } else {
        const { data: created, error: pErr } = await supabase
          .from('players')
          .insert({
            first_name: newPlayer.first_name,
            last_name: newPlayer.last_name,
            full_name: full,
            position: newPlayer.position,
          })
          .select('id')
          .single();
        if (pErr) throw pErr;
        playerId = created.id;
      }

      const payload = {
        player_id: playerId,
        team_id: selectedTeamId,
        practice_squad: newPlayer.practice_squad,
        franchise_tag: newPlayer.franchise_tag,
        salary_2026: newPlayer.salary_2026 || null,
        salary_2027: newPlayer.salary_2027 || null,
        salary_2028: newPlayer.salary_2028 || null,
        salary_2029: newPlayer.salary_2029 || null,
        updated_at: new Date().toISOString(),
      };

      const { data: existingSalary } = await supabase
        .from('player_salaries')
        .select('id')
        .eq('player_id', playerId)
        .maybeSingle();

      if (existingSalary) {
        const { error } = await supabase.from('player_salaries').update(payload).eq('id', existingSalary.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('player_salaries').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roster-salaries'] });
      queryClient.invalidateQueries({ queryKey: ['player-salaries'] });
      setAddOpen(false);
      setNewPlayer({
        first_name: '',
        last_name: '',
        position: 'QB',
        practice_squad: false,
        franchise_tag: false,
        salary_2026: '',
        salary_2027: '',
        salary_2028: '',
        salary_2029: '',
      });
      toast({ title: 'Player added to roster' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const setDraft = (id: string, key: keyof RosterRow, value: string) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [key]: value } }));

  const val = (row: RosterRow, key: keyof RosterRow) =>
    (drafts[row.id]?.[key] as string | undefined) ?? (row[key] as string);

  const saveRow = (row: RosterRow) => {
    const d = drafts[row.id];
    if (!d) return;
    updateMutation.mutate({
      id: row.id,
      values: {
        salary_2026: (d.salary_2026 ?? row.salary_2026) || null,
        salary_2027: (d.salary_2027 ?? row.salary_2027) || null,
        salary_2028: (d.salary_2028 ?? row.salary_2028) || null,
        salary_2029: (d.salary_2029 ?? row.salary_2029) || null,
      },
    });
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
  };

  const renderTable = (list: RosterRow[], isPS: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>POS</TableHead>
          <TableHead>2026</TableHead>
          <TableHead>2027</TableHead>
          <TableHead>2028</TableHead>
          <TableHead>2029</TableHead>
          <TableHead className="text-center">FT</TableHead>
          <TableHead className="text-center">PS</TableHead>
          <TableHead>Move To</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-muted-foreground py-6">
              {isPS ? 'No practice squad players' : 'No active roster players'}
            </TableCell>
          </TableRow>
        )}
        {list.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{row.position}</Badge>
            </TableCell>
            {(['salary_2026', 'salary_2027', 'salary_2028', 'salary_2029'] as const).map((k) => (
              <TableCell key={k}>
                <Input
                  className="w-20"
                  value={val(row, k) || ''}
                  onChange={(e) => setDraft(row.id, k, e.target.value)}
                />
              </TableCell>
            ))}
            <TableCell className="text-center">
              <Switch
                checked={row.franchiseTag}
                onCheckedChange={(v) => updateMutation.mutate({ id: row.id, values: { franchise_tag: v } })}
              />
            </TableCell>
            <TableCell className="text-center">
              <Switch
                checked={row.practiceSquad}
                onCheckedChange={(v) => updateMutation.mutate({ id: row.id, values: { practice_squad: v } })}
              />
            </TableCell>
            <TableCell>
              <Select
                value={row.teamId || 'free'}
                onValueChange={(v) =>
                  updateMutation.mutate({ id: row.id, values: { team_id: v === 'free' ? null : v } })
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Agent</SelectItem>
                  {teams?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
              <Button
                size="sm"
                variant="outline"
                disabled={!drafts[row.id]}
                onClick={() => saveRow(row)}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 ml-1"
                onClick={() => {
                  if (confirm(`Remove ${row.name} from this roster?`)) releaseMutation.mutate(row.id);
                }}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rosters</h1>
          <p className="text-gray-600">Manage active rosters and practice squads by team.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedTeamId}>
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Player to Roster</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={newPlayer.first_name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={newPlayer.last_name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Select
                    value={newPlayer.position}
                    onValueChange={(v) => setNewPlayer({ ...newPlayer, position: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(['salary_2026', 'salary_2027', 'salary_2028', 'salary_2029'] as const).map((k) => (
                  <div key={k}>
                    <Label>{k.replace('salary_', '')} Salary</Label>
                    <Input
                      value={newPlayer[k]}
                      onChange={(e) => setNewPlayer({ ...newPlayer, [k]: e.target.value })}
                      placeholder="$100"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newPlayer.practice_squad}
                    onCheckedChange={(v) => setNewPlayer({ ...newPlayer, practice_squad: v })}
                  />
                  <Label>Practice Squad</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newPlayer.franchise_tag}
                    onCheckedChange={(v) => setNewPlayer({ ...newPlayer, franchise_tag: v })}
                  />
                  <Label>Franchise Tag</Label>
                </div>
              </div>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!newPlayer.first_name || !newPlayer.last_name || addMutation.isPending}
              >
                {addMutation.isPending ? 'Saving...' : 'Add to Roster'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedTeamId ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500">
          Select a team to manage its roster.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Active Roster ({active.length})</h2>
            {renderTable(active, false)}
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Practice Squad ({practice.length}/6)</h2>
            {renderTable(practice, true)}
          </div>
        </div>
      )}
    </div>
  );
}
