import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { Product } from '../types';

export default function ProductCard({ product }: { product: Product; key?: React.Key }) {
  // Use a nice fallback image if missing or scraping fails grabbing one temporarily
  const imageUrl = product.imageUrl || "https://placehold.co/400x300/f8fafc/94a3b8?text=No+Image+Available";

  return (
    <a 
      href={product.originalLink} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative"
    >
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-orange-600 border border-orange-100 flex items-center gap-1 z-10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        Get Deal <ExternalLink className="w-3 h-3" />
      </div>

      <div className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        <img 
          src={imageUrl} 
          alt={product.title}
          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/400x400/f8fafc/94a3b8?text=Image+Unavailable";
          }}
        />
        <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
           {product.price > 0 ? `$${product.price.toFixed(2)}` : "Check Price"}
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-xs font-medium text-orange-600 mb-1.5 uppercase tracking-wide">
          {product.category}
        </div>
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-orange-600 transition-colors">
          {product.title}
        </h3>
      </div>
    </a>
  );
}
