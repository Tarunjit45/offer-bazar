import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { Plus, Loader2, Image as ImageIcon, Link as LinkIcon, FileText, Database, Save, X, Trash } from 'lucide-react';
import { generateId } from '../lib/utils';
import { migrateLegacyProducts } from '../lib/migration';
import type { Product } from '../types';

export default function AdminPanel({ editingProduct, onCancel, onSuccess }: { editingProduct?: Product | null; onCancel?: () => void; onSuccess?: () => void }) {
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
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 max-w-2xl mx-auto mb-12">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          {editingProduct ? <Save className="w-6 h-6 text-orange-500" /> : <Plus className="w-6 h-6 text-orange-500" />}
          {editingProduct ? 'Edit Deal' : 'Add New Deal'}
        </h2>
        <div className="flex gap-2">
          {editingProduct && onCancel && (
            <button 
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all border border-gray-100"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          )}
          <button 
            onClick={handleMigrate}
            disabled={migrating}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-600 rounded-xl text-xs font-bold transition-all border border-gray-100 hover:border-orange-100"
            title="Fix old products that aren't showing up"
          >
            {migrating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
            {migrating ? 'Repairing...' : 'Repair Database'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {editingProduct ? `Editing: ${editingProduct.title}` : 'Add products via link or upload manually. All deals are live instantly.'}
      </p>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">{error}</div>}
      {success && <div className="mb-6 p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm border border-orange-100 font-bold">{editingProduct ? 'Deal updated successfully!' : 'Deal added successfully!'}</div>}

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
    </div>
  );
}
