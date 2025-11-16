import { useState, useEffect } from "react";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { usePopularTags } from "@/hooks/usePopularTags";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostDialog } from "@/components/community/CreatePostDialog";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { Plus, TrendingUp, Clock, Loader2, Hash, Search, Sparkles, Filter } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";

export default function Community() {
  const [user, setUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState<"latest" | "top">("latest");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: posts, isLoading } = useCommunityPosts(sortBy, selectedTag);
  const { data: popularTags } = usePopularTags();

  // Filter posts by search query and sort pinned first
  const filteredPosts = posts
    ?.filter((post) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const matchesContent = post.content?.toLowerCase().includes(query);
      const matchesAuthor = post.author_name?.toLowerCase().includes(query);
      const matchesTags = post.tags?.some((tag) => tag.name.toLowerCase().includes(query));

      return matchesContent || matchesAuthor || matchesTags;
    })
    .sort((a, b) => {
      // Pinned posts first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

      {/* Hero Section with Gradient */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-b">
        <div className="container mx-auto px-4 py-6 sm:py-10 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Community
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                გაიზიარე შენი გამოცდილება და ნახე სხვების სტორები
              </p>
              {filteredPosts && <p className="text-xs text-muted-foreground">{filteredPosts.length} პოსტი</p>}
            </div>
            <Button
              onClick={handleCreatePost}
              className="gap-2 w-full sm:w-auto h-11 sm:h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden xs:inline">ახალი პოსტი</span>
              <span className="xs:hidden">პოსტი</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-4xl">
        {/* Controls Section */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 -mx-4 px-4 py-3 mb-4 border-b sm:relative sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:mx-0 sm:px-0 sm:py-0 sm:mb-6">
          <div className="space-y-3">
            {/* Tabs and Filter Toggle */}
            <div className="flex items-center gap-2">
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "latest" | "top")} className="flex-1">
                <TabsList className="w-full grid grid-cols-2 h-10 sm:h-11">
                  <TabsTrigger value="latest" className="gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">უახლესი</span>
                    <span className="xs:hidden">ახალი</span>
                  </TabsTrigger>
                  <TabsTrigger value="top" className="gap-1.5 sm:gap-2 text-sm sm:text-base">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ტოპ
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="icon"
                className="sm:hidden h-10 w-10"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Search - Always Visible */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="ძებნა..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-11 bg-background"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tag Filter - Collapsible on Mobile */}
        {popularTags && popularTags.length > 0 && (
          <div className={`mb-6 ${showFilters ? "block" : "hidden sm:block"}`}>
            <div className="bg-muted/30 rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">ფილტრი თაგებით</span>
                {selectedTag && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    აქტიური
                  </Badge>
                )}
              </div>
              <ScrollArea className="w-full">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={!selectedTag ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap transition-all hover:scale-105 px-3 py-1.5"
                    onClick={() => setSelectedTag(undefined)}
                  >
                    ყველა
                  </Badge>
                  {popularTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTag === tag.slug ? "default" : "outline"}
                      className="cursor-pointer whitespace-nowrap transition-all hover:scale-105 px-3 py-1.5"
                      onClick={() => setSelectedTag(tag.slug)}
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {tag.name}
                      <span className="ml-1.5 text-xs opacity-70">{tag.use_count}</span>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">იტვირთება...</p>
          </div>
        ) : filteredPosts && filteredPosts.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredPosts.map((post) => (
              <PostCard key={post.post_id} post={post} isAuthenticated={!!user} onAuthRequired={handleAuthRequired} />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-16 sm:py-24 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl border-2 border-dashed">
            <div className="max-w-md mx-auto px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <p className="text-lg sm:text-xl font-semibold mb-2">ვერაფერი მოიძებნა</p>
              <p className="text-sm text-muted-foreground mb-4">ძიებით "{searchQuery}" შედეგები არ არის</p>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="gap-2">
                ძიების გასუფთავება
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 sm:py-24 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-dashed border-primary/20">
            <div className="max-w-md mx-auto px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <p className="text-lg sm:text-xl font-semibold mb-2">ჯერ პოსტები არაა</p>
              <p className="text-sm text-muted-foreground mb-6">დაიწყე შენ და გააზიარე შენი გამოცდილება 👋</p>
              <Button
                onClick={handleCreatePost}
                className="gap-2 h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                პირველი პოსტი
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreatePostDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <AuthRequiredDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </Layout>
  );
}
