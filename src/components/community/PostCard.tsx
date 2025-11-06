import { Heart, MessageCircle, Bookmark, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { CommunityPost } from '@/hooks/useCommunityPosts';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';

interface PostCardProps {
  post: CommunityPost;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onReport: () => void;
  isAuthenticated: boolean;
}

export function PostCard({ post, onLike, onSave, onComment, onReport, isAuthenticated }: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  
  const contentLength = post.content?.length || 0;
  const shouldTruncate = contentLength > 200;
  
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onReport}
            className="h-8 w-8"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
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
                className="w-full h-auto object-cover max-h-[500px]"
                loading="lazy"
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
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onLike}
              className={`gap-1 ${post.is_liked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`}
            >
              <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{post.like_count}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onComment}
              className="gap-1 text-muted-foreground hover:text-primary"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.comment_count}</span>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onSave}
            className={`h-8 w-8 ${post.is_saved ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
          >
            <Bookmark className={`h-5 w-5 ${post.is_saved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
