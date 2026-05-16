import React, { useEffect, useRef, memo } from 'react';
import { ExternalLink, Trash2, Edit2, Share2, ShoppingCart } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => Promise<void>;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = memo(({ 
  product, 
  isAdmin, 
  onEdit, 
  onDelete,
  onClick 
}) => {
  const imageUrl = product.imageUrl || "/logo.jpeg";
  const isLoot = product.isFlashDeal || product.price < 500;
  const tag = product.badgeTag || (isLoot ? "LOOT DEAL" : "");

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const hasTracked = useRef(false);

  useEffect(() => {
    if (product.id && !isAdmin && !hasTracked.current) {
      hasTracked.current = true;
      const docRef = doc(db, 'products', product.id);
      updateDoc(docRef, {
        views: increment(1)
      }).catch(() => { });
    }
  }, [product.id, isAdmin]);

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid modal opening
    if (product.id && !isAdmin) {
      const docRef = doc(db, 'products', product.id);
      updateDoc(docRef, {
        clicks: increment(1)
      }).catch(() => { });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}${window.location.pathname}?deal=${product.id}`;
    const shareText = `🔥 Checkout this loot deal on OfferBazar!\n\n${product.title}\n\nBuy Now👉🏻: `;
    
    const shareData: any = {
      title: product.title,
      text: shareText,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        if (product.imageUrl && navigator.canShare) {
          try {
            // Use a reliable CORS proxy to ensure we can fetch the image blob
            const proxiedUrl = `https://corsproxy.io/?url=${encodeURIComponent(product.imageUrl)}`;
            const blobResponse = await fetch(proxiedUrl).catch(() => null);
            
            if (blobResponse && blobResponse.ok) {
              const blob = await blobResponse.blob();
              const file = new File([blob], 'deal.jpg', { type: blob.type });
              if (navigator.canShare({ files: [file] })) {
                shareData.files = [file];
              }
            }
          } catch (imgErr) {
            console.warn('Could not include image in share', imgErr);
          }
        }
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText, shareUrl);
        }
      }
    } else {
      copyToClipboard(shareText, shareUrl);
    }
  };

  const copyToClipboard = async (text: string, url: string) => {
    try {
      await navigator.clipboard.writeText(`${text}${url}`);
      alert('Deal link copied to clipboard!');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  return (
    <div
      onClick={() => onClick(product)}
      className={`group block bg-white rounded-3xl shadow-sm border border-orange-50/50 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 transform hover:-translate-y-2 relative cursor-pointer ${product.isFlashDeal ? 'ring-2 ring-orange-500/10' : ''}`}
    >
      {tag && (
        <div className={`absolute top-3 left-3 text-[8px] font-black px-2 py-1 rounded-lg z-20 shadow-sm tracking-tight uppercase ${product.isFlashDeal ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
          {tag}
        </div>
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1 z-30">
        {isAdmin && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="bg-white/95 backdrop-blur-md p-2 rounded-xl text-blue-500 border border-blue-50 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (product.id) onDelete(product.id);
                }}
                className="bg-white/95 backdrop-blur-md p-2 rounded-xl text-red-500 border border-red-50 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>


      <div className="relative aspect-square overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        <img
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/logo.jpeg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md text-orange-600 text-[10px] font-black px-4 py-2 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 border border-orange-50">
            VIEW DETAILS
          </div>
        </div>
        {discount > 0 && (
          <div className="absolute bottom-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="p-4 pt-1">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
            {product.category}
          </span>
        </div>

        <h3 className="font-black text-gray-900 leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors text-xs mb-3 tracking-tight">
          {product.title}
        </h3>

        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              {product.dealType === 'coupon' && product.price === 0 ? (
                <span className="text-sm font-black text-blue-600 uppercase">
                  FREE
                </span>
              ) : (
                <>
                  <span className="text-base font-black text-gray-900 tracking-tighter">
                    ₹{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[10px] text-gray-400 line-through font-bold">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-orange-500 transition-all"
              title="Share Deal"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={product.originalLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBuyClick}
              className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-xl shadow-lg shadow-orange-500/20 active:scale-90 transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
