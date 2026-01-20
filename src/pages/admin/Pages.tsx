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
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  template: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

// Static pages that exist as React components (for reference)
const STATIC_PAGES = [
  { title: 'Constitution', slug: 'constitution', route: '/constitution' },
  { title: 'Meet the League', slug: 'meet-the-league', route: '/meet-the-league' },
  { title: 'Manifesto', slug: 'manifesto', route: '/manifesto' },
  { title: 'Rivalry Week', slug: 'rivalry-week', route: '/rivalry-week' },
  { title: 'Lore', slug: 'lore', route: '/lore' },
  { title: 'Team Captains', slug: 'team-captains', route: '/team-captains' },
  { title: 'Practice Squad', slug: 'practice-squad', route: '/practice-squad' },
  { title: 'Coaching Carousel', slug: 'coaching-carousel', route: '/coaching-carousel' },
  { title: 'Historic Analytics', slug: 'historic-analytics', route: '/historic-analytics' },
  { title: 'Pantheon', slug: 'pantheon', route: '/pantheon' },
  { title: 'Rookie Draft', slug: 'rookie-draft', route: '/rookie-draft' },
  { title: 'Standings', slug: 'standings', route: '/standings' },
  { title: 'Salaries', slug: 'salaries', route: '/salaries' },
  { title: 'Stats', slug: 'stats', route: '/stats' },
];

export default function Pages() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    template: 'default',
    published: true,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pages, isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('title');

      if (error) throw error;
      return data as Page[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (page: typeof formData) => {
      const { data, error } = await supabase
        .from('pages')
        .insert([page])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Page created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('pages')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: 'Page updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast({ title: 'Page deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from('pages')
        .update({ published: !published, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      toast({ title: 'Page status updated' });
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
      template: 'default',
      published: true,
    });
    setEditingPage(null);
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      template: page.template || 'default',
      published: page.published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this page?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (page: Page) => {
    togglePublishMutation.mutate({ id: page.id, published: page.published });
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPage
        ? formData.slug
        : title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-gray-600 mt-1">
            Create and edit custom pages with the visual editor
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? 'Edit Page' : 'Create New Page'}
              </DialogTitle>
              <DialogDescription>
                {editingPage
                  ? 'Update page content and settings'
                  : 'Create a new page for your website'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., About Us, Rules, FAQ"
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
                  placeholder="e.g., about-us, rules, faq"
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be the URL: /pages/{formData.slug}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <WysiwygEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Start writing your page content..."
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
                <Label htmlFor="published">Published</Label>
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
                  {editingPage ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Static Pages Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          📄 Static Pages (React Components)
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          These pages are built as React components. To edit them, you'll need to modify the code directly.
        </p>
        <div className="flex flex-wrap gap-2">
          {STATIC_PAGES.map((page) => (
            <a
              key={page.slug}
              href={page.route}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 rounded-full text-sm text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {page.title}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>

      {/* Dynamic Pages Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Dynamic Pages</h2>
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
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages?.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      /pages/{page.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.published ? 'default' : 'secondary'}>
                        {page.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(page.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(page)}
                        title={page.published ? 'Unpublish' : 'Publish'}
                      >
                        {page.published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(page)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(page.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pages?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No dynamic pages yet. Create your first page to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
