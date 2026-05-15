import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Trash2, Edit2, Share2, Eye, MousePointer2 } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../types';

const ProductCard = React.memo(({ product, isAdmin, onEdit, onDelete }: { product: Product; key?: React.Key; isAdmin?: boolean; onEdit?: (product: Product) => void; onDelete?: (id: string) => void }) => {
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

  const handleBuyClick = () => {
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
        // Try to include the image if possible (requires fetching and creating a File object)
        if (product.imageUrl && navigator.canShare) {
          try {
            const response = await fetch(product.imageUrl, { mode: 'no-cors' });
            // Note: no-cors will make the blob empty/opaque, which might not work for sharing.
            // But we try with standard fetch first.
            const blobResponse = await fetch(product.imageUrl).catch(() => null);
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
          console.error('Error sharing:', err);
          // Fallback to clipboard if share failed
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
    <a
      href={product.originalLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleBuyClick}
      className={`group block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative ${product.isFlashDeal ? 'ring-1 ring-orange-500/30' : ''}`}
    >

      {tag && (
        <div className={`absolute top-1.5 left-1.5 text-[7px] font-black px-1.5 py-0.5 rounded-md z-20 shadow-sm tracking-tighter ${product.isFlashDeal ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
          {tag.toUpperCase()}
        </div>
      )}

      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-30">
        {isAdmin && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(product);
                }}
                className="bg-white/95 backdrop-blur-md p-1 rounded-full text-blue-500 border border-blue-100 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm"
                title="Edit Deal"
                aria-label="Edit this deal"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (product.id) onDelete(product.id);
                }}
                className="bg-white/95 backdrop-blur-md p-1 rounded-full text-red-500 border border-red-100 hover:bg-red-50 hover:text-red-700 transition-all shadow-sm"
                title="Delete Deal"
                aria-label="Delete this deal"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>


      <div className="relative aspect-square overflow-hidden bg-white flex items-center justify-center p-2">
        <img
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/logo.jpeg";
          }}
        />
        <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors duration-300 flex items-center justify-center">
          <span className="bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
            BUY NOW
          </span>
        </div>
        {discount > 0 && (
          <div className="absolute bottom-1.5 left-1.5 bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm">
            {discount}% OFF
          </div>
        )}
      </div>

      <div className="p-2 pt-0">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[7px] font-black text-orange-600 uppercase tracking-tighter bg-orange-50 px-1 rounded">
            {product.category}
          </span>
          <div className="flex-1 h-[1px] bg-gray-50"></div>
        </div>

        <h3 className="font-bold text-gray-800 leading-[1.2] line-clamp-2 group-hover:text-orange-600 transition-colors text-[10px] mb-1">
          {product.title}
        </h3>

        <div className="flex items-center justify-between gap-1 mt-auto">
          <div className="flex items-baseline gap-1">
            {product.dealType === 'coupon' && product.price === 0 ? (
              <span className="text-[10px] font-black text-blue-600 uppercase">
                FREE
              </span>
            ) : (
              <>
                <span className="text-sm font-black text-gray-900 leading-none">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[8px] text-gray-500 line-through font-bold">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors"
              title="Share Deal"
              aria-label="Share this deal"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </a>
  );
});

export default ProductCard;
