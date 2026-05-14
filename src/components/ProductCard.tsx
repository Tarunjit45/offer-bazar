import React from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import type { Product } from '../types';

export default function ProductCard({ product, isAdmin, onDelete }: { product: Product; key?: React.Key; isAdmin?: boolean; onDelete?: (id: string) => void }) {
  const imageUrl = product.imageUrl || "/logo.jpeg";

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isLoot = product.isFlashDeal || product.price < 500;
  const tag = product.badgeTag || (isLoot ? "LOOT DEAL" : "");

  return (
    <a 
      href={product.originalLink} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`group block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 relative ${product.isFlashDeal ? 'ring-2 ring-orange-500/20' : ''}`}
    >
      {tag && (
        <div className={`absolute top-4 left-4 text-[10px] font-black px-3 py-1 rounded-full z-20 shadow-lg tracking-tighter ${product.isFlashDeal ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
          {tag.toUpperCase()}
        </div>
      )}
      
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isAdmin && onDelete && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (product.id) onDelete(product.id);
            }}
            className="bg-white/95 backdrop-blur-md p-1.5 rounded-full text-red-500 border border-red-100 hover:bg-red-50 hover:text-red-700 transition-all z-20 shadow-sm"
            title="Delete Deal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-gray-900 border border-gray-100 flex items-center gap-1.5 z-20 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300">
          {product.dealType === 'coupon' ? 'GET COUPON' : 'GRAB NOW'} <ExternalLink className="w-3 h-3 text-orange-500" />
        </div>
      </div>

      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50/50 to-white flex items-center justify-center p-8">
        <img 
          src={imageUrl} 
          alt={product.title}
          className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/logo.jpeg";
          }}
        />
        {discount > 0 && (
           <div className="absolute bottom-4 left-4 bg-red-500 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">
             {discount}% OFF
           </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md">
            {product.category}
          </span>
        </div>
        <h3 className="font-bold text-gray-800 leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-orange-600 transition-colors text-sm mb-2">
          {product.title}
        </h3>
        
        {product.description && (
          <p className="text-[11px] text-gray-500 line-clamp-2 mb-4 font-medium leading-relaxed">
            {product.description}
          </p>
        )}
        
        <div className="flex items-baseline gap-2">
            {product.dealType === 'coupon' && product.price === 0 ? (
              <span className="text-xl font-black text-blue-600 uppercase tracking-tighter">
                Redeem Now
              </span>
            ) : (
              <>
                <span className="text-2xl font-black text-gray-900">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-gray-400 line-through font-bold">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </>
            )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 group-hover:text-orange-500 transition-colors uppercase tracking-widest">Limited Offer</span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
        </div>
      </div>
    </a>
  );
}
