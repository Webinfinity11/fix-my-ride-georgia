import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Heart, MessageCircle, Bookmark, Flag, MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import { CommunityPost, useToggleLike, useToggleSave, useDeletePost } from '@/hooks/useCommunityPosts';
import { CommentList } from './CommentList';
import { ReportDialog } from './ReportDialog';
import { EditPostDialog } from './EditPostDialog';
import { ImageGalleryModal } from './ImageGalleryModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostCardProps {
  post: CommunityPost;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

export function PostCard({ post, isAuthenticated, onAuthRequired }: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const likeMutation = useToggleLike(post.post_id);
  const saveMutation = useToggleSave(post.post_id);
  const deletePost = useDeletePost();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });
  }, []);
  
  const contentLength = post.content?.length || 0;
  const shouldTruncate = contentLength > 200;
  
  const handleLike = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    likeMutation.mutate();
  };
  
  const handleSave = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    saveMutation.mutate();
  };
  
  const handleComment = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    setShowComments(!showComments);
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/community?post=${post.post_id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author_name}-ის პოსტი`,
          text: post.content?.substring(0, 100) || 'გაზიარება',
          url: postUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(postUrl);
      toast.success('ბმული დაკოპირდა');
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
      }
    });
  };

  const isAuthor = currentUserId === post.author_id;
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Author Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.author_avatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {post.author_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground">{post.author_name}</div>
              <div className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { 
                  addSuffix: true,
                  locale: ka 
                })}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor ? (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    რედაქტირება
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    წაშლა
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="mr-2 h-4 w-4" />
                  რეპორტი
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Content */}
        {post.content && (
          <div className="mb-3">
            <p className={`text-foreground whitespace-pre-wrap ${!showFullContent && shouldTruncate ? 'line-clamp-3' : ''}`}>
              {post.content}
            </p>
            {shouldTruncate && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setShowFullContent(!showFullContent)}
                className="p-0 h-auto font-normal"
              >
                {showFullContent ? 'ნაკლების ნახვა' : 'მეტის ნახვა'}
              </Button>
            )}
          </div>
        )}
        
        {/* Media */}
        {post.media_url && (
          <div className="mb-3 rounded-lg overflow-hidden bg-muted">
            {post.media_type === 'image' ? (
              <img 
                src={post.media_url} 
                alt="Post media" 
                className="w-full h-auto object-cover max-h-[500px] cursor-pointer hover:opacity-95 transition-opacity"
                loading="lazy"
                onClick={() => setShowGallery(true)}
              />
            ) : (
              <video 
                src={post.media_url} 
                controls 
                preload="metadata"
                className="w-full h-auto max-h-[500px]"
              >
                თქვენი ბრაუზერი არ აწვდის ვიდეოს.
              </video>
            )}
          </div>
        )}
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`gap-1 ${post.is_liked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
            >
              <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="text-xs sm:text-sm font-medium">{post.like_count}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleComment}
              className={`gap-1 ${showComments ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-medium">{post.comment_count}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="gap-1 text-muted-foreground hover:text-primary"
            >
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className={`h-8 w-8 ${post.is_saved ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
          >
            <Bookmark className={`h-4 w-4 sm:h-5 sm:w-5 ${post.is_saved ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <CommentList 
            postId={post.post_id} 
            isAuthenticated={isAuthenticated}
            onAuthRequired={onAuthRequired}
          />
        )}
      </CardContent>
      
      <ReportDialog 
        open={showReport}
        onOpenChange={setShowReport}
        postId={post.post_id}
      />

      <EditPostDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        post={post}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>დარწმუნებული ხარ?</AlertDialogTitle>
            <AlertDialogDescription>
              ეს მოქმედება ვერ გაუქმდება. პოსტი სამუდამოდ წაიშლება.
            </AlertDialogDescription>
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

      {post.media_type === 'image' && post.media_url && (
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
