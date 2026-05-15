import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import type { Product } from '../types';
import ProductCard from './ProductCard';
import { Search, Tag, Loader2, Zap } from 'lucide-react';

export default function Catalog({ isAdmin, onEdit }: { isAdmin?: boolean; onEdit?: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSegment, setActiveSegment] = useState<'loot' | 'coupon' | 'best_offer'>('loot');
// ... existing useEffect ...
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Product[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(data);
      setLoading(false);

      // Handle deep linking/sharing (?deal=ID)
      const urlParams = new URLSearchParams(window.location.search);
      const dealId = urlParams.get('deal');
      if (dealId && data.length > 0) {
        const product = data.find(p => p.id === dealId);
        if (product) {
          // If the deal is in a different segment, we might need to switch (optional enhancement)
          // For now, let's just wait for render and scroll
          setTimeout(() => {
            const element = document.getElementById(`product-${dealId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('ring-4', 'ring-orange-500', 'ring-offset-4');
              setTimeout(() => element.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-4'), 3000);
            }
          }, 500);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const segments = [
    { id: 'loot', label: 'Loot Zone', icon: Zap, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', desc: 'Extreme 1 Rs deals & price drops' },
    { id: 'coupon', label: 'Coupon Deals', icon: Tag, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', desc: 'Zomato, Dominos & more coupons' },
    { id: 'best_offer', label: 'Best Offers', icon: Search, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'High value curated deals' }
  ];

  const filteredProducts = products.filter(p => {
    // Default to 'best_offer' if dealType is missing for legacy compatibility
    const productSegment = p.dealType || 'best_offer';
    const matchesSegment = productSegment === activeSegment;
    
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    // Filter out expired products (if expireAt exists)
    const isExpired = p.expireAt && p.expireAt.toDate() <= new Date();

    return matchesSegment && matchesSearch && matchesCategory && !isExpired;
  });

  const categories = ['All', ...Array.from(new Set(products.filter(p => p.dealType === activeSegment).map(p => p.category)))];


  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      {/* 1. TOP SOCIAL ROW */}
      <div className="flex flex-col items-center gap-3 mt-6 sm:mt-10 mb-8 px-2">
        <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em]">Join for instant Loot alerts</p>
        <div className="flex w-full gap-3 max-w-lg">
          <a 
            href="https://t.me/offerbazaarofficial01" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-2xl font-black text-[11px] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.462 8.299c.147.123.332.247.455.336.123.089.231.201.268.34.037.139.043.286.012.427-.144.939-1.278 6.096-1.963 8.147-.043.123-.105.235-.192.332-.087.097-.198.172-.321.221-.123.049-.259.071-.393.064-.134-.007-.265-.043-.383-.104-.118-.061-.22-.148-.298-.255-.078-.107-.129-.232-.148-.363-.049-.333-.314-2.113-.444-3.003-.012-.084-.04-.165-.084-.235-.044-.07-.105-.126-.176-.164-.071-.038-.152-.057-.234-.055-.082.002-.162.023-.231.061-.413.235-3.018 1.706-3.856 2.185-.098.056-.208.086-.321.086-.113 0-.224-.03-.321-.086-.413-.235-1.129-.636-1.542-.871-.123-.07-.231-.161-.321-.271s-.148-.236-.172-.37-.024-.27-.001-.403.048-.261.121-.375c.34-.531 6.814-4.524 9.176-6.09.084-.056.183-.086.284-.086.101 0 .2.03.284.086z"/></svg>
            TELEGRAM
          </a>
          <a 
            href="https://whatsapp.com/channel/0029VbBTx0y2f3EDHnwLHJ3q" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#1ebd5e] text-white rounded-2xl font-black text-[11px] transition-all shadow-lg shadow-green-500/20 active:scale-95"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-2.652 0-5.147 1.03-7.02 2.905-1.873 1.874-2.901 4.372-2.903 7.027-.001 2.224.646 3.734 1.555 5.237l-1.007 3.676 3.775-.99c.001 0 .001 0 0 0z"/></svg>
            WHATSAPP
          </a>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="relative mb-8 group max-w-2xl mx-auto w-full">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search for products & loot deals...`}
          className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-gray-900 transition-all text-base shadow-sm"
        />
      </div>

      {/* 3. DEAL ZONE SELECTOR (Row) */}
      <div className="flex overflow-x-auto gap-3 pb-8 no-scrollbar touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {segments.map((seg) => (
          <button
            key={seg.id}
            onClick={() => setActiveSegment(seg.id as any)}
            className={`flex-1 min-w-[140px] p-4 rounded-3xl border-2 transition-all duration-300 text-left ${
              activeSegment === seg.id 
              ? `${seg.bg} ${seg.border} ring-4 ring-white shadow-xl shadow-${seg.id === 'loot' ? 'red' : seg.id === 'coupon' ? 'blue' : 'orange'}-500/10` 
              : 'bg-white border-gray-50 hover:border-orange-100'
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${seg.bg} flex items-center justify-center mb-3`}>
              <seg.icon className={`w-4 h-4 ${seg.color}`} />
            </div>
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter mb-1">{seg.label}</p>
            <p className="text-[8px] font-bold text-gray-500 leading-tight line-clamp-2">{seg.desc}</p>
          </button>
        ))}
      </div>

      {/* 4. CATEGORY FILTERS */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-[9px] font-black transition-all uppercase tracking-widest border-2 ${
              selectedCategory === cat 
              ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' 
              : 'bg-white text-gray-500 border-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <section className="px-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-gray-400">
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-orange-500 mb-6 sm:mb-8" />
            <p className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-gray-300">Syncing Deals...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-16">
            {categories.filter(cat => cat !== 'All').map(category => {
              const categoryProducts = filteredProducts.filter(p => p.category === category);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category} className="space-y-6">
                  <div className="flex items-center justify-between px-4 sm:px-0">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase flex items-center gap-3">
                      <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                      {category}
                    </h2>
                    <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest border border-orange-100">
                      {categoryProducts.length} Deals
                    </span>
                  </div>
                  
                  <div className="relative group">
                    <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 px-4 sm:px-0 no-scrollbar scroll-smooth">
                      {categoryProducts.map(product => (
                        <div key={product.id} id={`product-${product.id}`} className="flex-shrink-0 w-[140px] sm:w-[180px] scroll-mt-24 transition-all duration-500 rounded-2xl">
                          <ProductCard 
                            product={product} 
                            isAdmin={isAdmin} 
                            onEdit={onEdit}
                            onDelete={async (id) => {
                              if (window.confirm('Are you sure you want to delete this deal?')) {
                                try {
                                  await deleteDoc(doc(db, 'products', id));
                                } catch (err) {
                                  console.error('Delete failed', err);
                                  alert('Failed to delete deal');
                                }
                              }
                            }} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 sm:py-40 bg-white rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 shadow-inner">
            <Search className="w-16 h-16 sm:w-20 sm:h-20 text-gray-100 mx-auto mb-6 sm:mb-8" />
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tighter uppercase px-4">No {activeSegment} Found</h3>
            <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto font-medium px-4">We couldn't find any deals in this segment for your selection.</p>
          </div>
        )}
      </section>

      {/* SEO & Geo-SEO Section */}
      <section className="mt-32 px-0 max-w-6xl mx-auto">
        <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-gray-100 shadow-sm">
           <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 sm:mb-8 tracking-tighter uppercase">OfferBazar.xyz: India's Ultimate Loot Guide</h2>
           
           <div className="prose prose-orange max-w-none">
             <p className="text-gray-600 mb-8 font-medium leading-relaxed max-w-3xl text-sm sm:text-base">
                India's most trusted platform for finding extreme loot deals and verified coupon codes.
             </p>

             <h3 className="font-black text-xl text-gray-900 mt-12 mb-4 uppercase tracking-tight">What is OfferBazar?</h3>
             <p className="text-gray-600 font-medium mb-6 text-sm sm:text-base">
               OfferBazar is India's leading deal aggregation platform.
             </p>
             <ul className="list-disc pl-6 sm:pl-8 text-gray-600 font-medium space-y-3 mb-12 text-sm sm:text-base">
               <li><strong>1 Rs Loot Deals:</strong> Real-time alerts.</li>
               <li><strong>Verified Coupons:</strong> 100% working promo codes.</li>
             </ul>
           </div>
        </div>
      </section>

      <footer className="mt-40 px-4 pt-20 border-t border-gray-100 bg-white rounded-t-[5rem]">
        <div className="text-center pb-12">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} OfferBazar.xyz - India's #1 Loot & Coupon Destination.
            </p>
        </div>
      </footer>
    </div>
  );
}
