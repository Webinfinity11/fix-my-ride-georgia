import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  author_id: string;
  status: 'draft' | 'published';
  published_at: string | null;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export const useBlogPosts = (status?: 'published' | 'draft', featured?: boolean) => {
  return useQuery({
    queryKey: ['blog-posts', status, featured],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles!blog_posts_author_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles!blog_posts_author_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: Omit<Partial<BlogPost>, 'id' | 'created_at' | 'updated_at' | 'view_count'> & { author_id: string; content: string; title: string }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([post as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('ბლოგ პოსტი წარმატებით შეიქმნა');
    },
    onError: (error: Error) => {
      toast.error('შეცდომა: ' + error.message);
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', data.slug] });
      toast.success('ბლოგ პოსტი განახლდა');
    },
    onError: (error: Error) => {
      toast.error('შეცდომა: ' + error.message);
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('ბლოგ პოსტი წაიშალა');
    },
    onError: (error: Error) => {
      toast.error('შეცდომა: ' + error.message);
    },
  });
};

export const useIncrementBlogView = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: post } = await supabase
        .from('blog_posts')
        .select('view_count')
        .eq('id', id)
        .single();

      if (post) {
        await supabase
          .from('blog_posts')
          .update({ view_count: (post.view_count || 0) + 1 })
          .eq('id', id);
      }
    },
  });
};
