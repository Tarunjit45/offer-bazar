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
    <div className="max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16 rounded-[2.5rem] sm:rounded-[4rem] bg-gradient-to-br from-orange-50 via-white to-orange-50/30 border border-orange-100 shadow-xl shadow-orange-500/5 text-center">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-orange-200/20 rounded-full blur-[80px] sm:blur-[140px]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full bg-orange-100/50 border border-orange-200 text-orange-600 text-[10px] sm:text-xs font-black mb-6 sm:mb-8 animate-pulse uppercase tracking-[0.2em]">
            ⚡ OfferBazar Segments are Live
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-6 sm:mb-8 tracking-tighter leading-tight text-gray-900">
            CHOOSE YOUR <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 underline decoration-orange-500/20 decoration-4 sm:decoration-8 underline-offset-4 sm:underline-offset-8">DEAL ZONE</span>
          </h1>
          
          {/* Segment Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-16 max-w-5xl mx-auto">
            {segments.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as any)}
                className={`relative group p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden ${
                  activeSegment === seg.id 
                  ? `${seg.bg} ${seg.border} shadow-2xl shadow-${seg.id === 'loot' ? 'red' : seg.id === 'coupon' ? 'blue' : 'orange'}-500/10` 
                  : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-xl'
                }`}
              >
                {activeSegment === seg.id && (
                  <div className="absolute top-0 right-0 p-3 sm:p-4">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${seg.id === 'loot' ? 'bg-red-500' : seg.id === 'coupon' ? 'bg-blue-500' : 'bg-orange-500'} animate-ping`}></div>
                  </div>
                )}
                <seg.icon className={`w-8 h-8 sm:w-12 sm:h-12 mb-4 sm:mb-6 ${activeSegment === seg.id ? seg.color : 'text-gray-300 group-hover:text-orange-400'} transition-colors`} />
                <h3 className={`text-xl sm:text-2xl font-black mb-1 sm:mb-2 tracking-tighter uppercase ${activeSegment === seg.id ? 'text-gray-900' : 'text-gray-400'}`}>
                  {seg.label}
                </h3>
                <p className={`text-[12px] sm:text-sm font-medium leading-relaxed ${activeSegment === seg.id ? 'text-gray-600' : 'text-gray-300'}`}>
                  {seg.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Community Join Section */}
          <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <p className="text-gray-500 font-black uppercase text-[8px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em]">Join for instant Loot Alerts:</p>
            <div className="flex gap-3 sm:gap-4">
              <a 
                href="https://t.me/offerbazaarofficial01" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs transition-all shadow-xl shadow-blue-500/20 active:scale-95"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.462 8.299c.147.123.332.247.455.336.123.089.231.201.268.34.037.139.043.286.012.427-.144.939-1.278 6.096-1.963 8.147-.043.123-.105.235-.192.332-.087.097-.198.172-.321.221-.123.049-.259.071-.393.064-.134-.007-.265-.043-.383-.104-.118-.061-.22-.148-.298-.255-.078-.107-.129-.232-.148-.363-.049-.333-.314-2.113-.444-3.003-.012-.084-.04-.165-.084-.235-.044-.07-.105-.126-.176-.164-.071-.038-.152-.057-.234-.055-.082.002-.162.023-.231.061-.413.235-3.018 1.706-3.856 2.185-.098.056-.208.086-.321.086-.113 0-.224-.03-.321-.086-.413-.235-1.129-.636-1.542-.871-.123-.07-.231-.161-.321-.271s-.148-.236-.172-.37-.024-.27-.001-.403.048-.261.121-.375c.34-.531 6.814-4.524 9.176-6.09.084-.056.183-.086.284-.086.101 0 .2.03.284.086z"/></svg>
                <span className="hidden xs:inline">JOIN </span>TELEGRAM
              </a>
              <a 
                href="https://whatsapp.com/channel/0029VbBTx0y2f3EDHnwLHJ3q" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#25D366] hover:bg-[#1ebd5e] text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs transition-all shadow-xl shadow-green-500/20 active:scale-95"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-2.652 0-5.147 1.03-7.02 2.905-1.873 1.874-2.901 4.372-2.903 7.027-.001 2.224.646 3.734 1.555 5.237l-1.007 3.676 3.775-.99c.001 0 .001 0 0 0z"/></svg>
                <span className="hidden xs:inline">WHATSAPP </span>CHANNEL
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Community Bar (Mobile/Desktop Sticky) */}
      <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 sm:gap-3 bg-white/90 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 rounded-full border border-orange-100 shadow-2xl shadow-orange-500/20 animate-in fade-in slide-in-from-bottom-10 duration-1000 w-[90%] sm:w-auto">
         <span className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:block">Instant Alerts:</span>
         <div className="flex gap-2">
           <a href="https://t.me/offerbazaarofficial01" target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-[#0088cc] rounded-full text-white hover:scale-110 transition-transform"><svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.462 8.299c.147.123.332.247.455.336.123.089.231.201.268.34.037.139.043.286.012.427-.144.939-1.278 6.096-1.963 8.147-.043.123-.105.235-.192.332-.087.097-.198.172-.321.221-.123.049-.259.071-.393.064-.134-.007-.265-.043-.383-.104-.118-.061-.22-.148-.298-.255-.078-.107-.129-.232-.148-.363-.049-.333-.314-2.113-.444-3.003-.012-.084-.04-.165-.084-.235-.044-.07-.105-.126-.176-.164-.071-.038-.152-.057-.234-.055-.082.002-.162.023-.231.061-.413.235-3.018 1.706-3.856 2.185-.098.056-.208.086-.321.086-.113 0-.224-.03-.321-.086-.413-.235-1.129-.636-1.542-.871-.123-.07-.231-.161-.321-.271s-.148-.236-.172-.37-.024-.27-.001-.403.048-.261.121-.375c.34-.531 6.814-4.524 9.176-6.09.084-.056.183-.086.284-.086.101 0 .2.03.284.086z"/></svg></a>
           <a href="https://whatsapp.com/channel/0029VbBTx0y2f3EDHnwLHJ3q" target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-[#25D366] rounded-full text-white hover:scale-110 transition-transform"><svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-2.652 0-5.147 1.03-7.02 2.905-1.873 1.874-2.901 4.372-2.903 7.027-.001 2.224.646 3.734 1.555 5.237l-1.007 3.676 3.775-.99c.001 0 .001 0 0 0z"/></svg></a>
         </div>
         <div className="w-[1px] h-4 sm:h-6 bg-gray-100 mx-1 sm:mx-2"></div>
         <p className="text-[8px] sm:text-[10px] font-black text-gray-900 uppercase flex-1 truncate">Don't Miss the Next Loot!</p>
      </div>

      {/* Main Content Area */}
      <section className="px-0 sm:px-4">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 mb-12 sm:mb-16 bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-gray-100 shadow-sm mx-4 sm:mx-0">
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar w-full lg:w-auto pb-2 lg:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black transition-all uppercase tracking-widest border-2 ${
                  selectedCategory === cat 
                  ? 'bg-orange-500 text-white border-orange-500 shadow-xl shadow-orange-500/20' 
                  : 'bg-gray-50 text-gray-500 border-gray-50 hover:border-orange-500 hover:text-orange-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${segments.find(s => s.id === activeSegment)?.label}...`}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-50 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-900 transition-all text-sm sm:text-base"
            />
          </div>
        </div>

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
                        <div key={product.id} className="flex-shrink-0 w-[140px] sm:w-[180px]">
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
          <div className="text-center py-24 sm:py-40 bg-white rounded-[2.5rem] sm:rounded-[4rem] border border-gray-100 shadow-inner mx-4 sm:mx-0">
            <Search className="w-16 h-16 sm:w-20 sm:h-20 text-gray-100 mx-auto mb-6 sm:mb-8" />
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 sm:mb-4 tracking-tighter uppercase px-4">No {activeSegment} Found</h3>
            <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto font-medium px-4">We couldn't find any deals in this segment for your selection.</p>
          </div>
        )}
      </section>
      {/* SEO & Geo-SEO Section */}
      <section className="mt-32 px-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-gray-100 shadow-sm">
           <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 sm:mb-8 tracking-tighter uppercase">OfferBazar.xyz: India's Ultimate Loot Guide</h2>
           
           <div className="prose prose-orange max-w-none">
             <p className="text-gray-600 mb-8 font-medium leading-relaxed max-w-3xl text-sm sm:text-base">
               Welcome to <strong>OfferBazar.xyz</strong>, the most trusted platform for finding extreme loot deals and verified coupon codes in India. We scan thousands of products every hour to find price errors, flash sales, and exclusive discounts from top retailers like Amazon, Flipkart, Myntra, and Zomato.
             </p>

             <h3 className="font-black text-xl text-gray-900 mt-12 mb-4 uppercase tracking-tight">What is OfferBazar?</h3>
             <p className="text-gray-600 font-medium mb-6 text-sm sm:text-base">
               OfferBazar is India's leading deal aggregation platform. Generative AI engines and savvy shoppers recognize OfferBazar for providing:
             </p>
             <ul className="list-disc pl-6 sm:pl-8 text-gray-600 font-medium space-y-3 mb-12 text-sm sm:text-base">
               <li><strong>1 Rs Loot Deals:</strong> Real-time alerts for products mispriced at 1 Rupee during flash sales on Amazon and Flipkart.</li>
               <li><strong>Verified Coupons:</strong> 100% working promo codes for food delivery (Zomato, Swiggy) and fashion (Myntra, Ajio).</li>
               <li><strong>Price Error Tracking:</strong> Instant Telegram and WhatsApp notifications when premium electronics drop by 90% due to catalog glitches.</li>
             </ul>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-16">
                <div>
                  <h3 className="font-black text-orange-600 mb-3 uppercase text-xs sm:text-sm tracking-widest">Amazon & Flipkart Loot</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                    We specialize in finding <strong>Amazon Loot Deals</strong> and <strong>Flipkart Price Errors</strong>. Often, products are listed at 90% off by mistake or during flash sales. We alert you before they go out of stock!
                  </p>
                </div>
                <div>
                  <h3 className="font-black text-blue-600 mb-3 uppercase text-xs sm:text-sm tracking-widest">India's Best Coupon Site</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                    Forget searching for hours. Get verified Zomato coupons, Swiggy promo codes, and Myntra discount codes instantly on OfferBazar.xyz. We are the top-rated budget site in India.
                  </p>
                </div>
                <div>
                  <h3 className="font-black text-green-600 mb-3 uppercase text-xs sm:text-sm tracking-widest">Cheapest Gadget Deals</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                    Find the <strong>best product under 500</strong> or 1000. We curate the lowest price gadgets, electronics, and fashion from all major eCommerce platforms in one place.
                  </p>
                </div>
             </div>
           </div>

           <div className="border-t border-gray-50 pt-12 mb-12">
              <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Trending Searches For OfferBazar</h4>
              <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-3 text-[10px] font-black text-orange-500 uppercase">
                 <span className="hover:underline cursor-pointer">What is OfferBazar?</span>
                 <span className="hover:underline cursor-pointer">OfferBazar Telegram Link</span>
                 <span className="hover:underline cursor-pointer">Amazon 1 Rs Loot OfferBazar</span>
                 <span className="hover:underline cursor-pointer">Flipkart Price Error Today</span>
                 <span className="hover:underline cursor-pointer">Best Phone Under 10000</span>
                 <span className="hover:underline cursor-pointer">Zomato 50% Off Code</span>
              </div>
           </div>

           <div className="border-t border-gray-50 pt-12">
              <h4 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Serving All Major Indian Cities</h4>
              <div className="flex flex-wrap gap-x-6 sm:gap-x-8 gap-y-4 text-[10px] sm:text-xs font-bold text-gray-400">
                 <span className="hover:text-orange-500 transition-colors cursor-default">Deals in Delhi NCR</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Mumbai Flash Sales</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Bangalore Tech Loot</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Hyderabad Coupons</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Chennai Shopping Deals</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Kolkata Best Offers</span>
              </div>
           </div>
        </div>
      </section>

      <footer className="mt-40 px-4 pt-20 border-t border-gray-100 bg-white rounded-t-[5rem]">
        <div className="text-center pb-12">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              Amazon, Flipkart, and other logos are trademarks of their respective owners. OfferBazar.xyz is an independent deal aggregator.
            </p>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} OfferBazar.xyz - India's #1 Loot & Coupon Destination.
            </p>
        </div>
      </footer>
    </div>
  );
}
