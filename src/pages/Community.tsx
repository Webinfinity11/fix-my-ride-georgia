import { useState, useEffect } from 'react';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { usePopularTags } from '@/hooks/usePopularTags';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostCard } from '@/components/community/PostCard';
import { CreatePostDialog } from '@/components/community/CreatePostDialog';
import { AuthRequiredDialog } from '@/components/community/AuthRequiredDialog';
import { Plus, TrendingUp, Clock, Loader2, Hash } from 'lucide-react';
import SEOHead from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';

export default function Community() {
  const [user, setUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'top'>('latest');
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const { data: posts, isLoading } = useCommunityPosts(sortBy, selectedTag);
  const { data: popularTags } = usePopularTags();
  
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
      
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Community</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              გაიზიარე შენი გამოცდილება და ნახე სხვების სტორები
            </p>
          </div>
          <Button onClick={handleCreatePost} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            ახალი პოსტი
          </Button>
        </div>
        
        {/* Tabs */}
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'latest' | 'top')} className="mb-4">
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

        {/* Tag Filter */}
        {popularTags && popularTags.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">ფილტრი თაგებით:</span>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Badge
                  variant={!selectedTag ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedTag(undefined)}
                >
                  ყველა
                </Badge>
                {popularTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTag === tag.slug ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setSelectedTag(tag.slug)}
                  >
                    #{tag.name} ({tag.use_count})
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
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
