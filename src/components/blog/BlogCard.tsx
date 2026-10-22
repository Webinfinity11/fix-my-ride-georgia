import { getOptimizedImageUrl } from '@/utils/imageCompression';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { calculateReadTime, formatDate, extractTextFromHtml, truncateText } from '@/utils/blogHelpers';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface BlogCardProps {
  post: BlogPost;
  priorityImage?: boolean;
  compact?: boolean;
}

export const BlogCard = ({ post, priorityImage = false, compact = false }: BlogCardProps) => {
  const readTime = calculateReadTime(post.content);
  const excerpt = post.excerpt || truncateText(extractTextFromHtml(post.content), 150);

  return (
    <Link to={`/blog/${post.slug}`} className="block h-full">
      <Card className="group flex h-full flex-col overflow-hidden rounded-2xl transition-all hover:shadow-lg">
        {post.featured_image && (
          <div className={`relative shrink-0 overflow-hidden ${compact ? "aspect-[16/8]" : "aspect-[16/9]"}`}>
            <LazyImage
              src={getOptimizedImageUrl(post.featured_image, 600, 338, 70, { cropToFit: true })}
              fallbackSrc={post.featured_image}
              priority={priorityImage}
              width={600}
              height={338}
              alt={post.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {post.is_featured && (
              <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">
                <Star className="mr-1 h-3 w-3" />
                გამორჩეული
              </Badge>
            )}
          </div>
        )}
        <div className={`flex flex-1 flex-col ${compact ? "p-4 md:p-5" : "p-6"}`}>
          <h3 className={`mb-3 font-bold line-clamp-2 group-hover:text-primary transition-colors ${compact ? "text-base leading-7 min-h-14" : "text-xl"}`}>
            {post.title}
          </h3>
          <p className={`mb-4 text-muted-foreground ${compact ? "text-sm leading-6 line-clamp-2" : "line-clamp-3"}`}>{excerpt}</p>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.published_at || post.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {readTime} წთ
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
