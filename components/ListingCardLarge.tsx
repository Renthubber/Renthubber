import React from 'react';
import { Listing, User } from '../types';
import { Star, MapPin } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

interface ListingCardLargeProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
  currentUser?: User | null;
}

export const ListingCardLarge: React.FC<ListingCardLargeProps> = ({ 
  listing, 
  onClick, 
  currentUser 
}) => {
  const coverImage = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://via.placeholder.com/600x400?text=Renthubber';

  const isSuperHubber = listing.owner?.isSuperHubber;

  const handleClick = () => {
    onClick(listing);
  };

  return (
    <div
      className="group cursor-pointer bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col w-full"
      onClick={handleClick}
    >
      {/* Image - PIÙ GRANDE stile Airbnb */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-200">
        <img
          src={coverImage}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Categoria - ALTO SINISTRA */}
        {listing.subCategory && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 uppercase shadow-md">
            {listing.subCategory}
          </div>
        )}
        
        {/* Cuore - ALTO DESTRA */}
        <FavoriteButton 
          listingId={listing.id} 
          userId={currentUser?.id}
          variant="card"
        />
        
        {/* SuperHubber badge - BASSO SINISTRA */}
        {isSuperHubber && (
          <div className="absolute bottom-3 left-3 bg-brand text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            SUPERHUBBER
          </div>
        )}
      </div>

      {/* Content - PIÙ ARIOSO */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Titolo e Rating */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 flex-1 pr-2">
            {listing.title}
          </h3>
          <div className="flex items-center text-sm font-medium text-gray-900 flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current mr-1" />
            {listing.rating ?? 'Nuovo'}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        {/* Prezzo - PIÙ GRANDE */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-lg text-brand">€{listing.price}</span>
            <span className="text-gray-500 text-sm">/{listing.priceUnit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};