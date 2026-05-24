import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { Plus, Loader2, Image as ImageIcon, Link as LinkIcon, FileText, Database, Save, X, Trash, Zap, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateId } from '../lib/utils';
import { migrateLegacyProducts } from '../lib/migration';
import type { Product } from '../types';

// ============== AUTOPOST SECTION ==============
function AutopostPanel() {
  const [autoUrl, setAutoUrl] = useState('');
  const [autoStatus, setAutoStatus] = useState<'idle' | 'scraping' | 'ai' | 'posting' | 'done' | 'error'>('idle');
  const [autoError, setAutoError] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [originalPrice, setAutoOriginalPrice] = useState('');

  const statusMessages: Record<string, string> = {
    idle: '',
    scraping: '🔍 Bot is visiting the product page...',
    ai: '🤖 AI is refining title & description...',
    posting: '📦 Saving deal to OfferBazar...',
    done: '✅ Deal posted successfully!',
    error: '',
  };

  const handleAutopost = async () => {
    if (!autoUrl.trim()) { setAutoError('Please paste a product URL.'); return; }
    setAutoError(''); setPreview(null);
    setAutoStatus('scraping');
    try {
      const res = await fetch('/api/autopost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: autoUrl.trim() }),
      });
      setAutoStatus('ai');
      
      // Safely parse the response body
      const text = await res.text();
      if (!text || !text.trim()) throw new Error('Server returned an empty response. The product page may have blocked the bot. Try a different link.');
      
      let data: any;
      try { data = JSON.parse(text); } 
      catch { throw new Error('Server response was not valid JSON: ' + text.slice(0, 100)); }
      
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      
      setPreview(data);
      setAutoStatus('idle');
    } catch (err: any) {
      setAutoError(err.message);
      setAutoStatus('error');
    }
  };

  const handlePublish = async () => {
    if (!preview) return;
    setAutoStatus('posting');
    try {
      const parsedOriginal = parseFloat(originalPrice);
      let finalImageUrl = preview.imageUrl || "https://placehold.co/600x400/orange/white?text=OfferBazar+Deals";

      // Replicate Manual Logic: Convert external image to Base64 to ensure it saves perfectly
      if (preview.imageUrl && preview.imageUrl.startsWith('http')) {
        try {
          const imgRes = await fetch(preview.imageUrl);
          const blob = await imgRes.blob();
          finalImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn("[Autopost] Image conversion failed, using direct link:", e);
        }
      }

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 2);

      // EXACT SAME LOGIC AS YOUR MANUAL handleSubmit
      const productData = {
        title: preview.title,
        price: preview.price || 0,
        originalPrice: isNaN(parsedOriginal) ? (preview.price ? preview.price * 1.3 : 0) : parsedOriginal,
        imageUrl: finalImageUrl,
        originalLink: preview.originalLink || "#",
        category: preview.category || "Miscellaneous",
        description: preview.description || "",
        dealType: preview.dealType || "best_offer",
        isFlashDeal: preview.dealType === 'loot',
        badgeTag: preview.badgeTag || (preview.dealType === 'loot' ? "LOOT" : ""),
        addedBy: auth.currentUser?.email || "admin_user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expireAt: Timestamp.fromDate(expiryDate)
      };

      const docId = generateId();
      await setDoc(doc(db, 'products', docId), productData);

      setAutoStatus('done');
      setTimeout(() => { setAutoStatus('idle'); setPreview(null); setAutoUrl(''); setAutoOriginalPrice(''); }, 4000);
    } catch (err: any) {
      setAutoError(err.message);
      setAutoStatus('error');
    }
  };

  const isLoading = ['scraping', 'ai', 'posting'].includes(autoStatus);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-orange-500 to-pink-500 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_60%)]"></div>
        <div className="relative">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-2xl tracking-tighter">AI Autopost Magic</h2>
              <p className="text-white/70 text-[9px] sm:text-xs font-bold uppercase tracking-widest">Powered by Gemini 1.5 Flash</p>
            </div>
          </div>
          <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
            Paste any affiliate product link. Our AI bot will automatically scrape the image, clean the title, write a description, detect the category, and post the deal — in seconds.
          </p>
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-2 sm:space-y-3">
        <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Affiliate / Product URL</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={autoUrl}
            onChange={e => { setAutoUrl(e.target.value); setAutoError(''); setPreview(null); setAutoStatus('idle'); }}
            placeholder="https://www.amazon.in/dp/... or Flipkart, Meesho, etc."
            className="w-full sm:flex-1 px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none font-bold text-gray-900 transition-all text-xs sm:text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleAutopost}
            disabled={isLoading || !autoUrl.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-7 py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-purple-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs sm:text-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
            {isLoading ? 'Working...' : 'AI Magic'}
          </button>
        </div>
        {autoError && (
          <div className="flex items-start gap-2.5 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs sm:text-sm font-bold">
            <AlertCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
            <span>{autoError}</span>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {isLoading && (
        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-purple-50 border border-purple-100 rounded-2xl">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-purple-600 animate-spin" />
          </div>
          <div>
            <p className="font-black text-purple-900 text-xs sm:text-sm">{statusMessages[autoStatus]}</p>
            <p className="text-purple-500 text-[10px] sm:text-xs font-medium mt-0.5">This takes 3–8 seconds. Please wait...</p>
          </div>
        </div>
      )}

      {/* Done state */}
      {autoStatus === 'done' && (
        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-black text-green-900 text-xs sm:text-sm">🎉 Deal is now LIVE on OfferBazar!</p>
            <p className="text-green-600 text-[10px] sm:text-xs font-medium mt-0.5">Visitors can see it right now. Refreshing...</p>
          </div>
        </div>
      )}

      {/* Preview Card */}
      {preview && autoStatus === 'idle' && (
        <div className="border-2 border-dashed border-orange-200 bg-orange-50/30 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-black text-gray-900 uppercase tracking-tight text-xs sm:text-sm">Preview — Review Before Posting</h3>
          </div>

          {/* Preview content */}
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 shadow-sm border border-orange-100">
            {preview.imageUrl && (
              <div className="w-full sm:w-32 h-32 sm:h-36 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100 p-3">
                <img src={preview.imageUrl} alt="" className="max-h-full object-contain mix-blend-multiply" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-orange-100 text-orange-700 text-[8px] sm:text-[9px] font-black rounded-full uppercase tracking-widest">{preview.category}</span>
                <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[9px] font-black rounded-full uppercase tracking-widest ${preview.dealType === 'loot' ? 'bg-red-100 text-red-700' : preview.dealType === 'coupon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {preview.dealType?.replace('_', ' ')}
                </span>
              </div>
              <input
                type="text"
                value={preview.title}
                onChange={e => setPreview({...preview, title: e.target.value})}
                className="w-full font-black text-gray-900 text-xs sm:text-sm bg-transparent border-b border-gray-100 focus:border-orange-400 outline-none pb-1 mb-2.5 sm:mb-3 tracking-tight"
              />
              <textarea
                value={preview.description}
                onChange={e => setPreview({...preview, description: e.target.value})}
                rows={3}
                className="w-full text-gray-500 text-[11px] sm:text-xs bg-transparent border border-gray-100 focus:border-orange-300 outline-none rounded-xl p-2 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2">Deal Price (Auto-detected)</label>
              <input
                type="number"
                value={preview.price}
                onChange={e => setPreview({...preview, price: parseFloat(e.target.value) || 0})}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-gray-900 text-base sm:text-lg"
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 sm:mb-2">Original MRP (Enter manually)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={e => setAutoOriginalPrice(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none font-bold text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Publish button */}
          <button
            onClick={handlePublish}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-sm sm:text-lg transition-all shadow-2xl shadow-green-500/30 active:scale-98"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            Publish Deal to OfferBazar Now!
          </button>
          <p className="text-center text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">You can edit the title and description above before publishing</p>
        </div>
      )}
    </div>
  );
}
// ============== END AUTOPOST SECTION ==============

export default function AdminPanel({ editingProduct, onCancel, onSuccess }: { editingProduct?: Product | null; onCancel?: () => void; onSuccess?: () => void }) {
  const [activeTab, setActiveTab] = useState<'manual' | 'autopost'>('manual');
  
  // Auto-cleanup old products (older than 2 months)
  useEffect(() => {
    const cleanupOldProducts = async () => {
      console.log("[Admin] Checking for expired products...");
      const now = new Date();
      const q = query(collection(db, 'products'), where('expireAt', '<=', now));
      
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          console.log(`[Admin] Found ${querySnapshot.size} expired products. Deleting...`);
          const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          console.log("[Admin] Cleanup complete.");
        }
      } catch (err) {
        console.error("[Admin] Cleanup error:", err);
      }
    };

    cleanupOldProducts();
  }, []);
  const [url, setUrl] = useState(editingProduct?.originalLink || '');
  const [title, setTitle] = useState(editingProduct?.title || '');
  const [category, setCategory] = useState(editingProduct?.category || 'Mobile Phones');
  const [price, setPrice] = useState(editingProduct?.price.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(editingProduct?.originalPrice?.toString() || '');
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dealType, setDealType] = useState<'loot' | 'coupon' | 'best_offer'>(editingProduct?.dealType || 'loot');
  const [isFlashDeal, setIsFlashDeal] = useState(editingProduct?.isFlashDeal || false);
  const [badgeTag, setBadgeTag] = useState(editingProduct?.badgeTag || '');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Use effect to update state if editingProduct changes
  React.useEffect(() => {
    if (editingProduct) {
      setUrl(editingProduct.originalLink);
      setTitle(editingProduct.title);
      setCategory(editingProduct.category);
      setPrice(editingProduct.price.toString());
      setOriginalPrice(editingProduct.originalPrice?.toString() || '');
      setDescription(editingProduct.description);
      setDealType(editingProduct.dealType);
      setIsFlashDeal(editingProduct.isFlashDeal || false);
      setBadgeTag(editingProduct.badgeTag || '');
    }
  }, [editingProduct]);

  const handleMigrate = async () => {
    if (!window.confirm("This will update all old products with default values. Continue?")) return;
    setMigrating(true);
    try {
      const count = await migrateLegacyProducts();
      alert(`Successfully updated ${count} legacy products!`);
    } catch (err: any) {
      console.error("Migration failed:", err);
      alert("Migration failed: " + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const categories = [ /* ... categories list ... */
    "Mobile Phones", 
    "Laptops & PCs", 
    "Electronics", 
    "Groceries", 
    "Fashion", 
    "Home Decor", 
    "Personal Care", 
    "Appliances", 
    "Accessories", 
    "Miscellaneous"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url && !imageFile && !editingProduct?.imageUrl) {
      setError("Please provide at least a product link or upload an image.");
      return;
    }

    if (!description) {
      setError("Product description is required.");
      return;
    }

    setLoading(true);
    setLoadingStatus(editingProduct ? 'Updating product...' : 'Initializing process...');
    setError('');
    setSuccess(false);

    try {
      let finalImageUrl = editingProduct?.imageUrl || "";
      let scrapedTitle = editingProduct?.title || "Unknown Product";
      let scrapedPrice = 0;
      let originalLink = url;

      // 1. Scrape if URL is provided and it's changed (or if it's a new product)
      if (url && url !== editingProduct?.originalLink) {
        setLoadingStatus('Step 1/3: Scraping product details...');
        try {
          const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });

          if (response.ok) {
            const data = await response.json();
            scrapedTitle = data.title || scrapedTitle;
            scrapedPrice = data.price || 0;
            finalImageUrl = data.imageUrl || finalImageUrl;
            originalLink = data.originalLink || url;
            
            if (!price) setPrice(scrapedPrice.toString());
            // Only update current title if it's empty to avoid overwriting manual edits
            if (!title) setTitle(data.title || "");
          }
        } catch (fetchErr: any) {
          console.error("[Admin] Scrape error:", fetchErr);
        }
      }

      // 2. Upload Image if local file selected
      if (imageFile && imageFile instanceof File) {
        setLoadingStatus('Step 2/3: Compressing image locally...');
        
        try {
          const compressedBase64 = await new Promise<string>((resolve, reject) => {
             const reader = new FileReader();
             reader.readAsDataURL(imageFile);
             reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                   const canvas = document.createElement('canvas');
                   const MAX_WIDTH = 600;
                   const scaleSize = MAX_WIDTH / img.width;
                   canvas.width = MAX_WIDTH;
                   canvas.height = img.height * scaleSize;
                   const ctx = canvas.getContext('2d');
                   if (ctx) {
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      resolve(canvas.toDataURL('image/jpeg', 0.7));
                   } else {
                      resolve(img.src);
                   }
                };
                img.onerror = () => reject(new Error("Failed to load image for compression"));
             };
             reader.onerror = error => reject(error);
          });

          finalImageUrl = compressedBase64;
        } catch (uploadErr: any) {
          console.warn("[Admin] Compression failed:", uploadErr.message);
        }
      }

      if (!finalImageUrl) {
        throw new Error("Missing image URL. Please upload an image or check the product link.");
      }

      // 3. Save to Database
      setLoadingStatus('Step 3/3: Saving to database...');
      
      const finalPrice = parseFloat(price) || scrapedPrice || 0;
      const parsedOriginalPrice = parseFloat(originalPrice);
      const finalOriginalPrice = isNaN(parsedOriginalPrice) ? (finalPrice ? finalPrice * 1.2 : 0) : parsedOriginalPrice;

      // Calculate expiry (2 months from now)
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 2);

      const productData = {
        title: title || scrapedTitle,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        imageUrl: finalImageUrl,
        originalLink: originalLink || "#",
        category: category,
        description: description,
        dealType: dealType,
        isFlashDeal: isFlashDeal || dealType === 'loot',
        badgeTag: badgeTag || (dealType === 'loot' ? "LOOT" : dealType === 'coupon' ? "COUPON" : ""),
        updatedAt: serverTimestamp(),
        expireAt: Timestamp.fromDate(expiryDate)
      };

      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        const newProduct = {
          ...productData,
          addedBy: auth.currentUser?.email || "admin_user",
          createdAt: serverTimestamp(),
        };
        const docId = generateId();
        await setDoc(doc(db, 'products', docId), newProduct);
      }

      setSuccess(true);
      if (!editingProduct) {
        setUrl('');
        setTitle('');
        setPrice('');
        setOriginalPrice('');
        setDescription('');
        setImageFile(null);
        setBadgeTag('');
        setIsFlashDeal(false);
        setDealType('loot');
      }
      
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 5000);

    } catch (err: any) {
      console.error("[Admin] Process Failed:", err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 max-w-2xl mx-auto mb-12">
      
      {/* Tab Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8 p-1.5 sm:p-2 bg-gray-50 rounded-2xl border border-gray-100">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'manual' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Manual Post
        </button>
        <button
          onClick={() => setActiveTab('autopost')}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'autopost' ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> AI Autopost ✨
        </button>
      </div>

      {/* Autopost Tab */}
      {activeTab === 'autopost' && <AutopostPanel />}

      {/* Manual Tab */}
      {activeTab === 'manual' && <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          {editingProduct ? <Save className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-orange-500" /> : <Plus className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-orange-500" />}
          {editingProduct ? 'Edit Deal' : 'Add New Deal'}
        </h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {editingProduct && onCancel && (
            <button 
              onClick={onCancel}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-gray-100"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          )}
          <button 
            onClick={handleMigrate}
            disabled={migrating}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-gray-100 hover:border-orange-100"
            title="Fix old products that aren't showing up"
          >
            {migrating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            {migrating ? 'Repairing...' : 'Repair Database'}
          </button>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
        {editingProduct ? `Editing: ${editingProduct.title}` : 'Add products via link or upload manually. All deals are live instantly.'}
      </p>

      {error && <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 text-red-700 rounded-2xl text-xs sm:text-sm border border-red-100">{error}</div>}
      {success && <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-orange-50 text-orange-700 rounded-2xl text-xs sm:text-sm border border-orange-100 font-bold">{editingProduct ? 'Deal updated successfully!' : 'Deal added successfully!'}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <FileText className="w-3 h-3" /> Deal Title (Product Name)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-gray-900"
            placeholder="Enter catchy product title..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Scrape from URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="Paste product link..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Manual Image Upload</span>
              {imageFile && (
                <button 
                  type="button" 
                  onClick={() => setImageFile(null)}
                  className="text-orange-500 hover:text-orange-600 font-bold"
                >
                  Clear Selection
                </button>
              )}
            </label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
              />
              {imageFile && <div className="mt-2 text-[10px] font-bold text-gray-400 truncate">Selected: {imageFile.name}</div>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <FileText className="w-3 h-3" /> Product Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            placeholder="Tell users why this is a great deal..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Deal Segment</label>
            <select
              value={dealType}
              onChange={(e) => setDealType(e.target.value as any)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none font-bold text-gray-900"
            >
              <option value="loot">Loot Zone</option>
              <option value="coupon">Coupon Deals</option>
              <option value="best_offer">Best Offers</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Deal Price (Offer Price)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="e.g. 99"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Original Price (MRP)</label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
             <input 
               type="checkbox" 
               id="flash" 
               checked={isFlashDeal} 
               onChange={(e) => setIsFlashDeal(e.target.checked)}
               className="w-5 h-5 rounded accent-orange-500"
             />
             <label htmlFor="flash" className="text-sm font-bold text-orange-700">Urgent Flash Sale?</label>
           </div>
           
           <div className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
             <div className="flex-1">
               <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 pl-1">Custom Badge (Optional)</label>
               <input
                 type="text"
                 value={badgeTag}
                 onChange={(e) => setBadgeTag(e.target.value)}
                 className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                 placeholder="e.g. 1 Rs Deal, Limited Time"
               />
             </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{loadingStatus}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {editingProduct ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              <span>{editingProduct ? 'Update Deal on OfferBazar' : 'Add Deal to OfferBazar'}</span>
            </div>
          )}
        </button>
      </form>
      </>}
    </div>
  );
}
