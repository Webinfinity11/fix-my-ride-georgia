import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Image as ImageIcon, Video, Loader2, Hash } from "lucide-react";
import { useCreatePost } from "@/hooks/useCommunityPosts";
import { usePopularTags } from "@/hooks/usePopularTags";
import { RichTextEditor } from "./RichTextEditor";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const createPost = useCreatePost();
  const { data: popularTags } = usePopularTags();

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && tags.length < 5) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleAddPopularTag = (tagName: string) => {
    if (!tags.includes(tagName) && tags.length < 5) {
      setTags([...tags, tagName]);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("ფაილის ზომა არ უნდა აღემატებოდეს 10MB-ს");
        return;
      }

      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!content?.trim() && !mediaFile) {
      toast.error("დაამატეთ ტექსტი ან მედია");
      return;
    }

    try {
      await createPost.mutateAsync({
        content: content.trim() || "", // შეცვალე undefined-დან empty string-ზე
        tags,
        mediaFile: mediaFile || undefined,
      });

      // Reset form
      setContent("");
      setTags([]);
      setMediaFile(null);
      setMediaPreview(null);
      setTagInput("");
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
      <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b shrink-0">
          <DialogTitle>ახალი პოსტი</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="space-y-4">
            {/* Content */}
            <div>
              <div className="relative">
                <div className="max-h-[300px] overflow-y-auto w-full rounded-md border">
                  <div className="p-3">
                    <RichTextEditor content={content} onChange={setContent} placeholder="რას ფიქრობ?" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>თაგები (მაქსიმუმ 5)</Label>
              <Input
                placeholder="თაგები (Enter-ით დამატება)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={tags.length >= 5}
                className="mt-2"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      #{tag}
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveTag(i)} />
                    </Badge>
                  ))}
                </div>
              )}

              {popularTags && popularTags.length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    პოპულარული თაგები:
                  </Label>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className={`cursor-pointer hover:bg-primary/10 transition-colors ${
                            tags.includes(tag.name) ? "bg-primary/20 border-primary" : ""
                          }`}
                          onClick={() => handleAddPopularTag(tag.name)}
                        >
                          #{tag.name} ({tag.use_count})
                        </Badge>
                      ))}
                    </div>
                  </div>
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
                  onClick={() => document.getElementById("image-upload")?.click()}
                  disabled={!!mediaFile}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  ფოტო
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("video-upload")?.click()}
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
                <div className="relative rounded-lg overflow-hidden bg-muted max-h-[200px]">
                  {mediaFile?.type.startsWith("image") ? (
                    <img src={mediaPreview} alt="Preview" className="w-full rounded-lg object-contain max-h-[200px]" />
                  ) : (
                    <video src={mediaPreview} controls className="w-full rounded-lg max-h-[200px]" />
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
          </div>
        </div>

        {/* Submit Button - Fixed at bottom */}
        <div className="px-4 sm:px-6 py-4 border-t bg-background shrink-0">
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
              "გამოქვეყნება"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
