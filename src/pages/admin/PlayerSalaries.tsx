import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersApi, salariesApi, Player, PlayerSalary } from '@/lib/api/players';
import { teamsApi } from '@/lib/api/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PlayerSalaries() {
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingSalary, setEditingSalary] = useState<PlayerSalary | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  
  const [playerForm, setPlayerForm] = useState({
    first_name: '',
    last_name: '',
    position: '',
  });
  
  const [salaryForm, setSalaryForm] = useState({
    player_id: '',
    team_id: '',
    number: 0,
    contract_year: '',
    salary_2025: '',
    salary_2026: '',
    salary_2027: '',
    salary_2028: '',
    franchise_tag: false,
    acquired_via_waivers: false,
    rookie_draft_round: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: playersApi.getAll,
  });

  const { data: salaries, isLoading: salariesLoading } = useQuery({
    queryKey: ['salaries'],
    queryFn: salariesApi.getAll,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  });

  // Player mutations
  const createPlayerMutation = useMutation({
    mutationFn: playersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsPlayerDialogOpen(false);
      resetPlayerForm();
      toast({ title: 'Player created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Player> }) =>
      playersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsPlayerDialogOpen(false);
      resetPlayerForm();
      toast({ title: 'Player updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: playersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast({ title: 'Player deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Salary mutations
  const createSalaryMutation = useMutation({
    mutationFn: salariesApi.upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setIsSalaryDialogOpen(false);
      resetSalaryForm();
      toast({ title: 'Salary record created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateSalaryMutation = useMutation({
    mutationFn: (data: Omit<PlayerSalary, 'id' | 'created_at' | 'updated_at'>) =>
      salariesApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setIsSalaryDialogOpen(false);
      resetSalaryForm();
      toast({ title: 'Salary record updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: salariesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      toast({ title: 'Salary record deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetPlayerForm = () => {
    setPlayerForm({ first_name: '', last_name: '', position: '' });
    setEditingPlayer(null);
  };

  const resetSalaryForm = () => {
    setSalaryForm({
      player_id: '',
      team_id: '',
      number: 0,
      contract_year: '',
      salary_2025: '',
      salary_2026: '',
      salary_2027: '',
      salary_2028: '',
      franchise_tag: false,
      acquired_via_waivers: false,
      rookie_draft_round: '',
    });
    setEditingSalary(null);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({
      first_name: player.first_name,
      last_name: player.last_name,
      position: player.position,
    });
    setIsPlayerDialogOpen(true);
  };

  const handleEditSalary = (salary: PlayerSalary) => {
    setEditingSalary(salary);
    setSalaryForm({
      player_id: salary.player_id,
      team_id: salary.team_id || '',
      number: salary.number || 0,
      contract_year: salary.contract_year || '',
      salary_2025: salary.salary_2025 || '',
      salary_2026: salary.salary_2026 || '',
      salary_2027: salary.salary_2027 || '',
      salary_2028: salary.salary_2028 || '',
      franchise_tag: salary.franchise_tag,
      acquired_via_waivers: salary.acquired_via_waivers,
      rookie_draft_round: salary.rookie_draft_round || '',
    });
    setIsSalaryDialogOpen(true);
  };

  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...playerForm,
      full_name: `${playerForm.first_name} ${playerForm.last_name}`,
    };
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSalary) {
      updateSalaryMutation.mutate(salaryForm);
    } else {
      createSalaryMutation.mutate(salaryForm);
    }
  };

  const getPlayerName = (playerId: string) => {
    return players?.find((p) => p.id === playerId)?.full_name || 'Unknown';
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'Free Agent';
    return teams?.find((t) => t.id === teamId)?.name || 'Unknown';
  };

  const filteredSalaries = (salaries as PlayerSalary[] | undefined)?.filter((s) => 
    selectedTeamId === 'all' || s.team_id === selectedTeamId
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Players & Salaries</h1>

      <Tabs defaultValue="salaries">
        <TabsList>
          <TabsTrigger value="salaries">Salary Contracts</TabsTrigger>
          <TabsTrigger value="players">Player Database</TabsTrigger>
        </TabsList>

        <TabsContent value="salaries" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="max-w-xs">
              <Label>Filter by Team</Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetSalaryForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Salary
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSalary ? 'Edit Salary' : 'Add Salary Contract'}</DialogTitle>
                  <DialogDescription>
                    {editingSalary ? 'Update salary information' : 'Add a new player salary contract'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSalarySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Player *</Label>
                      <Select
                        value={salaryForm.player_id}
                        onValueChange={(v) => setSalaryForm({ ...salaryForm, player_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {players?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.full_name} ({p.position})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Team</Label>
                      <Select
                        value={salaryForm.team_id}
                        onValueChange={(v) => setSalaryForm({ ...salaryForm, team_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams?.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>2025</Label>
                      <Input
                        value={salaryForm.salary_2025}
                        onChange={(e) => setSalaryForm({ ...salaryForm, salary_2025: e.target.value })}
                        placeholder="$0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>2026</Label>
                      <Input
                        value={salaryForm.salary_2026}
                        onChange={(e) => setSalaryForm({ ...salaryForm, salary_2026: e.target.value })}
                        placeholder="$0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>2027</Label>
                      <Input
                        value={salaryForm.salary_2027}
                        onChange={(e) => setSalaryForm({ ...salaryForm, salary_2027: e.target.value })}
                        placeholder="$0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>2028</Label>
                      <Input
                        value={salaryForm.salary_2028}
                        onChange={(e) => setSalaryForm({ ...salaryForm, salary_2028: e.target.value })}
                        placeholder="$0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contract Year</Label>
                      <Input
                        value={salaryForm.contract_year}
                        onChange={(e) => setSalaryForm({ ...salaryForm, contract_year: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rookie Draft Round</Label>
                      <Input
                        value={salaryForm.rookie_draft_round}
                        onChange={(e) => setSalaryForm({ ...salaryForm, rookie_draft_round: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={salaryForm.franchise_tag}
                        onCheckedChange={(c) => setSalaryForm({ ...salaryForm, franchise_tag: c })}
                      />
                      <Label>Franchise Tag</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={salaryForm.acquired_via_waivers}
                        onCheckedChange={(c) => setSalaryForm({ ...salaryForm, acquired_via_waivers: c })}
                      />
                      <Label>Acquired via Waivers</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setIsSalaryDialogOpen(false); resetSalaryForm(); }}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingSalary ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {salariesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>2025</TableHead>
                    <TableHead>2026</TableHead>
                    <TableHead>2027</TableHead>
                    <TableHead>2028</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSalaries?.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">{getPlayerName(salary.player_id)}</TableCell>
                      <TableCell>{getTeamName(salary.team_id)}</TableCell>
                      <TableCell>{salary.salary_2025 || '—'}</TableCell>
                      <TableCell>{salary.salary_2026 || '—'}</TableCell>
                      <TableCell>{salary.salary_2027 || '—'}</TableCell>
                      <TableCell>{salary.salary_2028 || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {salary.franchise_tag && <Badge className="bg-purple-600">FT</Badge>}
                          {salary.acquired_via_waivers && <Badge variant="secondary">W</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSalary(salary)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (confirm('Delete this salary record?')) deleteSalaryMutation.mutate(salary.id);
                        }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSalaries?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No salary records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetPlayerForm}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add New Player'}</DialogTitle>
                  <DialogDescription>
                    {editingPlayer ? 'Update player information' : 'Add a new player to the database'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePlayerSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input
                        value={playerForm.first_name}
                        onChange={(e) => setPlayerForm({ ...playerForm, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name *</Label>
                      <Input
                        value={playerForm.last_name}
                        onChange={(e) => setPlayerForm({ ...playerForm, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Position *</Label>
                    <Select
                      value={playerForm.position}
                      onValueChange={(v) => setPlayerForm({ ...playerForm, position: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map((pos) => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => { setIsPlayerDialogOpen(false); resetPlayerForm(); }}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingPlayer ? 'Update' : 'Create'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {playersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players?.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">{player.full_name}</TableCell>
                      <TableCell><Badge variant="outline">{player.position}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEditPlayer(player)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (confirm('Delete this player?')) deletePlayerMutation.mutate(player.id);
                        }}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {players?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        No players yet. Add your first player.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
