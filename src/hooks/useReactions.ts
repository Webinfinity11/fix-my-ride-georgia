import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReactionType = 'like' | 'funny' | 'fire' | 'helpful';

interface ToggleReactionParams {
  postId: string;
  reactionType: ReactionType;
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: ToggleReactionParams) => {
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: {
          action: 'reaction',
          data: { postId, reactionType }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: (error: any) => {
      toast.error('რეაქციის დამატება ვერ მოხერხდა');
      console.error('Error toggling reaction:', error);
    }
  });
}
