import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import { useCreateComment } from '@/hooks/useCommunityPosts';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  is_deleted: boolean;
}

interface CommentListProps {
  postId: string;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

export function CommentList({ postId, isAuthenticated, onAuthRequired }: CommentListProps) {
  const [commentText, setCommentText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  
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
          is_deleted: comment.is_deleted
        };
      }) as Comment[];
    },
    enabled: isExpanded
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
        content: commentText.trim()
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
  
  if (!isExpanded) {
    return (
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="w-full mt-2"
      >
        კომენტარების ნახვა
      </Button>
    );
  }
  
  return (
    <div className="mt-4 space-y-4 border-t pt-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="დაწერეთ კომენტარი..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          maxLength={500}
          className="min-h-[60px] resize-none"
          disabled={createComment.isPending}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={createComment.isPending || !commentText.trim()}
        >
          {createComment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      
      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {comment.author_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { 
                        addSuffix: true,
                        locale: ka 
                      })}
                    </span>
                  </div>
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-4">
          კომენტარები ჯერ არაა
        </p>
      )}
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsExpanded(false)}
        className="w-full"
      >
        დამალვა
      </Button>
    </div>
  );
}
