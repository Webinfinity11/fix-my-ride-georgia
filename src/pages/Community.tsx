import { useState, useEffect } from 'react';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/community/PostCard';
import { CreatePostDialog } from '@/components/community/CreatePostDialog';
import { AuthRequiredDialog } from '@/components/community/AuthRequiredDialog';
import { Plus, TrendingUp, Clock, Loader2 } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';

export default function Community() {
  const [user, setUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'top'>('latest');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const { data: posts, isLoading } = useCommunityPosts(sortBy);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const handleAuthRequired = () => {
    setAuthDialogOpen(true);
  };
  
  const handleCreatePost = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    setCreateDialogOpen(true);
  };
  
  return (
    <Layout>
      <SEOHead 
        title="Community - FixUp"
        description="გაიზიარე შენი გამოცდილება ავტომობილების შეკეთებასთან დაკავშირებით"
        keywords="community, გამოცდილება, ავტომობილი, ფოტო, ვიდეო"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Community</h1>
            <p className="text-muted-foreground mt-1">
              გაიზიარე შენი გამოცდილება და ნახე სხვების სტორები
            </p>
          </div>
          <Button onClick={handleCreatePost} className="gap-2">
            <Plus className="h-4 w-4" />
            ახალი პოსტი
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'latest' | 'top')} className="mb-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="latest" className="gap-2">
              <Clock className="h-4 w-4" />
              უახლესი
            </TabsTrigger>
            <TabsTrigger value="top" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              ტოპ
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Posts Feed */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.post_id}
                post={post}
                isAuthenticated={!!user}
                onAuthRequired={handleAuthRequired}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground text-lg mb-4">
              ჯერ პოსტები არაა — დაიწყე შენ 👋
            </p>
            <Button onClick={handleCreatePost} className="gap-2">
              <Plus className="h-4 w-4" />
              პირველი პოსტი
            </Button>
          </div>
        )}
      </div>
      
      <CreatePostDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      <AuthRequiredDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen} 
      />
    </Layout>
  );
}
