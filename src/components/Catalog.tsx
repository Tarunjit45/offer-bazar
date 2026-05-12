import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import type { Product } from '../types';
import ProductCard from './ProductCard';
import { Search, Tag, Loader2, Zap } from 'lucide-react';

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSegment, setActiveSegment] = useState<'loot' | 'coupon' | 'best_offer'>('loot');

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
    const matchesSegment = p.dealType === activeSegment;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSegment && matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(products.filter(p => p.dealType === activeSegment).map(p => p.category)))];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-4 sm:px-6 lg:px-8 mb-16 rounded-[4rem] bg-gradient-to-br from-orange-50 via-white to-orange-50/30 border border-orange-100 shadow-xl shadow-orange-500/5 text-center">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-[140px]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-orange-100/50 border border-orange-200 text-orange-600 text-xs font-black mb-8 animate-pulse uppercase tracking-[0.2em]">
            ⚡ OfferBazar Segments are Live
          </div>
          <h1 className="text-5xl sm:text-7xl font-black mb-8 tracking-tighter leading-tight text-gray-900">
            CHOOSE YOUR <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 underline decoration-orange-500/20 decoration-8 underline-offset-8">DEAL ZONE</span>
          </h1>
          
          {/* Segment Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
            {segments.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id as any)}
                className={`relative group p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden ${
                  activeSegment === seg.id 
                  ? `${seg.bg} ${seg.border} shadow-2xl shadow-${seg.id === 'loot' ? 'red' : seg.id === 'coupon' ? 'blue' : 'orange'}-500/10` 
                  : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-xl'
                }`}
              >
                {activeSegment === seg.id && (
                  <div className="absolute top-0 right-0 p-4">
                    <div className={`w-3 h-3 rounded-full ${seg.id === 'loot' ? 'bg-red-500' : seg.id === 'coupon' ? 'bg-blue-500' : 'bg-orange-500'} animate-ping`}></div>
                  </div>
                )}
                <seg.icon className={`w-12 h-12 mb-6 ${activeSegment === seg.id ? seg.color : 'text-gray-300 group-hover:text-orange-400'} transition-colors`} />
                <h3 className={`text-2xl font-black mb-2 tracking-tighter uppercase ${activeSegment === seg.id ? 'text-gray-900' : 'text-gray-400'}`}>
                  {seg.label}
                </h3>
                <p className={`text-sm font-medium leading-relaxed ${activeSegment === seg.id ? 'text-gray-600' : 'text-gray-300'}`}>
                  {seg.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="px-4">
        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full lg:w-auto pb-4 lg:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-8 py-3 rounded-2xl text-xs font-black transition-all uppercase tracking-widest border-2 ${
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${segments.find(s => s.id === activeSegment)?.label}...`}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-50 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-gray-900 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader2 className="w-16 h-16 animate-spin text-orange-500 mb-8" />
            <p className="text-2xl font-black tracking-tighter uppercase text-gray-300">Syncing with Live Database...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white rounded-[4rem] border border-gray-100 shadow-inner">
            <Search className="w-20 h-20 text-gray-100 mx-auto mb-8" />
            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">No {activeSegment} Found</h3>
            <p className="text-gray-400 text-lg max-w-md mx-auto font-medium">We couldn't find any deals in this segment for your selection.</p>
          </div>
        )}
      </section>

      {/* SEO & Geo-SEO Section */}
      <section className="mt-32 px-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm">
           <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tighter uppercase">OfferBazar.xyz: India's Ultimate Loot Guide</h2>
           <p className="text-gray-500 mb-12 font-medium leading-relaxed max-w-3xl">
             Welcome to <strong>OfferBazar.xyz</strong>, the most trusted platform for finding extreme loot deals and verified coupon codes in India. We scan thousands of products every hour to find price errors, flash sales, and exclusive discounts from top retailers like Amazon, Flipkart, Myntra, and Zomato.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
              <div>
                <h3 className="font-black text-orange-600 mb-3 uppercase text-xs tracking-widest">Loot Zone India</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  The Loot Zone is where we post "Too Good To Be True" deals. Think iPhones for 1 Rs, Laptops under 500, or Sneakers for 99. These are usually limited-time flash sales or price errors.
                </p>
              </div>
              <div>
                <h3 className="font-black text-blue-600 mb-3 uppercase text-xs tracking-widest">Verified Coupon Deals</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Looking for a Zomato coupon or a Domino's discount code? Our Coupon Deals section features the latest and most reliable promo codes to save you money on food, travel, and shopping.
                </p>
              </div>
              <div>
                <h3 className="font-black text-green-600 mb-3 uppercase text-xs tracking-widest">Best Offers Daily</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Not everything is a loot, but everything here is a great deal. We curate the best value-for-money products so you never overpay for your favorite gadgets or fashion.
                </p>
              </div>
           </div>

           <div className="border-t border-gray-50 pt-12">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Serving All Major Indian Cities</h4>
              <div className="flex flex-wrap gap-x-8 gap-y-4 text-xs font-bold text-gray-400">
                 <span className="hover:text-orange-500 transition-colors cursor-default">Deals in Delhi NCR</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Mumbai Flash Sales</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Bangalore Tech Loot</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Hyderabad Coupons</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Chennai Shopping Deals</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Kolkata Best Offers</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Pune Gadget Loot</span>
                 <span className="hover:text-orange-500 transition-colors cursor-default">Ahmedabad Discounts</span>
              </div>
           </div>
        </div>
      </section>

      <footer className="mt-40 px-4 pt-20 border-t border-gray-100 bg-white rounded-t-[5rem]">
        <div className="text-center pb-12">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} OfferBazar.xyz - India's Premium Loot & Coupon Platform.
            </p>
        </div>
      </footer>
    </div>
  );
}
