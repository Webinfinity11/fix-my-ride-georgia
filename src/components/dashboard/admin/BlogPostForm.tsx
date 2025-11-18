import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateBlogPost, useUpdateBlogPost } from '@/hooks/useBlogPosts';
import { BlogRichTextEditor } from '@/components/blog/BlogRichTextEditor';
import { BlogImageUpload } from '@/components/blog/BlogImageUpload';
import type { BlogPost } from '@/hooks/useBlogPosts';
import { useAuth } from '@/context/AuthContext';

interface BlogPostFormProps {
  post?: BlogPost;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  status: 'draft' | 'published';
  is_featured: boolean;
}

export const BlogPostForm = ({ post, onSuccess }: BlogPostFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState(post?.content || '');
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image || '');
  
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: post?.title || '',
      excerpt: post?.excerpt || '',
      meta_title: post?.meta_title || '',
      meta_description: post?.meta_description || '',
      meta_keywords: post?.meta_keywords || '',
      status: post?.status || 'draft',
      is_featured: post?.is_featured || false,
    },
  });

  const status = watch('status');
  const isFeatured = watch('is_featured');

  const onSubmit = async (data: FormData) => {
    if (!user?.id) return;

    const postData: any = {
      ...data,
      content,
      featured_image: featuredImage,
      author_id: user.id,
      title: data.title,
    };

    if (data.status === 'published' && !post?.published_at) {
      postData.published_at = new Date().toISOString();
    }

    if (post) {
      await updatePost.mutateAsync({ id: post.id, ...postData });
    } else {
      await createPost.mutateAsync(postData);
    }
    
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">სათაური *</Label>
        <Input
          id="title"
          {...register('title', { required: 'სათაური აუცილებელია' })}
          placeholder="შეიყვანეთ პოსტის სათაური"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <BlogImageUpload
        currentImage={featuredImage}
        onImageUploaded={setFeaturedImage}
      />

      <div className="space-y-2">
        <Label htmlFor="excerpt">მოკლე აღწერა</Label>
        <Textarea
          id="excerpt"
          {...register('excerpt')}
          placeholder="მოკლე აღწერა (150-200 სიმბოლო)"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>შინაარსი *</Label>
        <BlogRichTextEditor
          content={content}
          onChange={setContent}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meta_title">SEO სათაური</Label>
          <Input
            id="meta_title"
            {...register('meta_title')}
            placeholder="SEO სათაური"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_keywords">საკვანძო სიტყვები</Label>
          <Input
            id="meta_keywords"
            {...register('meta_keywords')}
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meta_description">SEO აღწერა</Label>
        <Textarea
          id="meta_description"
          {...register('meta_description')}
          placeholder="SEO აღწერა (მაქს. 160 სიმბოლო)"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">სტატუსი</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue('status', value as 'draft' | 'published')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">დრაფტი</SelectItem>
              <SelectItem value="published">გამოქვეყნებული</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_featured"
            checked={isFeatured}
            onCheckedChange={(checked) => setValue('is_featured', checked)}
          />
          <Label htmlFor="is_featured">გამორჩეული პოსტი</Label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          გაუქმება
        </Button>
        <Button type="submit" disabled={createPost.isPending || updatePost.isPending}>
          {createPost.isPending || updatePost.isPending
            ? 'მუშავდება...'
            : post
            ? 'განახლება'
            : 'შექმნა'}
        </Button>
      </div>
    </form>
  );
};
