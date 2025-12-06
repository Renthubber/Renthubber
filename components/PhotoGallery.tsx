
import React, { useState } from 'react';
import { X, Grid } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ images }) => {
  const [showModal, setShowModal] = useState(false);

  if (!images || images.length === 0) return null;

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

      {/* Mobile Slider */}
      <div className="md:hidden relative h-72 -mx-4 sm:mx-0 bg-gray-200">
        <img src={images[0]} alt="Main" className="w-full h-full object-cover" />
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-xs font-bold">
           1 / {images.length}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in fade-in">
           <div className="p-4 flex justify-between items-center border-b border-gray-100">
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                 <X className="w-5 h-5" />
              </button>
              <span className="font-bold text-gray-900">Galleria fotografica</span>
              <div className="w-9"></div> 
           </div>
           <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
              <div className="max-w-3xl mx-auto space-y-4">
                 {images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Full ${idx}`} className="w-full rounded-lg shadow-sm" />
                 ))}
              </div>
           </div>
        </div>
      )}
    </>
  );
};
