import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommunityPost {
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  thumbnail_url: string | null;
  tags: { id: string; name: string; slug: string }[];
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  score: number;
}

export function useCommunityPosts(sortBy: 'latest' | 'top' = 'latest', tag?: string) {
  return useQuery({
    queryKey: ['community-posts', sortBy, tag],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_community_feed', {
        sort_by: sortBy,
        filter_tag: tag || null,
        page_limit: 20,
        page_offset: 0,
      });
      
      if (error) throw error;
      return data as CommunityPost[];
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postData: { content?: string; tags?: string[]; mediaFile?: File }) => {
      let mediaUrl, thumbnailUrl, mediaType;
      
      // Upload media if provided
      if (postData.mediaFile) {
        const fileExt = postData.mediaFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error('Not authenticated');
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(`${user.id}/${fileName}`, postData.mediaFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('community-media')
          .getPublicUrl(uploadData.path);
          
        mediaUrl = publicUrl;
        mediaType = postData.mediaFile.type.startsWith('video') ? 'video' : 'image';
      }
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: {
          action: 'create_post',
          data: {
            content: postData.content,
            mediaUrl,
            mediaType,
            thumbnailUrl,
            tags: postData.tags,
          },
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('პოსტი გამოქვეყნდა!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'შეცდომა პოსტის გამოქვეყნებისას');
    },
  });
}

export function useToggleLike(postId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: { action: 'like', data: { postId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });
}

export function useToggleSave(postId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: { action: 'save', data: { postId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: { 
          action: 'comment', 
          data: { postId, content, parentId } 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('კომენტარი დაემატა');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'კომენტარის დამატება ვერ მოხერხდა');
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, content, tags }: { postId: string; content: string; tags?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: { 
          action: 'update_post',
          data: { postId, content, tags }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('პოსტი წარმატებით განახლდა');
    },
    onError: (error: any) => {
      toast.error(error.message || 'პოსტის განახლება ვერ მოხერხდა');
    }
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: { 
          action: 'delete_post',
          data: { postId }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('პოსტი წაშლილია');
    },
    onError: (error: any) => {
      toast.error(error.message || 'პოსტის წაშლა ვერ მოხერხდა');
    }
  });
}

export function useReportPost() {
  return useMutation({
    mutationFn: async ({ postId, reason, details }: { postId: string; reason: string; details?: string }) => {
      const { data, error } = await supabase.functions.invoke('community-action', {
        body: { 
          action: 'report', 
          data: { postId, reason, details } 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'რეპორტი გაიგზავნა');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'რეპორტის გაგზავნა ვერ მოხერხდა');
    },
  });
}
