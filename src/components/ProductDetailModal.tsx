import React from 'react';
import { X, ExternalLink, Share2, ShoppingCart, Tag, Clock, Zap } from 'lucide-react';
import type { Product } from '../types';

interface ProductDetailModalProps {
  product: Product;
  allProducts: Product[];
  onClose: () => void;
  onShare: () => void;
  onSelectProduct: (product: Product) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, allProducts, onClose, onShare, onSelectProduct }) => {
  const [isReadMore, setIsReadMore] = React.useState(false);
  const [showScrollHint, setShowScrollHint] = React.useState(true);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 50) {
      setShowScrollHint(false);
    } else {
      setShowScrollHint(true);
    }
  };

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const recommendations = allProducts
    .filter(p => p.id !== product.id && (p.category === product.category || p.dealType === product.dealType))
    .slice(0, 4);

  const descriptionLimit = 200;
  const isTooLong = (product.description || "").length > descriptionLimit;
  const displayedDescription = isTooLong && !isReadMore 
    ? product.description?.slice(0, descriptionLimit) + "..." 
    : product.description;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-4xl sm:rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500 flex flex-col h-full sm:h-auto sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header (Sticky for all) */}
        <div className="flex items-center justify-between p-5 sm:p-7 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-[220]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-500" />
             </div>
             <div className="flex flex-col">
                <span className="font-black text-xs uppercase tracking-widest text-gray-900 leading-none">Deal Details</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Verified & Active</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div 
          className="overflow-y-auto no-scrollbar scroll-smooth flex-1"
          onScroll={handleScroll}
        >
          {/* 1. Large Hero Image Section */}
          <div className="w-full bg-[#FAFAFA] flex items-center justify-center p-8 sm:p-12 relative min-h-[300px] sm:min-h-[450px]">
             <div className="relative group max-w-xl w-full flex items-center justify-center">
                <img 
                  src={product.imageUrl} 
                  alt={product.title}
                  className="max-w-full max-h-[250px] sm:max-h-[400px] object-contain mix-blend-multiply transition-all duration-700 hover:scale-105"
                />
                
                {/* Floating Discount Badge */}
                {discount > 0 && (
                  <div className="absolute -top-4 -left-4 bg-red-600 text-white text-[11px] sm:text-xs font-black px-5 py-2.5 rounded-2xl shadow-2xl uppercase tracking-widest animate-float ring-8 ring-white">
                    -{discount}% OFF
                  </div>
                )}
                
                {product.isFlashDeal && (
                   <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] sm:text-xs font-black px-4 py-2 rounded-2xl shadow-xl animate-pulse ring-4 ring-white uppercase">
                      ⚡ 1 Rs Loot
                   </div>
                )}
             </div>

             {/* Animated Scroll Indicator */}
             <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce transition-all duration-500 ${showScrollHint ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Scroll Down</span>
                <div className="w-6 h-10 border-2 border-gray-900 rounded-full flex items-start justify-center p-1.5">
                   <div className="w-1.5 h-2.5 bg-orange-600 rounded-full animate-pulse"></div>
                </div>
             </div>
          </div>

          {/* 2. Structured Content Container */}
          <div className="max-w-3xl mx-auto w-full px-6 sm:px-12 py-10 sm:py-16">
             
             {/* Category & Timer */}
             <div className="flex items-center gap-3 mb-8">
                <span className="px-4 py-1.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-orange-100">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Prices May Rise Soon
                </div>
             </div>

             {/* Mega Title */}
             <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.05] mb-8 tracking-tighter uppercase text-glow-orange">
                {product.title}
             </h2>

             {/* Pricing Section */}
             <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-12 bg-gray-50/50 p-6 sm:p-8 rounded-[2.5rem] border border-gray-100">
                <div className="flex-1">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Current Sale Price</p>
                   <div className="flex items-baseline gap-4">
                      <span className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tighter">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="flex flex-col">
                           <span className="text-xl sm:text-2xl text-gray-300 line-through font-bold">
                             ₹{product.originalPrice.toLocaleString()}
                           </span>
                           <span className="text-[10px] font-black text-green-600 uppercase tracking-tight">Saved ₹{(product.originalPrice - product.price).toLocaleString()}</span>
                        </div>
                      )}
                   </div>
                </div>
                
                {/* Desktop Buy Shortcut */}
                <div className="hidden sm:block">
                   <a 
                     href={product.originalLink}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[1.5rem] font-black transition-all shadow-2xl shadow-orange-500/30 active:scale-95 uppercase tracking-tight flex items-center gap-3"
                   >
                     Buy Now
                     <ExternalLink className="w-5 h-5" />
                   </a>
                </div>
             </div>

             {/* 3. Description Section (Under Image as requested) */}
             <div className="space-y-6 mb-16">
                <div className="flex items-center gap-3 mb-4">
                   <div className="h-px bg-gray-100 flex-1"></div>
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Deal Description</h4>
                   <div className="h-px bg-gray-100 flex-1"></div>
                </div>
                <div className="prose prose-orange max-w-none">
                   <p className="text-sm sm:text-lg text-gray-600 font-bold leading-relaxed">
                      {displayedDescription || "No detailed description provided for this loot deal. Click 'Order on Store' to see all official specifications and current stock levels."}
                   </p>
                   {isTooLong && (
                     <button 
                       onClick={() => setIsReadMore(!isReadMore)}
                       className="mt-4 text-orange-500 font-black text-xs uppercase tracking-widest hover:text-orange-600 flex items-center gap-2"
                     >
                        {isReadMore ? 'Show Less' : 'Read Full Description'}
                        <Zap className={`w-3 h-3 transition-transform ${isReadMore ? 'rotate-180' : ''}`} />
                     </button>
                   )}
                </div>
             </div>

             {/* Guaranteed Badges */}
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-16">
                {[
                  { icon: Tag, label: "Verified Deal" },
                  { icon: Clock, label: "Instant Access" },
                  { icon: ShoppingCart, label: "Secure Store" }
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                     <badge.icon className="w-5 h-5 text-orange-400" />
                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-tight">{badge.label}</span>
                  </div>
                ))}
             </div>

             {/* Main CTA Section (Mobile Persistent) */}
             <div className="sticky bottom-4 sm:relative sm:bottom-0 z-50">
                <div className="flex gap-3">
                   <a 
                     href={product.originalLink}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex-[4] flex items-center justify-center gap-4 py-5 sm:py-6 bg-orange-600 hover:bg-orange-700 text-white rounded-[2rem] font-black transition-all shadow-[0_20px_50px_rgba(234,88,12,0.3)] active:scale-[0.98] group relative overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                     <ShoppingCart className="w-6 h-6 animate-bounce" />
                     <span className="text-lg sm:text-xl tracking-tight uppercase">Order on Store</span>
                     <ExternalLink className="w-5 h-5 opacity-50" />
                   </a>
                   <button 
                     onClick={onShare}
                     className="flex-1 flex items-center justify-center gap-2 py-5 sm:py-6 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-[2rem] font-black transition-all active:scale-[0.98] border border-gray-200/50"
                   >
                     <Share2 className="w-6 h-6" />
                   </button>
                </div>
             </div>
          </div>

          {/* 4. Recommendations Section */}
          {recommendations.length > 0 && (
            <div className="p-8 sm:p-12 lg:p-20 bg-[#F9FAFB] border-t border-gray-100">
               <div className="max-w-5xl mx-auto">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Zap className="w-4 h-4 fill-current" />
                          Handpicked For You
                       </span>
                       <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter uppercase">Related Loot Deals</h3>
                       <p className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-1">Don't miss these similar offers</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {recommendations.map(rec => (
                      <button
                        key={rec.id}
                        onClick={() => {
                          onSelectProduct(rec);
                          const container = document.querySelector('.overflow-y-auto');
                          if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white p-5 rounded-[2.5rem] border border-transparent hover:border-orange-100 group transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(234,88,12,0.15)] hover:-translate-y-3 text-left flex flex-col h-full ring-1 ring-gray-50"
                      >
                        <div className="aspect-square bg-gray-50/50 rounded-3xl mb-6 overflow-hidden flex items-center justify-center p-6 relative">
                          <img src={rec.imageUrl} alt="" className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-lg">
                                <ExternalLink className="w-4 h-4" />
                             </div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[8px] font-black px-2.5 py-1 bg-gray-50 text-gray-400 rounded-full uppercase tracking-widest">
                              {rec.category}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-2 mb-4 uppercase tracking-tight leading-tight group-hover:text-orange-600 transition-colors">
                            {rec.title}
                          </h4>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <span className="text-lg font-black text-orange-600">₹{rec.price.toLocaleString()}</span>
                               {rec.originalPrice && rec.originalPrice > rec.price && (
                                 <span className="text-[10px] text-gray-300 line-through font-bold">₹{rec.originalPrice.toLocaleString()}</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
