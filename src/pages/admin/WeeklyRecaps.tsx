import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WeeklyRecap {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  season_year: number | null;
  week_number: number | null;
  recap_date: string | null;
}

const CURRENT_YEAR = new Date().getFullYear();
const SEASONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);
const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

export default function WeeklyRecaps() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecap, setEditingRecap] = useState<WeeklyRecap | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    published: false,
    season_year: CURRENT_YEAR,
    week_number: 1,
    recap_date: new Date().toISOString().split('T')[0],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: recaps, isLoading } = useQuery({
    queryKey: ['weekly-recaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('recap_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WeeklyRecap[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (recap: typeof formData) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([recap])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-recaps'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Weekly recap created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-recaps'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Weekly recap updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-recaps'] });
      toast({ title: 'Weekly recap deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          published: !published,
          published_at: !published ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-recaps'] });
      toast({ title: 'Recap status updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      featured_image: '',
      published: false,
      season_year: CURRENT_YEAR,
      week_number: 1,
      recap_date: new Date().toISOString().split('T')[0],
    });
    setEditingRecap(null);
  };

  const handleEdit = (recap: WeeklyRecap) => {
    setEditingRecap(recap);
    setFormData({
      title: recap.title,
      slug: recap.slug,
      content: recap.content || '',
      excerpt: recap.excerpt || '',
      featured_image: recap.featured_image || '',
      published: recap.published,
      season_year: recap.season_year || CURRENT_YEAR,
      week_number: recap.week_number || 1,
      recap_date: recap.recap_date || new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecap) {
      updateMutation.mutate({ id: editingRecap.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recap?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (recap: WeeklyRecap) => {
    togglePublishMutation.mutate({ id: recap.id, published: recap.published });
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingRecap
        ? formData.slug
        : title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
    });
  };

  const formatRecapDate = (recap: WeeklyRecap) => {
    if (recap.season_year && recap.week_number) {
      return `Season ${recap.season_year}, Week ${recap.week_number}`;
    }
    if (recap.recap_date) {
      return new Date(recap.recap_date).toLocaleDateString();
    }
    return new Date(recap.created_at).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Weekly Recaps</h1>
          <p className="text-gray-600 mt-1">
            Manage your league's weekly recap posts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Recap
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecap ? 'Edit Weekly Recap' : 'Create New Weekly Recap'}
              </DialogTitle>
              <DialogDescription>
                {editingRecap
                  ? 'Update the weekly recap content'
                  : 'Create a new weekly recap for the league'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season_year">Season</Label>
                  <Select
                    value={formData.season_year.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, season_year: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEASONS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="week_number">Week</Label>
                  <Select
                    value={formData.week_number.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, week_number: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKS.map((week) => (
                        <SelectItem key={week} value={week.toString()}>
                          Week {week}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recap_date">Date</Label>
                  <Input
                    id="recap_date"
                    type="date"
                    value={formData.recap_date}
                    onChange={(e) =>
                      setFormData({ ...formData, recap_date: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Week 1: The Season Begins"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  placeholder="Brief summary of the recap..."
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <WysiwygEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Write your weekly recap here..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="featured_image">Featured Image URL</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) =>
                    setFormData({ ...formData, featured_image: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="published">Publish immediately</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRecap ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Season / Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recaps?.map((recap) => (
                <TableRow key={recap.id}>
                  <TableCell className="font-medium">{recap.title}</TableCell>
                  <TableCell>
                    {recap.season_year && recap.week_number ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {recap.season_year} / Week {recap.week_number}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={recap.published ? 'default' : 'secondary'}>
                      {recap.published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {recap.recap_date
                      ? new Date(recap.recap_date).toLocaleDateString()
                      : new Date(recap.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(recap)}
                      title={recap.published ? 'Unpublish' : 'Publish'}
                    >
                      {recap.published ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(recap)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(recap.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {recaps?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No weekly recaps yet. Create your first recap to get started.
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
