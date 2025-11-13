import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { useUpdatePost } from '@/hooks/useCommunityPosts';
import { CommunityPost } from '@/hooks/useCommunityPosts';
import { RichTextEditor } from './RichTextEditor';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: CommunityPost;
}

export function EditPostDialog({ open, onOpenChange, post }: EditPostDialogProps) {
  const [content, setContent] = useState(post.content || '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const updatePost = useUpdatePost();

  useEffect(() => {
    if (open) {
      setContent(post.content || '');
      setTags(post.tags.map((t: any) => t.name));
    }
  }, [open, post]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    updatePost.mutate(
      { postId: post.post_id, content: content.trim(), tags },
      {
        onSuccess: () => {
          onOpenChange(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>პოსტის რედაქტირება</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-content">შინაარსი</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="რას ფიქრობ?"
            />
          </div>

          <div>
            <Label>თაგები (მაქსიმუმ 5)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="დაამატე თაგი..."
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                variant="outline"
              >
                დამატება
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePost.isPending}
            >
              გაუქმება
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || updatePost.isPending}
            >
              {updatePost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              შენახვა
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
