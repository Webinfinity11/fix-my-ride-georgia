import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, Eye, Facebook, Twitter, Linkedin, Copy } from 'lucide-react';
import { useBlogPost, useBlogPosts, useIncrementBlogView } from '@/hooks/useBlogPosts';
import { calculateReadTime, formatDate } from '@/utils/blogHelpers';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BlogCard } from '@/components/blog/BlogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug!);
  const { data: relatedPosts } = useBlogPosts('published');
  const incrementView = useIncrementBlogView();

  useEffect(() => {
    if (post?.id) {
      incrementView.mutate(post.id);
    }
  }, [post?.id]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('ბმული დაკოპირდა');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-8" />
          <Skeleton className="aspect-[16/9] w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">სტატია ვერ მოიძებნა</h1>
          <Link to="/blog">
            <Button>დაბრუნება ბლოგზე</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const readTime = calculateReadTime(post.content);
  const related = relatedPosts?.filter(p => p.id !== post.id && p.author_id === post.author_id).slice(0, 3) || [];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.meta_description,
    image: post.featured_image,
    author: {
      '@type': 'Person',
      name: `${post.profiles?.first_name} ${post.profiles?.last_name}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'FixUp',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/fixup-logo.jpg`,
      },
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
  };

  return (
    <Layout>
      <Helmet>
        <title>{post.meta_title || post.title} | FixUp ბლოგი</title>
        <meta name="description" content={post.meta_description || post.excerpt || ''} />
        {post.meta_keywords && <meta name="keywords" content={post.meta_keywords} />}
        <link rel="canonical" href={`${window.location.origin}/blog/${post.slug}`} />
        
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.meta_description || ''} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${window.location.origin}/blog/${post.slug}`} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        
        <meta property="article:published_time" content={post.published_at || post.created_at} />
        <meta property="article:modified_time" content={post.updated_at} />
        <meta property="article:author" content={`${post.profiles?.first_name} ${post.profiles?.last_name}`} />
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <article className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">მთავარი</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/blog">ბლოგი</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
          {post.profiles && (
            <div className="flex items-center gap-2">
              {post.profiles.avatar_url && (
                <img
                  src={post.profiles.avatar_url}
                  alt={`${post.profiles.first_name} ${post.profiles.last_name}`}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <span className="font-medium text-foreground">
                {post.profiles.first_name} {post.profiles.last_name}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(post.published_at || post.created_at)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {readTime} წთ
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {post.view_count} ნახვა
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <Separator className="my-8" />

        {/* Share Buttons */}
        <div className="flex items-center gap-4 mb-12">
          <span className="font-medium">გაზიარება:</span>
          <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}>
            <Facebook className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
            <Twitter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}>
            <Linkedin className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => handleShare('copy')}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <>
            <Separator className="my-12" />
            <h2 className="text-2xl font-bold mb-6">სხვა სტატიები ამ ავტორისგან</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </>
        )}
      </article>
    </Layout>
  );
}
