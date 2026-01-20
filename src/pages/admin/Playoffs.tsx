import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playoffsApi, PlayoffOutcome } from '@/lib/api/playoffs';
import { seasonsApi } from '@/lib/api/seasons';
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
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Playoffs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<PlayoffOutcome | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [formData, setFormData] = useState({
    season_id: '',
    team_id: '',
    rank: 1,
    is_finalist: false,
    semifinal_score: 0,
    finals_score: 0,
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

  const { data: outcomes, isLoading } = useQuery({
    queryKey: ['playoffs', selectedSeasonId],
    queryFn: () => selectedSeasonId ? playoffsApi.getOutcomesBySeason(selectedSeasonId) : Promise.resolve([]),
    enabled: !!selectedSeasonId,
  });

  const createMutation = useMutation({
    mutationFn: playoffsApi.createOutcome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoffs'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Playoff outcome created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlayoffOutcome> }) =>
      playoffsApi.updateOutcome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoffs'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Playoff outcome updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: playoffsApi.deleteOutcome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoffs'] });
      toast({ title: 'Playoff outcome deleted successfully' });
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
      is_finalist: false,
      semifinal_score: 0,
      finals_score: 0,
    });
    setEditingOutcome(null);
  };

  const handleEdit = (outcome: PlayoffOutcome) => {
    setEditingOutcome(outcome);
    setFormData({
      season_id: outcome.season_id,
      team_id: outcome.team_id,
      rank: outcome.rank,
      is_finalist: outcome.is_finalist,
      semifinal_score: outcome.semifinal_score || 0,
      finals_score: outcome.finals_score || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      season_id: selectedSeasonId,
    };
    if (editingOutcome) {
      updateMutation.mutate({ id: editingOutcome.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this playoff outcome?')) {
      deleteMutation.mutate(id);
    }
  };

  const getTeamName = (teamId: string) => {
    return teams?.find((t) => t.id === teamId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Playoff Outcomes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={!selectedSeasonId}>
              <Plus className="h-4 w-4 mr-2" />
              Add Outcome
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingOutcome ? 'Edit Playoff Outcome' : 'Add Playoff Outcome'}
              </DialogTitle>
              <DialogDescription>
                {editingOutcome
                  ? 'Update the playoff outcome'
                  : 'Add a team playoff result for the season'}
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
                  <Label htmlFor="rank">Final Rank *</Label>
                  <Input
                    id="rank"
                    type="number"
                    min="1"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_finalist"
                    checked={formData.is_finalist}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_finalist: checked })}
                  />
                  <Label htmlFor="is_finalist">Finalist</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semifinal_score">Semifinal Score</Label>
                  <Input
                    id="semifinal_score"
                    type="number"
                    step="0.01"
                    value={formData.semifinal_score}
                    onChange={(e) => setFormData({ ...formData, semifinal_score: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finals_score">Finals Score</Label>
                  <Input
                    id="finals_score"
                    type="number"
                    step="0.01"
                    value={formData.finals_score}
                    onChange={(e) => setFormData({ ...formData, finals_score: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingOutcome ? 'Update' : 'Create'}
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
          Select a season to view playoff outcomes
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
                <TableHead>Status</TableHead>
                <TableHead>Semi Score</TableHead>
                <TableHead>Finals Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outcomes?.map((outcome) => (
                <TableRow key={outcome.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {outcome.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {outcome.rank}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{getTeamName(outcome.team_id)}</TableCell>
                  <TableCell>
                    {outcome.is_finalist ? (
                      <Badge className="bg-yellow-600">Finalist</Badge>
                    ) : (
                      <Badge variant="secondary">Playoff Team</Badge>
                    )}
                  </TableCell>
                  <TableCell>{outcome.semifinal_score?.toFixed(2) || '—'}</TableCell>
                  <TableCell>{outcome.finals_score?.toFixed(2) || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(outcome)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(outcome.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {outcomes?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No playoff outcomes for this season yet.
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
