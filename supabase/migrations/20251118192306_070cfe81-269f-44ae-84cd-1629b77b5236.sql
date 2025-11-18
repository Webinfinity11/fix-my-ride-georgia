-- Fix foreign key relationship for blog_posts author_id
-- First drop the existing foreign key
ALTER TABLE public.blog_posts 
DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

-- Add new foreign key pointing to profiles table
ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;