import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { standingsApi, RegularSeasonStanding } from '@/lib/api/standings';
import { seasonsApi } from '@/lib/api/seasons';
import { teamsApi } from '@/lib/api/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Standings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStanding, setEditingStanding] = useState<RegularSeasonStanding | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [formData, setFormData] = useState({
    season_id: '',
    team_id: '',
    rank: 1,
    wins: 0,
    losses: 0,
    total_points_for: 0,
    points_accumulated: 0,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: seasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: seasonsApi.getAll,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  });

  const { data: standings, isLoading } = useQuery({
    queryKey: ['standings', selectedSeasonId],
    queryFn: () => selectedSeasonId ? standingsApi.getBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  const createMutation = useMutation({
    mutationFn: standingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Standing created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RegularSeasonStanding> }) =>
      standingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Standing updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: standingsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      toast({ title: 'Standing deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      season_id: selectedSeasonId,
      team_id: '',
      rank: 1,
      wins: 0,
      losses: 0,
      total_points_for: 0,
      points_accumulated: 0,
    });
    setEditingStanding(null);
  };

  const handleEdit = (standing: RegularSeasonStanding) => {
    setEditingStanding(standing);
    setFormData({
      season_id: standing.season_id,
      team_id: standing.team_id,
      rank: standing.rank,
      wins: standing.wins || 0,
      losses: standing.losses || 0,
      total_points_for: standing.total_points_for || 0,
      points_accumulated: standing.points_accumulated || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStanding) {
      updateMutation.mutate({ id: editingStanding.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this standing?')) {
      deleteMutation.mutate(id);
    }
  };

  const getTeamName = (teamId: string) => {
    return teams?.find((t) => t.id === teamId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Regular Season Standings</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!selectedSeasonId}>
              <Plus className="h-4 w-4 mr-2" />
              Add Standing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingStanding ? 'Edit Standing' : 'Add New Standing'}
              </DialogTitle>
              <DialogDescription>
                {editingStanding
                  ? 'Update the standing information'
                  : 'Add a team standing for the season'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_id">Team *</Label>
                <Select
                  value={formData.team_id}
                  onValueChange={(value) => setFormData({ ...formData, team_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rank">Rank</Label>
                  <Input
                    id="rank"
                    type="number"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wins">Wins</Label>
                  <Input
                    id="wins"
                    type="number"
                    value={formData.wins}
                    onChange={(e) => setFormData({ ...formData, wins: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="losses">Losses</Label>
                  <Input
                    id="losses"
                    type="number"
                    value={formData.losses}
                    onChange={(e) => setFormData({ ...formData, losses: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points_accumulated">Points</Label>
                  <Input
                    id="points_accumulated"
                    type="number"
                    value={formData.points_accumulated}
                    onChange={(e) => setFormData({ ...formData, points_accumulated: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_points_for">Total Points For</Label>
                <Input
                  id="total_points_for"
                  type="number"
                  step="0.01"
                  value={formData.total_points_for}
                  onChange={(e) => setFormData({ ...formData, total_points_for: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStanding ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="season-select">Select Season</Label>
        <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a season" />
          </SelectTrigger>
          <SelectContent>
            {seasons?.map((season) => (
              <SelectItem key={season.id} value={season.id}>
                {season.year} {season.is_active && '(Active)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedSeasonId ? (
        <div className="text-center py-8 text-gray-500">
          Select a season to view standings
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>W</TableHead>
                <TableHead>L</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>PF</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings?.map((standing) => (
                <TableRow key={standing.id}>
                  <TableCell>{standing.rank}</TableCell>
                  <TableCell className="font-medium">{getTeamName(standing.team_id)}</TableCell>
                  <TableCell>{standing.wins || 0}</TableCell>
                  <TableCell>{standing.losses || 0}</TableCell>
                  <TableCell>{standing.points_accumulated || 0}</TableCell>
                  <TableCell>{standing.total_points_for?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(standing)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(standing.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {standings?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No standings for this season yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
