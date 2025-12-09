import React, { useState, useRef, useEffect } from 'react';
import { X, Grid } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) return null;

  // Scroll to specific image
  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const imageWidth = container.offsetWidth;
      container.scrollTo({
        left: imageWidth * index,
        behavior: 'smooth'
      });
    }
  };

  // Handle scroll to update dots
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const imageWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / imageWidth);
      setCurrentImageIndex(index);
    }
  };

  return (
    <>
      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-2xl overflow-hidden relative">
        {/* Main Image */}
        <div className="col-span-2 row-span-2 relative cursor-pointer hover:opacity-95 transition-opacity" onClick={() => setShowModal(true)}>
          <img src={images[0]} alt="Main" className="w-full h-full object-cover" />
        </div>

        {/* Side Images */}
        {images.slice(1, 5).map((img, idx) => (
          <div key={idx} className="relative cursor-pointer hover:opacity-95 transition-opacity" onClick={() => setShowModal(true)}>
            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
          </div>
        ))}

        {/* Fillers if less than 5 images */}
        {images.length < 5 && Array.from({ length: 5 - images.length }).map((_, idx) => (
           <div key={`fill-${idx}`} className="bg-gray-100" />
        ))}

        {/* Show All Button */}
        <button 
          onClick={() => setShowModal(true)}
          className="absolute bottom-4 right-4 bg-white border border-black/10 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-gray-100 transition-all flex items-center"
        >
          <Grid className="w-4 h-4 mr-2" /> Mostra tutte le foto
        </button>
      </div>

      {/* Mobile Swipeable Carousel - NATIVO */}
      <div className="md:hidden relative h-80 -mx-4 sm:mx-0 bg-gray-200">
        {/* Swipeable Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-scroll snap-x snap-mandatory h-full scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img, idx) => (
            <div 
              key={idx}
              className="w-full h-full flex-shrink-0 snap-center snap-always"
            >
              <img 
                src={img} 
                alt={`Image ${idx + 1}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-semibold pointer-events-none">
           {currentImageIndex + 1} / {images.length}
        </div>

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToImage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImageIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Show All Button - Mobile */}
        <button 
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white border border-black/10 text-gray-800 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center"
        >
          <Grid className="w-3 h-3 mr-1" /> Tutte
        </button>
      </div>

      {/* Fullscreen Modal - SFONDO BIANCO + X FLOATING */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
           {/* X button - floating in alto a destra sulla foto */}
           <button 
             onClick={() => setShowModal(false)} 
             className="fixed top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white border border-gray-300 rounded-full transition-all shadow-lg"
             aria-label="Chiudi galleria"
           >
             <X className="w-5 h-5 text-gray-900" strokeWidth={2} />
           </button>
           
           {/* Gallery Content */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
              <div className="max-w-3xl mx-auto space-y-4">
                 {images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Full ${idx}`} className="w-full rounded-lg shadow-sm" />
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};