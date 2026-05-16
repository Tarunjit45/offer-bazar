import React from 'react';
import { X, ExternalLink, Share2, ShoppingCart, Tag, Clock } from 'lucide-react';
import type { Product } from '../types';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onShare: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose, onShare }) => {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white v w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header/Close */}
        <div className="absolute top-6 right-6 z-10">
          <button 
            onClick={onClose}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row overflow-y-auto">
          {/* Image Section */}
          <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-8 relative">
            <img 
              src={product.imageUrl} 
              alt={product.title}
              className="max-h-[300px] md:max-h-full object-contain mix-blend-multiply"
            />
            {discount > 0 && (
              <div className="absolute top-6 left-6 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg">
                {discount}% OFF
              </div>
            )}
            {product.isFlashDeal && (
              <div className="absolute top-6 right-16 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg animate-pulse">
                ⚡ FLASH DEAL
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-wider border border-orange-100">
                {product.category}
              </span>
              <span className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                <Clock className="w-3 h-3" />
                JUST IN
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-4 tracking-tighter">
              {product.title}
            </h2>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-black text-gray-900 tracking-tighter">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-gray-400 line-through font-bold">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 mb-8 flex-1">
              <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Tag className="w-3 h-3" />
                Product Details
              </h4>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                {product.description || "Grab this high-value deal before it expires! Verified for price and availability on " + new URL(product.originalLink).hostname.replace('www.', '') + "."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-auto">
              <a 
                href={product.originalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-[3] flex items-center justify-center gap-3 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-orange-500/20 active:scale-95 group"
              >
                <ShoppingCart className="w-5 h-5" />
                BUY NOW
                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
              <button 
                onClick={onShare}
                className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl transition-all shadow-sm active:scale-95"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
