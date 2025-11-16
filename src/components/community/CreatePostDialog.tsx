import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Image as ImageIcon, Video, Loader2, Hash, Sparkles } from "lucide-react";
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
  const [showTagsSection, setShowTagsSection] = useState(false);

  const createPost = useCreatePost();
  const { data: popularTags } = usePopularTags();

  // Prevent body scroll when dialog is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [open]);

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
        content: content.trim() || undefined,
        tags,
        mediaFile: mediaFile || undefined,
      });

      setContent("");
      setTags([]);
      setMediaFile(null);
      setMediaPreview(null);
      setTagInput("");
      setShowTagsSection(false);
      onOpenChange(false);
    } catch (error: any) {
      // Error already handled in hook
    }
  };

  const handleClose = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setContent("");
    setTags([]);
    setMediaFile(null);
    setMediaPreview(null);
    setTagInput("");
    setShowTagsSection(false);
    onOpenChange(false);
  };

  const isSubmitDisabled = createPost.isPending || (!content.trim() && !mediaFile);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
              ახალი პოსტი
            </DialogTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-5 pb-20 sm:pb-6">
            {/* Content Editor */}
            <div className="space-y-2">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="რას ფიქრობ? გაგვიზიარე შენი აზრი..."
              />
            </div>

            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative rounded-lg sm:rounded-xl overflow-hidden bg-muted/30 border border-border group">
                {mediaFile?.type.startsWith("image") ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full object-contain max-h-[250px] sm:max-h-[400px] bg-muted/10"
                  />
                ) : (
                  <video src={mediaPreview} controls className="w-full max-h-[250px] sm:max-h-[400px] bg-muted/10" playsInline />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 sm:h-10 sm:w-10 shadow-lg"
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

            {/* Media Upload Buttons */}
            {!mediaFile && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  className="border-dashed hover:border-primary/50 hover:bg-primary/5 h-10 sm:h-9"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">ფოტოს დამატება</span>
                  <span className="xs:hidden">ფოტო</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("video-upload")?.click()}
                  className="border-dashed hover:border-primary/50 hover:bg-primary/5 h-10 sm:h-9"
                >
                  <Video className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">ვიდეოს დამატება</span>
                  <span className="xs:hidden">ვიდეო</span>
                </Button>
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
              </div>
            )}

            {/* Tags Toggle Button - Mobile */}
            <div className="sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTagsSection(!showTagsSection)}
                className="w-full border-dashed h-10"
              >
                <Hash className="h-4 w-4 mr-2" />
                თაგები {tags.length > 0 && `(${tags.length})`}
              </Button>
            </div>

            {/* Tags Section */}
            <div className={`space-y-3 ${showTagsSection ? "block" : "hidden sm:block"}`}>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  თაგები
                  <span className="text-xs text-muted-foreground font-normal">(მაქსიმუმ 5)</span>
                </Label>
                <Input
                  placeholder="თაგის დასახელება (Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  disabled={tags.length >= 5}
                  className="border-dashed focus:border-solid h-10 sm:h-9"
                />
              </div>

              {/* Selected Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/30 border">
                  {tags.map((tag, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="gap-1.5 px-2.5 sm:px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors text-xs sm:text-sm"
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                      <X
                        className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors ml-1"
                        onClick={() => handleRemoveTag(i)}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Popular Tags */}
              {popularTags && popularTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    პოპულარული თაგები
                  </Label>
                  <ScrollArea className="w-full">
                    <div className="flex sm:flex-wrap gap-2 pb-2 sm:pb-0 sm:max-h-32 sm:overflow-y-auto">
                      {popularTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className={`cursor-pointer transition-all duration-200 text-xs sm:text-sm whitespace-nowrap ${
                            tags.includes(tag.name)
                              ? "bg-primary/15 border-primary text-primary"
                              : "hover:bg-muted hover:border-primary/30"
                          }`}
                          onClick={() => handleAddPopularTag(tag.name)}
                        >
                          <Hash className="h-3 w-3 mr-0.5" />
                          {tag.name}
                          <span className="ml-1.5 text-xs opacity-60">{tag.use_count}</span>
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer with Submit Button */}
        <div className="shrink-0 fixed sm:relative bottom-0 left-0 right-0 px-4 sm:px-6 py-3 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.15)] sm:shadow-none z-50">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full h-12 sm:h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {createPost.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                იტვირთება...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                გამოქვეყნება
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
