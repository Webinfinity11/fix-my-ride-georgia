import { Link } from 'react-router-dom';
import { Calendar, Clock, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateReadTime, formatDate, extractTextFromHtml, truncateText } from '@/utils/blogHelpers';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface BlogCardProps {
  post: BlogPost;
}

export const BlogCard = ({ post }: BlogCardProps) => {
  const readTime = calculateReadTime(post.content);
  const excerpt = post.excerpt || truncateText(extractTextFromHtml(post.content), 150);

  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        {post.featured_image && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            {post.is_featured && (
              <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">
                <Star className="mr-1 h-3 w-3" />
                გამორჩეული
              </Badge>
            )}
          </div>
        )}
        <div className="p-6">
          <h3 className="mb-3 text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="mb-4 text-muted-foreground line-clamp-3">{excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
