import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageCircle, Bookmark, Flag, MoreVertical, Pencil, Trash2, Share2, Pin, PinOff, Hash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import { CommunityPost, useToggleSave, useDeletePost, useTogglePin } from "@/hooks/useCommunityPosts";
import { useToggleReaction } from "@/hooks/useReactions";
import { CommentList } from "./CommentList";
import { ReportDialog } from "./ReportDialog";
import { EditPostDialog } from "./EditPostDialog";
import { ImageGalleryModal } from "./ImageGalleryModal";
import { PostReactions } from "./PostReactions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostCardProps {
  post: CommunityPost;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

export function PostCard({ post, isAuthenticated, onAuthRequired }: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);

  const saveMutation = useToggleSave(post.post_id);
  const deletePost = useDeletePost();
  const toggleReaction = useToggleReaction();
  const togglePinMutation = useTogglePin();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);

      // Check if user is admin
      if (session?.user?.id) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setIsAdmin(profile?.role === "admin");
      }
    });

    // Fetch reactions
    fetchReactions();
  }, []);

  const fetchReactions = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .from("reactions")
      .select("reaction_type, user_id")
      .eq("post_id", post.post_id);

    if (!error && data) {
      const grouped = ["like", "funny", "fire", "helpful"].map((type) => ({
        type,
        count: data.filter((r) => r.reaction_type === type).length,
        userReacted: session?.user
          ? data.some((r) => r.reaction_type === type && r.user_id === session.user.id)
          : false,
      }));
      setReactions(grouped);
    }
  };

  const contentLength = post.content?.length || 0;
  const shouldTruncate = contentLength > 300;

  const handleReaction = (reactionType: string) => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    toggleReaction.mutate(
      { postId: post.post_id, reactionType: reactionType as any },
      {
        onSuccess: () => {
          fetchReactions();
        },
      },
    );
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    saveMutation.mutate();
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/community?post=${post.post_id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author_name}-ის პოსტი`,
          text: post.content?.substring(0, 100) || "გაზიარება",
          url: postUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(postUrl);
      toast.success("ბმული დაკოპირდა");
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    setShowReport(true);
  };

  const handleEdit = () => {
    setShowEdit(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deletePost.mutate(post.post_id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
      },
    });
  };

  const isAuthor = currentUserId === post.author_id;

  return (
    <Card className="overflow-hidden border-border/50 hover:border-border transition-all hover:shadow-lg bg-card">
      {/* Pinned Badge - Outside Card */}
      {post.is_pinned && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
          <div className="px-4 py-2">
            <Badge variant="secondary" className="gap-1.5 bg-primary/15 border-primary/30 text-primary">
              <Pin className="h-3 w-3" />
              აპინული პოსტი
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {/* Author Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-background shadow-sm">
              <AvatarImage src={post.author_avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {post.author_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                {post.author_name}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ka,
                })}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isAdmin && (
                <DropdownMenuItem
                  onClick={() =>
                    togglePinMutation.mutate({
                      postId: post.post_id,
                      isPinned: !post.is_pinned,
                    })
                  }
                  className="gap-2"
                >
                  {post.is_pinned ? (
                    <>
                      <PinOff className="h-4 w-4" />
                      გაუქმება
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" />
                      აპინვა
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {isAuthor && (
                <DropdownMenuItem onClick={handleEdit} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  რედაქტირება
                </DropdownMenuItem>
              )}
              {(isAuthor || isAdmin) && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive gap-2">
                  <Trash2 className="h-4 w-4" />
                  წაშლა
                </DropdownMenuItem>
              )}
              {!isAuthor && (
                <DropdownMenuItem onClick={handleReport} className="gap-2">
                  <Flag className="h-4 w-4" />
                  რეპორტი
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        {post.content && (
          <div className="px-4 pb-3">
            <div
              className={`prose prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-p:my-1 ${
                !showFullContent && shouldTruncate ? "line-clamp-4" : ""
              }`}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {shouldTruncate && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowFullContent(!showFullContent)}
                className="p-0 h-auto font-medium text-primary hover:text-primary/80 mt-1"
              >
                {showFullContent ? "ნაკლების ნახვა" : "მეტის ნახვა..."}
              </Button>
            )}
          </div>
        )}

        {/* Media */}
        {post.media_url && (
          <div className="w-full bg-black/5">
            {post.media_type === "image" ? (
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full h-auto object-contain max-h-[500px] sm:max-h-[600px] cursor-pointer select-none"
                loading="lazy"
                onClick={() => setShowGallery(true)}
              />
            ) : (
              <video
                src={post.media_url}
                controls
                preload="metadata"
                playsInline
                className="w-full h-auto max-h-[500px] sm:max-h-[600px]"
              >
                თქვენი ბრაუზერი არ აწვდის ვიდეოს.
              </video>
            )}
          </div>
        )}

        {/* Actions Bar */}
        <div className="px-4 pt-3 pb-2 space-y-2">
          {/* Main Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <PostReactions reactions={reactions} onReact={handleReaction} disabled={toggleReaction.isPending} />
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground h-9 px-3"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{post.comment_count}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-1.5 text-muted-foreground hover:text-primary h-9 px-3"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className={`h-9 w-9 ${
                post.is_saved ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-primary"
              }`}
            >
              <Bookmark className={`h-5 w-5 ${post.is_saved ? "fill-current" : ""}`} />
            </Button>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {post.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-xs px-2 py-0.5 font-medium"
                >
                  <Hash className="h-3 w-3 mr-0.5" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section - Separated */}
        <div className="border-t bg-muted/20">
          <CommentList
            postId={post.post_id}
            isAuthenticated={isAuthenticated}
            onAuthRequired={onAuthRequired}
            initialLimit={3}
          />
        </div>
      </CardContent>

      <ReportDialog open={showReport} onOpenChange={setShowReport} postId={post.post_id} />

      <EditPostDialog open={showEdit} onOpenChange={setShowEdit} post={post} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხარ?</AlertDialogTitle>
            <AlertDialogDescription>ეს მოქმედება ვერ გაუქმდება. პოსტი სამუდამოდ წაიშლება.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              წაშლა
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {post.media_type === "image" && post.media_url && (
        <ImageGalleryModal
          images={[post.media_url]}
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          initialIndex={0}
        />
      )}
    </Card>
  );
}
