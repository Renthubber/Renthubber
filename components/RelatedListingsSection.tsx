
import React from 'react';
import { ListingCategory } from '../types';
import { MOCK_LISTINGS } from '../constants'; // Using mock data directly for demo
import { Star } from 'lucide-react';

interface RelatedListingsSectionProps {
  category: ListingCategory;
}

export const RelatedListingsSection: React.FC<RelatedListingsSectionProps> = ({ category }) => {
  // Filter similar listings (excluding current one logically, but here just showing generic mocks)
  const similar = MOCK_LISTINGS.filter(l => l.category === category).slice(0, 4);

  if (similar.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Potrebbe interessarti anche</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
         {similar.map((item) => (
            <div key={item.id} className="cursor-pointer group">
               <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden mb-3 relative">
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                     {item.subCategory}
                  </div>
               </div>
               <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:underline">{item.title}</h4>
                  <div className="flex items-center text-xs font-medium">
                     <Star className="w-3 h-3 fill-current text-gray-900 mr-1" /> {item.rating}
                  </div>
               </div>
               <p className="text-gray-500 text-xs mb-1">{item.location}</p>
               <p className="text-sm"><span className="font-bold text-gray-900">€{item.price}</span> <span className="text-gray-500 font-normal">/{item.priceUnit}</span></p>
            </div>
         ))}
      </div>
    </div>
  );
};
