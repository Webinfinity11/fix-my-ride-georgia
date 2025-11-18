import { Link } from 'react-router-dom';
import { Calendar, Clock, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateReadTime, formatDate } from '@/utils/blogHelpers';
import type { BlogPost } from '@/hooks/useBlogPosts';

interface BlogHeroProps {
  post: BlogPost;
}

export const BlogHero = ({ post }: BlogHeroProps) => {
  const readTime = calculateReadTime(post.content);

  return (
    <Link to={`/blog/${post.slug}`} className="block">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
          <div className="flex flex-col justify-center">
            <Badge className="mb-4 w-fit bg-primary text-primary-foreground">
              <Star className="mr-1 h-3 w-3" />
              გამორჩეული პოსტი
            </Badge>
            <h2 className="mb-4 text-3xl md:text-4xl font-bold line-clamp-3 hover:text-primary transition-colors">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="mb-6 text-lg text-muted-foreground line-clamp-3">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                {post.profiles?.avatar_url && (
                  <img
                    src={post.profiles.avatar_url}
                    alt={`${post.profiles.first_name} ${post.profiles.last_name}`}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <span className="font-medium">
                  {post.profiles?.first_name} {post.profiles?.last_name}
                </span>
              </div>
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
          {post.featured_image && (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
