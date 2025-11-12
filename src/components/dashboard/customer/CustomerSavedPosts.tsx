import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Bookmark } from 'lucide-react';
import { PostCard } from '@/components/community/PostCard';
import { CommunityPost } from '@/hooks/useCommunityPosts';
import { useState } from 'react';
import { AuthRequiredDialog } from '@/components/community/AuthRequiredDialog';

export function CustomerSavedPosts() {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  const { data: savedPosts, isLoading } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get saved post IDs
      const { data: saves, error: savesError } = await supabase
        .from('post_saves')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savesError) throw savesError;
      if (!saves || saves.length === 0) return [];

      const postIds = saves.map(s => s.post_id);

      // Get full post data using the RPC function
      const { data: posts, error: postsError } = await supabase.rpc('get_community_feed', {
        sort_by: 'latest',
        filter_tag: null,
        page_limit: 100,
        page_offset: 0,
      });

      if (postsError) throw postsError;

      // Filter to only saved posts
      return (posts as CommunityPost[]).filter(post => postIds.includes(post.post_id));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!savedPosts || savedPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">შენახული პოსტები არ არის</h3>
        <p className="text-muted-foreground">
          დაამატე პოსტები შენახულ სიაში და ნახე აქ
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">შენახული პოსტები</h1>
        <p className="text-muted-foreground">
          {savedPosts.length} შენახული პოსტი
        </p>
      </div>

      <div className="space-y-4">
        {savedPosts.map((post) => (
          <PostCard
            key={post.post_id}
            post={post}
            isAuthenticated={true}
            onAuthRequired={() => setShowAuthDialog(true)}
          />
        ))}
      </div>

      <AuthRequiredDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </div>
  );
}
