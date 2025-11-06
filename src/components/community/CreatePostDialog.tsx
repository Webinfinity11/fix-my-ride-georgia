import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCreatePost } from '@/hooks/useCommunityPosts';
import { toast } from 'sonner';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const createPost = useCreatePost();
  
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && tags.length < 5) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };
  
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('ფაილის ზომა არ უნდა აღემატებოდეს 10MB-ს');
        return;
      }
      
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async () => {
    if (!content?.trim() && !mediaFile) {
      toast.error('დაამატეთ ტექსტი ან მედია');
      return;
    }
    
    try {
      await createPost.mutateAsync({ 
        content: content.trim() || undefined, 
        tags, 
        mediaFile: mediaFile || undefined 
      });
      
      // Reset form
      setContent('');
      setTags([]);
      setMediaFile(null);
      setMediaPreview(null);
      setTagInput('');
      onOpenChange(false);
    } catch (error: any) {
      // Error already handled in hook
    }
  };
  
  const handleClose = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>ახალი პოსტი</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Content */}
          <Textarea
            placeholder="რას ფიქრობ? (მაქს. 1000 სიმბოლო)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            className="min-h-[120px] resize-none"
          />
          
          {/* Character count */}
          <div className="text-xs text-muted-foreground text-right">
            {content.length}/1000
          </div>
          
          {/* Tags */}
          <div>
            <Input
              placeholder="თაგები (Enter-ით დამატება, მაქს 5)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={tags.length >= 5}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    #{tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveTag(i)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Media Upload */}
          <div>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={!!mediaFile}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                ფოტო
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('video-upload')?.click()}
                disabled={!!mediaFile}
              >
                <Video className="h-4 w-4 mr-2" />
                ვიდეო
              </Button>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleMediaChange}
            />
            <input
              id="video-upload"
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={handleMediaChange}
            />
            
            {mediaPreview && (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                {mediaFile?.type.startsWith('image') ? (
                  <img src={mediaPreview} alt="Preview" className="w-full rounded-lg" />
                ) : (
                  <video src={mediaPreview} controls className="w-full rounded-lg" />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    if (mediaPreview) {
                      URL.revokeObjectURL(mediaPreview);
                    }
                    setMediaFile(null);
                    setMediaPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={createPost.isPending || (!content.trim() && !mediaFile)}
            className="w-full"
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                იტვირთება...
              </>
            ) : (
              'გამოქვეყნება'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
