import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPost } from '@/hooks/useBlogPosts';
import { BlogPostForm } from './BlogPostForm';
import { formatDate } from '@/utils/blogHelpers';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { BlogPost } from '@/hooks/useBlogPosts';

export const BlogManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const { data: posts, isLoading } = useBlogPosts();
  const deletePost = useDeleteBlogPost();
  const updatePost = useUpdateBlogPost();

  const filteredPosts = posts?.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (deletingPostId) {
      await deletePost.mutateAsync(deletingPostId);
      setDeletingPostId(null);
    }
  };

  const handleStatusToggle = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const updates: Partial<BlogPost> & { id: string } = {
      id: post.id,
      status: newStatus,
    };
    
    if (newStatus === 'published' && !post.published_at) {
      updates.published_at = new Date().toISOString();
    }
    
    await updatePost.mutateAsync(updates);
  };

  const handleFeaturedToggle = async (post: BlogPost) => {
    await updatePost.mutateAsync({
      id: post.id,
      is_featured: !post.is_featured,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ბლოგის მართვა</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          ახალი პოსტი
        </Button>
      </div>

      <Input
        placeholder="ძებნა სათაურით ან slug-ით..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>სათაური</TableHead>
              <TableHead>სტატუსი</TableHead>
              <TableHead>გამორჩეული</TableHead>
              <TableHead>ნახვები</TableHead>
              <TableHead>თარიღი</TableHead>
              <TableHead className="text-right">მოქმედებები</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  იტვირთება...
                </TableCell>
              </TableRow>
            ) : filteredPosts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  პოსტები ვერ მოიძებნა
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts?.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status === 'published' ? 'გამოქვეყნებული' : 'დრაფტი'}
                      </Badge>
                      <Switch
                        checked={post.status === 'published'}
                        onCheckedChange={() => handleStatusToggle(post)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`featured-${post.id}`} className="text-xs">
                        {post.is_featured ? 'კი' : 'არა'}
                      </Label>
                      <Switch
                        id={`featured-${post.id}`}
                        checked={post.is_featured}
                        onCheckedChange={() => handleFeaturedToggle(post)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{post.view_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(post.published_at || post.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPost(post)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPostId(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ახალი ბლოგ პოსტი</DialogTitle>
            <DialogDescription>
              შექმენით ახალი ბლოგ პოსტი თქვენი ავდიტორიისთვის
            </DialogDescription>
          </DialogHeader>
          <BlogPostForm onSuccess={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>პოსტის რედაქტირება</DialogTitle>
            <DialogDescription>
              შეცვალეთ პოსტის დეტალები
            </DialogDescription>
          </DialogHeader>
          {editingPost && (
            <BlogPostForm
              post={editingPost}
              onSuccess={() => setEditingPost(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPostId} onOpenChange={() => setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხართ?</AlertDialogTitle>
            <AlertDialogDescription>
              ეს მოქმედება შეუქცევადია. პოსტი სამუდამოდ წაიშლება.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>წაშლა</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
