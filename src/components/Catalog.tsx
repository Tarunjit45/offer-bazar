import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import type { Product } from '../types';
import ProductCard from './ProductCard';
import { Search, SlidersHorizontal, Loader2, Zap } from 'lucide-react';

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const flashDeals = products.filter(p => p.isFlashDeal);
  const normalProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 px-4 sm:px-6 lg:px-8 mb-16 rounded-[3rem] bg-[#020617] text-white shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-orange-600/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black mb-8 animate-pulse uppercase tracking-[0.2em]">
            ⚡ Flash Loot is Live
          </div>
          <h1 className="text-5xl sm:text-7xl font-black mb-8 tracking-tighter leading-none">
            EVERYTHING AT <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 underline decoration-orange-500/30 decoration-8 underline-offset-8">UNBELIEVABLE PRICES</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            iPhone for 1 Rs? Laptop for 100? Yes, it's possible only on <strong>OfferBazar</strong>. We find the most extreme loot deals and limited-time offers across India.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto bg-white/5 p-3 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-14 pr-4 py-5 bg-transparent text-white border-none focus:ring-0 outline-none placeholder:text-gray-500 text-xl font-bold"
                placeholder="Search: iPhone in 1 Rs, Laptop under 100..."
              />
            </div>
            <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-black px-10 py-5 rounded-[2rem] transition-all shadow-xl shadow-orange-500/30 active:scale-95 text-lg uppercase tracking-wider">
              Find Loot
            </button>
          </div>
        </div>
      </section>

      {/* Flash Loot Section (Horizontal) */}
      {flashDeals.length > 0 && (
        <section className="mb-20 px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Flash Loot</h2>
                <p className="text-red-500 font-bold text-xs animate-pulse">EXTREME PRICE DROPS - ENDING SOON</p>
              </div>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-8 pt-2 no-scrollbar snap-x">
            {flashDeals.map(product => (
              <div key={product.id} className="w-[300px] flex-shrink-0 snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Products Section */}
      <section className="px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Curated Catalog</h2>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-8 py-3 rounded-2xl text-xs font-black transition-all uppercase tracking-widest border-2 ${
                  selectedCategory === cat 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-xl' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <Loader2 className="w-16 h-16 animate-spin text-orange-500 mb-8" />
            <p className="text-2xl font-black tracking-tighter uppercase text-gray-300">Searching Database...</p>
          </div>
        ) : normalProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {normalProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white rounded-[4rem] border border-gray-100 shadow-inner">
            <Search className="w-20 h-20 text-gray-100 mx-auto mb-8" />
            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase">No Loot Found</h3>
            <p className="text-gray-400 text-lg max-w-md mx-auto font-medium">We couldn't find any deals for this search. Try "iPhone", "Laptop", or "Groceries".</p>
          </div>
        )}
      </section>

      {/* Extreme SEO FAQ Section */}
      <section className="mt-32 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <h2 className="text-4xl font-black text-gray-900 mb-12 tracking-tighter uppercase">Deals FAQ</h2>
          <div className="space-y-10">
            <div className="group">
              <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">How to get an iPhone in 1 Rs?</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                At OfferBazar, we track extreme "Flash Loot" deals from major retailers. Occasionally, during mega sales, phones are listed at crazy prices like 1 Rs. We alert you instantly so you can grab them before they go out of stock!
              </p>
            </div>
            <div className="group">
              <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">Where can I find Laptops under 100?</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                We scan for budget laptops and clearance sales where refurbished or older models are sold at throwaway prices. OfferBazar is the best budget site for such extreme savings.
              </p>
            </div>
            <div className="group">
              <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">Is OfferBazar available in my city?</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                Yes! Our deals are valid all over India, including Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, and Pune. We cover all pincodes!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Geo-SEO & Footer Section */}
      <footer className="mt-40 px-4 pt-20 border-t border-gray-100 bg-white rounded-t-[5rem]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Top Cities</h4>
            <ul className="space-y-3 text-sm font-bold text-gray-600">
              <li>Deals in Delhi NCR</li>
              <li>Mumbai Flash Sales</li>
              <li>Bangalore Tech Loot</li>
              <li>Hyderabad Best Offers</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Extreme Deals</h4>
            <ul className="space-y-3 text-sm font-bold text-gray-600">
              <li>iPhone in 1 Rs</li>
              <li>Laptop under 500</li>
              <li>Phone in 200</li>
              <li>Free Sample Deals</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Categories</h4>
            <ul className="space-y-3 text-sm font-bold text-gray-600">
              <li>Groceries Loot</li>
              <li>Fashion Deals</li>
              <li>Home Decor Sale</li>
              <li>Gadgets Discount</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Company</h4>
            <ul className="space-y-3 text-sm font-bold text-gray-600">
              <li>About OfferBazar</li>
              <li>Best Budget Site</li>
              <li>Contact Us</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
        <div className="text-center pb-12">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} OfferBazar India. All Rights Reserved.
            </p>
        </div>
      </footer>
    </div>
  );
}
