import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, Upload, Trash2 } from 'lucide-react';
import { useUpdatePost } from '@/hooks/useCommunityPosts';
import { CommunityPost } from '@/hooks/useCommunityPosts';
import { RichTextEditor } from './RichTextEditor';
import { toast } from 'sonner';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: CommunityPost;
}

export function EditPostDialog({ open, onOpenChange, post }: EditPostDialogProps) {
  const [content, setContent] = useState(post.content || '');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const updatePost = useUpdatePost();

  useEffect(() => {
    if (open) {
      setContent(post.content || '');
      setTags(post.tags.map((t: any) => t.name));
      setMediaFile(null);
      setMediaPreview(null);
      setRemoveExistingMedia(false);
    }
  }, [open, post]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('მხოლოდ სურათები და ვიდეოები');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('ფაილი ძალიან დიდია (მაქს 50MB)');
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setRemoveExistingMedia(false);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setRemoveExistingMedia(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      { 
        postId: post.post_id, 
        content: content.trim(), 
        tags,
        mediaFile: mediaFile || undefined,
        removeMedia: removeExistingMedia
      },
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

          {/* Media Upload */}
          <div>
            <Label>მედია (სურათი ან ვიდეო)</Label>
            
            {/* Current or new media preview */}
            {(mediaPreview || (post.media_url && !removeExistingMedia)) && (
              <div className="relative mt-2 rounded-lg overflow-hidden border">
                {post.media_type === 'video' && !mediaPreview ? (
                  <video src={post.media_url!} className="w-full h-48 object-cover" controls />
                ) : mediaPreview ? (
                  mediaFile?.type.startsWith('video/') ? (
                    <video src={mediaPreview} className="w-full h-48 object-cover" controls />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover" />
                  )
                ) : (
                  <img src={post.media_url!} alt="Post media" className="w-full h-48 object-cover" />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveMedia}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload button */}
            {!mediaPreview && !post.media_url && (
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="media-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  მედიის ატვირთვა
                </Button>
              </div>
            )}

            {/* Replace button */}
            {(mediaPreview || post.media_url) && !removeExistingMedia && (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                ჩანაცვლება
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
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
