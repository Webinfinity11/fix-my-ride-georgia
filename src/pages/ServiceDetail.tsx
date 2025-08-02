import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, Download, Share2, Maximize } from "lucide-react";

const ServiceGallery = ({ photos, serviceName }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedImage) return;
      
      switch (e.key) {
        case 'Escape':
          setSelectedImage(null);
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentIndex]);

  const handleImageLoad = (index) => {
    setIsLoading(prev => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index) => {
    setIsLoading(prev => ({ ...prev, [index]: false }));
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const openModal = (index) => {
    setCurrentIndex(index);
    setSelectedImage(photos[index]);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % photos.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(photos[nextIndex]);
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setSelectedImage(photos[prevIndex]);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: serviceName,
          text: `${serviceName}-ის სურათი`,
          url: selectedImage
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(selectedImage);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `${serviceName}-image-${currentIndex + 1}.jpg`;
    link.target = '_blank';
    link.click();
  };

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid gap-3">
        {photos.length === 1 && (
          <div className="relative group cursor-pointer overflow-hidden rounded-xl">
            <div className="aspect-[16/10] relative">
              {isLoading[0] !== false && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
              )}
              <img
                src={photos[0]}
                alt={`${serviceName} - სურათი 1`}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                onClick={() => openModal(0)}
                onLoad={() => handleImageLoad(0)}
                onError={() => handleImageError(0)}
                style={{ display: imageErrors[0] ? 'none' : 'block' }}
              />
              {imageErrors[0] && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl">
                  <span className="text-gray-400 text-sm">სურათი ვერ ჩაიტვირთა</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl" />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                  <ZoomIn className="h-4 w-4 text-gray-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {photos.length === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group cursor-pointer overflow-hidden rounded-xl">
                <div className="aspect-[4/3] relative">
                  {isLoading[index] !== false && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                  <img
                    src={photo}
                    alt={`${serviceName} - სურათი ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    onClick={() => openModal(index)}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                    style={{ display: imageErrors[index] ? 'none' : 'block' }}
                  />
                  {imageErrors[index] && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl">
                      <span className="text-gray-400 text-sm">სურათი ვერ ჩაიტვირთა</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl" />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <ZoomIn className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length === 3 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative group cursor-pointer overflow-hidden rounded-xl">
                <div className="aspect-square relative">
                  {isLoading[index] !== false && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                  <img
                    src={photo}
                    alt={`${serviceName} - სურათი ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    onClick={() => openModal(index)}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                    style={{ display: imageErrors[index] ? 'none' : 'block' }}
                  />
                  {imageErrors[index] && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl">
                      <span className="text-gray-400 text-sm">სურათი ვერ ჩაიტვირთა</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl" />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <ZoomIn className="h-4 w-4 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length >= 4 && (
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden rounded-xl">
              <div className="aspect-square relative">
                {isLoading[0] !== false && (
                  <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
                )}
                <img
                  src={photos[0]}
                  alt={`${serviceName} - მთავარი სურათი`}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                  onClick={() => openModal(0)}
                  onLoad={() => handleImageLoad(0)}
                  onError={() => handleImageError(0)}
                  style={{ display: imageErrors[0] ? 'none' : 'block' }}
                />
                {imageErrors[0] && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl">
                    <span className="text-gray-400 text-sm">სურათი ვერ ჩაიტვირთა</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                    <ZoomIn className="h-5 w-5 text-gray-700" />
                  </div>
                </div>
              </div>
            </div>

            {photos.slice(1, 4).map((photo, index) => (
              <div key={index + 1} className="relative group cursor-pointer overflow-hidden rounded-xl">
                <div className="aspect-square relative">
                  {isLoading[index + 1] !== false && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                  <img
                    src={photo}
                    alt={`${serviceName} - სურათი ${index + 2}`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    onClick={() => openModal(index + 1)}
                    onLoad={() => handleImageLoad(index + 1)}
                    onError={() => handleImageError(index + 1)}
                    style={{ display: imageErrors[index + 1] ? 'none' : 'block' }}
                  />
                  {imageErrors[index + 1] && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl">
                      <span className="text-gray-400 text-xs">სურათი ვერ ჩაიტვირთა</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <ZoomIn className="h-3 w-3 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {photos.length > 4 && (
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-xl"
                onClick={() => openModal(4)}
              >
                <div className="aspect-square relative">
                  {isLoading[4] !== false && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-xl" />
                  )}
                  <img
                    src={photos[4]}
                    alt={`${serviceName} - სურათი 5`}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                    onLoad={() => handleImageLoad(4)}
                    onError={() => handleImageError(4)}
                    style={{ display: imageErrors[4] ? 'none' : 'block' }}
                  />
                  {imageErrors[4] && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl">
                      <span className="text-gray-400 text-xs">სურათი ვერ ჩაიტვირთა</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all duration-300 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <Maximize className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm font-medium">+{photos.length - 4}</span>
                      <div className="text-xs opacity-90">სხვა სურათი</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/20 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Action Buttons */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                onClick={handleShare}
                className="bg-white/10 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/20 transition-all duration-200"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={handleDownload}
                className="bg-white/10 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/20 transition-all duration-200"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/20 transition-all duration-200"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/20 transition-all duration-200"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative max-w-7xl max-h-full">
              <img
                src={selectedImage}
                alt={`${serviceName} - სურათი ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Image Counter */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                  {currentIndex + 1} / {photos.length}
                </div>
              </div>
            )}

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 max-w-full overflow-x-auto">
                <div className="flex gap-2 px-4">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        setSelectedImage(photos[index]);
                      }}
                      className={`relative shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                        index === currentIndex 
                          ? 'ring-2 ring-white shadow-lg' 
                          : 'opacity-60 hover:opacity-80'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`${serviceName} - მინი სურათი ${index + 1}`}
                        className="w-16 h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceGallery;