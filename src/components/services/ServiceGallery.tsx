
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ServiceGalleryProps {
  photos: string[];
  serviceName: string;
}

const ServiceGallery = ({ photos, serviceName }: ServiceGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  if (!photos || photos.length === 0) {
    return null;
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % photos.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const openGallery = () => {
    setIsGalleryOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Main Image - Square Format */}
      <div className="relative group cursor-pointer" onClick={openGallery}>
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={photos[currentImageIndex]}
            alt={`${serviceName} - ფოტო ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
        
        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:scale-110 transition-transform duration-200">
            <ZoomIn className="text-primary w-6 h-6" />
          </div>
        </div>

        {/* Navigation arrows for main image */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Image counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm backdrop-blur-sm">
            {currentImageIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip - Square thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 cursor-pointer"
              onClick={() => setCurrentImageIndex(index)}
            >
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                <img
                  src={photo}
                  alt={`${serviceName} - ფოტო ${index + 1}`}
                  className={`w-full h-full object-cover border-2 transition-all duration-200 hover:scale-105 ${
                    index === currentImageIndex
                      ? "border-primary shadow-md"
                      : "border-transparent hover:border-gray-300"
                  }`}
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
          <div className="relative h-full bg-black rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
              onClick={() => setIsGalleryOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={photos[currentImageIndex]}
                alt={`${serviceName} - ფოტო ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded backdrop-blur-sm">
                  {currentImageIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceGallery;
