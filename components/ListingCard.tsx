import React from 'react';
import { Listing, User } from '../types';  // ← AGGIUNGI User
import { Star, MapPin } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';  // ← AGGIUNGI QUESTA RIGA

interface ListingCardProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
  currentUser?: User | null;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, currentUser }) => {

  const coverImage =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : 'https://via.placeholder.com/600x400?text=Renthubber';

  const isSuperHubber = listing.owner?.isSuperHubber;

  const handleClick = () => {
    onClick(listing);
  };

  return (
    <div
      className="group cursor-pointer bg-white rounded-md border border-gray-200 overflow-hidden 
                 hover:shadow-md transition-all duration-200 flex flex-col 
                 w-full max-w-[200px] m-0.5"
      onClick={handleClick}
    >
      {/* Image SMALL */}
      <div className="relative w-full h-[115px] overflow-hidden bg-gray-200">
        <img
          src={coverImage}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* ✅ AGGIUNGI QUESTO - Cuore preferiti */}
        {currentUser && (
          <FavoriteButton 
            listingId={listing.id} 
            userId={currentUser.id}
            variant="card"
          />
        )}
        
        {listing.subCategory && (
          <div className="absolute top-1.5 right-1.5 bg-white/90 px-1.5 py-0.5 
                          rounded text-[9px] font-semibold text-brand uppercase shadow-sm">
            {listing.subCategory}
          </div>
        )}
      </div>

      {/* Content ULTRA COMPACT */}
      <div className="p-2.5 flex flex-col flex-grow">

        <div className="flex justify-between items-start mb-0.5">
          <h3 className="font-semibold text-gray-900 text-[12px] leading-tight line-clamp-1">
            {listing.title}
          </h3>

          <div className="flex items-center text-[10px] font-medium text-gray-900">
            <Star className="w-2.5 h-2.5 text-yellow-400 mr-0.5" />
            {listing.rating ?? 'Nuovo'}
          </div>
        </div>

        <div className="flex items-center text-gray-500 text-[10px] mb-2">
          <MapPin className="w-2.5 h-2.5 mr-1" />
          {listing.location}
        </div>

        <div className="mt-auto pt-1 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="font-bold text-[14px] text-brand">€{listing.price}</span>
            <span className="text-gray-500 text-[10px]">/{listing.priceUnit}</span>
          </div>

          {isSuperHubber && (
            <span className="text-[8px] font-bold text-white bg-brand px-1 py-0.5 rounded-full">
              SuperHubber
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
