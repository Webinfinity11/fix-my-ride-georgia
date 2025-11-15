import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useCreateComment } from '@/hooks/useCommunityPosts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CommentItem } from './CommentItem';

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  is_deleted: boolean;
  parent_id: string | null;
}

interface CommentListProps {
  postId: string;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
  initialLimit?: number;
}

export function CommentList({ postId, isAuthenticated, onAuthRequired, initialLimit = 3 }: CommentListProps) {
  const [commentText, setCommentText] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, []);
  
  const createComment = useCreateComment();
  
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .is('parent_id', null)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch author profiles separately
      const authorIds = [...new Set((data || []).map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      
      return (data || []).map(comment => {
        const profile = profileMap.get(comment.author_id);
        return {
          id: comment.id,
          content: comment.content,
          author_id: comment.author_id,
          author_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User',
          author_avatar: profile?.avatar_url || null,
          created_at: comment.created_at,
          is_deleted: comment.is_deleted,
          parent_id: comment.parent_id
        };
      }) as Comment[];
    },
    enabled: true // Always fetch
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    
    if (!commentText.trim()) {
      toast.error('დაწერეთ კომენტარი');
      return;
    }
    
    try {
      await createComment.mutateAsync({
        postId,
        content: commentText.trim(),
      });
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      // Error handled in hook
    }
  };
  
  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success('კომენტარი წაიშალა');
    } catch (error) {
      toast.error('წაშლა ვერ მოხერხდა');
    }
  };
  
  const displayedComments = showAll ? comments : comments?.slice(0, initialLimit);
  const hasMore = comments && comments.length > initialLimit;
  
  return (
    <div className="mt-4 pt-4 border-t">
      {/* Comment Form - Always Visible */}
      <form onSubmit={handleSubmit} className="mb-4">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={isAuthenticated ? "დაწერე კომენტარი..." : "კომენტარისთვის საჭიროა ავტორიზაცია"}
          disabled={!isAuthenticated}
          className="min-h-[80px]"
        />
        <Button
          type="submit"
          disabled={!commentText.trim() || createComment.isPending || !isAuthenticated}
          className="mt-2"
        >
          {createComment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Send className="mr-2 h-4 w-4" />
          გაგზავნა
        </Button>
      </form>
      
      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : comments && comments.length > 0 ? (
        <>
          <div className="space-y-4">
            {displayedComments?.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
          
          {hasMore && !showAll && (
            <Button
              variant="ghost"
              onClick={() => setShowAll(true)}
              className="w-full mt-4"
            >
              ყველა კომენტარის ნახვა ({comments.length})
            </Button>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          პირველი იყავი ვინც დააკომენტარებს
        </p>
      )}
    </div>
  );
}
