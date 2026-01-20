import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { coachesApi, Coach, CoachWithTeam } from '@/lib/api/coaches';
import { teamsApi, Team } from '@/lib/api/teams';

type CoachFormData = {
  team_id: string;
  name: string;
  photo_url: string;
  tenure_start: string;
  tenure_end: string;
  tenure_summary: string;
  wins: number;
  losses: number;
  playoff_wins: number;
  playoff_losses: number;
  championships: number;
  is_current: boolean;
  display_order: number;
};

const defaultFormData: CoachFormData = {
  team_id: '',
  name: '',
  photo_url: '',
  tenure_start: '',
  tenure_end: '',
  tenure_summary: '',
  wins: 0,
  losses: 0,
  playoff_wins: 0,
  playoff_losses: 0,
  championships: 0,
  is_current: true,
  display_order: 0,
};

export default function AdminCoaches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachWithTeam | null>(null);
  const [coachToDelete, setCoachToDelete] = useState<CoachWithTeam | null>(null);
  const [formData, setFormData] = useState<CoachFormData>(defaultFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: coaches, isLoading: coachesLoading } = useQuery({
    queryKey: ['admin-coaches'],
    queryFn: () => coachesApi.getAll(),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CoachFormData) => {
      const coach = await coachesApi.create({
        ...data,
        photo_url: data.photo_url || null,
        tenure_end: data.tenure_end || null,
        tenure_summary: data.tenure_summary || null,
      });
      
      // Upload image if provided
      if (imageFile) {
        const photoUrl = await coachesApi.uploadImage(imageFile, coach.id);
        await coachesApi.update(coach.id, { photo_url: photoUrl });
      }
      
      return coach;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coaches-by-team'] });
      toast({ title: 'Coach created successfully' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error creating coach', description: String(error), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CoachFormData> }) => {
      // Upload new image if provided
      if (imageFile) {
        const photoUrl = await coachesApi.uploadImage(imageFile, id);
        data.photo_url = photoUrl;
      }
      
      return coachesApi.update(id, {
        ...data,
        photo_url: data.photo_url || null,
        tenure_end: data.tenure_end || null,
        tenure_summary: data.tenure_summary || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coaches-by-team'] });
      toast({ title: 'Coach updated successfully' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error updating coach', description: String(error), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coaches'] });
      queryClient.invalidateQueries({ queryKey: ['coaches-by-team'] });
      toast({ title: 'Coach deleted successfully' });
      setIsDeleteDialogOpen(false);
      setCoachToDelete(null);
    },
    onError: (error) => {
      toast({ title: 'Error deleting coach', description: String(error), variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCoach(null);
    setIsDialogOpen(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (coach: CoachWithTeam) => {
    setEditingCoach(coach);
    setFormData({
      team_id: coach.team_id || '',
      name: coach.name,
      photo_url: coach.photo_url || '',
      tenure_start: coach.tenure_start || '',
      tenure_end: coach.tenure_end || '',
      tenure_summary: coach.tenure_summary || '',
      wins: coach.wins,
      losses: coach.losses,
      playoff_wins: coach.playoff_wins,
      playoff_losses: coach.playoff_losses,
      championships: coach.championships,
      is_current: coach.is_current,
      display_order: coach.display_order,
    });
    setImagePreview(coach.photo_url || null);
    setIsDialogOpen(true);
  };

  const handleDelete = (coach: CoachWithTeam) => {
    setCoachToDelete(coach);
    setIsDeleteDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoach) {
      updateMutation.mutate({ id: editingCoach.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTenureDisplay = (coach: CoachWithTeam) => {
    if (coach.is_current) {
      return `${coach.tenure_start} - Present`;
    }
    return `${coach.tenure_start} - ${coach.tenure_end || '?'}`;
  };

  if (coachesLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Coaches</h1>
          <p className="text-muted-foreground">Manage coaching history for all teams</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coach
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Tenure</TableHead>
            <TableHead>Record</TableHead>
            <TableHead>Playoff</TableHead>
            <TableHead>Titles</TableHead>
            <TableHead>Current</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coaches?.map((coach) => (
            <TableRow key={coach.id}>
              <TableCell>
                {coach.photo_url ? (
                  <img
                    src={coach.photo_url}
                    alt={coach.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{coach.name}</TableCell>
              <TableCell>{coach.teams?.name || 'No Team'}</TableCell>
              <TableCell>{getTenureDisplay(coach)}</TableCell>
              <TableCell>
                <span className="text-win">{coach.wins}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-loss">{coach.losses}</span>
              </TableCell>
              <TableCell>
                <span className="text-win">{coach.playoff_wins}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-loss">{coach.playoff_losses}</span>
              </TableCell>
              <TableCell>{coach.championships}</TableCell>
              <TableCell>{coach.is_current ? '✓' : ''}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(coach)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(coach)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Coach Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoach ? 'Edit Coach' : 'Add New Coach'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="team_id">Team</Label>
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

              <div className="space-y-2">
                <Label htmlFor="name">Coach Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="max-w-[250px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a headshot photo
                  </p>
                </div>
              </div>
            </div>

            {/* Tenure */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenure_start">Start (Week Year)</Label>
                <Input
                  id="tenure_start"
                  type="text"
                  value={formData.tenure_start}
                  onChange={(e) => setFormData({ ...formData, tenure_start: e.target.value })}
                  placeholder="e.g., Week 1 2024"
                  required
                />
                <p className="text-xs text-muted-foreground">Format: Week # Year</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenure_end">End (Week Year)</Label>
                <Input
                  id="tenure_end"
                  type="text"
                  value={formData.tenure_end}
                  onChange={(e) => setFormData({ ...formData, tenure_end: e.target.value })}
                  placeholder="e.g., Week 18 2025"
                />
                <p className="text-xs text-muted-foreground">Leave blank if current</p>
              </div>

              <div className="flex items-end pb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_current"
                    checked={formData.is_current}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_current: !!checked })}
                  />
                  <Label htmlFor="is_current">Current Coach</Label>
                </div>
              </div>
            </div>

            {/* Tenure Summary */}
            <div className="space-y-2">
              <Label htmlFor="tenure_summary">Tenure Summary</Label>
              <Textarea
                id="tenure_summary"
                value={formData.tenure_summary}
                onChange={(e) => setFormData({ ...formData, tenure_summary: e.target.value })}
                placeholder="A brief 1-sentence summary of their tenure..."
                rows={2}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wins">Wins</Label>
                <Input
                  id="wins"
                  type="number"
                  min={0}
                  value={formData.wins}
                  onChange={(e) => setFormData({ ...formData, wins: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="losses">Losses</Label>
                <Input
                  id="losses"
                  type="number"
                  min={0}
                  value={formData.losses}
                  onChange={(e) => setFormData({ ...formData, losses: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="championships">Championships</Label>
                <Input
                  id="championships"
                  type="number"
                  min={0}
                  value={formData.championships}
                  onChange={(e) => setFormData({ ...formData, championships: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="playoff_wins">Playoff Wins</Label>
                <Input
                  id="playoff_wins"
                  type="number"
                  min={0}
                  value={formData.playoff_wins}
                  onChange={(e) => setFormData({ ...formData, playoff_wins: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playoff_losses">Playoff Losses</Label>
                <Input
                  id="playoff_losses"
                  type="number"
                  min={0}
                  value={formData.playoff_losses}
                  onChange={(e) => setFormData({ ...formData, playoff_losses: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min={0}
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Lower = first in carousel</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCoach ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coach</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {coachToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => coachToDelete && deleteMutation.mutate(coachToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
