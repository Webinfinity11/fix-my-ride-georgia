import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react';
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
  parent_id: string | null;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isAuthenticated: boolean;
  currentUserId: string | null;
  onDelete: (commentId: string) => void;
}

export function CommentItem({ comment, postId, isAuthenticated, currentUserId, onDelete }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const queryClient = useQueryClient();
  const createComment = useCreateComment();

  // Fetch replies
  const { data: replies } = useQuery({
    queryKey: ['comment-replies', comment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', comment.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const authorIds = [...new Set((data || []).map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return (data || []).map(reply => {
        const profile = profileMap.get(reply.author_id);
        return {
          id: reply.id,
          content: reply.content,
          author_id: reply.author_id,
          author_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'User',
          author_avatar: profile?.avatar_url || null,
          created_at: reply.created_at,
          is_deleted: reply.is_deleted,
          parent_id: reply.parent_id
        };
      }) as Comment[];
    },
    enabled: showReplies,
  });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim()) {
      toast.error('დაწერეთ პასუხი');
      return;
    }

    try {
      await createComment.mutateAsync({
        postId,
        content: replyText.trim(),
        parentId: comment.id,
      });
      setReplyText('');
      setShowReplyForm(false);
      setShowReplies(true);
      queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.id] });
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    } catch (error) {
      // Error handled in hook
    }
  };

  const replyCount = replies?.length || 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
        <Avatar className="h-8 w-8 flex-shrink-0">
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
                  locale: ka,
                })}
              </span>
            </div>
            {isAuthenticated && currentUserId === comment.author_id && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>

          {/* Reply Button */}
          <div className="flex gap-2 mt-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowReplyForm(!showReplyForm)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                პასუხი
              </Button>
            )}
            {replyCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'დამალვა' : `${replyCount} პასუხი`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div className="ml-11">
          <form onSubmit={handleReply} className="flex gap-2">
            <Textarea
              placeholder="დაწერეთ პასუხი..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={500}
              className="min-h-[60px] resize-none text-sm"
              disabled={createComment.isPending}
            />
            <Button type="submit" size="icon" disabled={createComment.isPending || !replyText.trim()}>
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Replies */}
      {showReplies && replies && replies.length > 0 && (
        <div className="ml-11 space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 p-3 rounded-lg bg-muted/20">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={reply.author_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {reply.author_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs">{reply.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                        locale: ka,
                      })}
                    </span>
                  </div>
                  {isAuthenticated && currentUserId === reply.author_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => onDelete(reply.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-xs mt-1 whitespace-pre-wrap break-words">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
