
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Play, Video } from "lucide-react";

interface ServiceVideoGalleryProps {
  videos: string[];
  serviceName: string;
}

const ServiceVideoGallery = ({ videos, serviceName }: ServiceVideoGalleryProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  if (!videos || videos.length === 0) {
    return null;
  }

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Video */}
      <div className="relative group">
        <div className="relative">
          <video
            src={videos[currentVideoIndex]}
            className="w-full h-48 sm:h-64 object-cover rounded-lg cursor-pointer"
            preload="metadata"
            onClick={() => setIsGalleryOpen(true)}
            onError={(e) => {
              console.error('Video failed to load:', videos[currentVideoIndex]);
            }}
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform duration-200">
              <Play className="text-primary w-8 h-8 ml-1" />
            </div>
          </div>
        </div>

        {/* Navigation arrows for main video */}
        {videos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={(e) => {
                e.stopPropagation();
                prevVideo();
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={(e) => {
                e.stopPropagation();
                nextVideo();
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Video counter */}
        {videos.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentVideoIndex + 1} / {videos.length}
          </div>
        )}
      </div>

      {/* Video thumbnail strip */}
      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {videos.map((video, index) => (
            <div key={index} className="relative flex-shrink-0">
              <video
                src={video}
                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all ${
                  index === currentVideoIndex
                    ? "border-primary"
                    : "border-transparent hover:border-gray-300"
                }`}
                preload="metadata"
                onClick={() => setCurrentVideoIndex(index)}
                onError={(e) => {
                  console.error('Thumbnail video failed to load:', video);
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="text-white w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Video Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <div className="relative h-full bg-black rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
              onClick={() => setIsGalleryOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            <video
              src={videos[currentVideoIndex]}
              className="w-full h-full object-contain"
              controls
              autoPlay
              preload="metadata"
              onError={(e) => {
                console.error('Fullscreen video failed to load:', videos[currentVideoIndex]);
              }}
            />

            {videos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={prevVideo}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={nextVideo}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded">
                  {currentVideoIndex + 1} / {videos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceVideoGallery;
