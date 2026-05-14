import React, { useState } from 'react';
import { db, storage, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { Plus, Loader2, Image as ImageIcon, Link as LinkIcon, FileText, Database } from 'lucide-react';
import { generateId } from '../lib/utils';
import { migrateLegacyProducts } from '../lib/migration';

export default function AdminPanel() {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Mobile Phones');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dealType, setDealType] = useState<'loot' | 'coupon' | 'best_offer'>('loot');
  const [isFlashDeal, setIsFlashDeal] = useState(false);
  const [badgeTag, setBadgeTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const categories = [
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url && !imageFile) {
      setError("Please provide at least a product link or upload an image.");
      return;
    }

    if (!description) {
      setError("Product description is required.");
      return;
    }

    setLoading(true);
    setLoadingStatus('Initializing process...');
    setError('');
    setSuccess(false);

    console.log("[Admin] Starting product add process...");

    try {
      let finalImageUrl = "";
      let title = "Unknown Product";
      let scrapedPrice = 0;
      let originalLink = url;

      // 1. Scrape if URL is provided
      if (url) {
        setLoadingStatus('Step 1/3: Scraping product details...');
        console.log("[Admin] Scraping URL:", url);
        try {
          const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });

          if (response.ok) {
            const data = await response.json();
            title = data.title || title;
            scrapedPrice = data.price || 0;
            finalImageUrl = data.imageUrl || finalImageUrl;
            originalLink = data.originalLink || url;
            
            console.log("[Admin] Scrape success:", title);
            if (!price) setPrice(scrapedPrice.toString());
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn("[Admin] Scrape failed:", errorData.error || response.statusText);
            setLoadingStatus('Scrape failed, using manual data if available...');
          }
        } catch (fetchErr: any) {
          console.error("[Admin] Scrape error:", fetchErr);
        }
      }

      // 2. Upload Image if local file selected
      if (imageFile && imageFile instanceof File) {
        setLoadingStatus('Step 2/3: Uploading image...');
        
        try {
          // Convert file to Base64 to send to our server
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });

          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64,
              fileName: `${Date.now()}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
              contentType: imageFile.type
            })
          });

          if (uploadResponse.status === 405) {
            // Static hosting - server API not available, use scraped image silently
            console.warn("[Admin] Upload API not available on this host. Using scraped image.");
          } else if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || "Server-side upload failed");
          } else {
            const uploadData = await uploadResponse.json();
            finalImageUrl = uploadData.imageUrl;
            console.log("[Admin] Server upload success:", finalImageUrl);
          }

        } catch (uploadErr: any) {
          console.warn("[Admin] Upload failed, using scraped image if available:", uploadErr.message);
          // Non-fatal: continue with scraped image if available
        }
      }

      if (!finalImageUrl) {
        throw new Error("Missing image URL. Please upload an image or check the product link.");
      }

      // 3. Save to Database
      setLoadingStatus('Step 3/3: Saving deal to database...');
      console.log("[Admin] Saving to Firestore...");
      
      const finalPrice = parseFloat(price) || scrapedPrice || 0;
      const parsedOriginalPrice = parseFloat(originalPrice);
      const finalOriginalPrice = isNaN(parsedOriginalPrice) ? (finalPrice ? finalPrice * 1.2 : 0) : parsedOriginalPrice;

      const newProduct = {
        title: title,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        imageUrl: finalImageUrl,
        originalLink: originalLink || "#",
        category: category,
        description: description,
        dealType: dealType,
        isFlashDeal: isFlashDeal || dealType === 'loot',
        badgeTag: badgeTag || (dealType === 'loot' ? "LOOT" : dealType === 'coupon' ? "COUPON" : ""),
        addedBy: auth.currentUser?.email || "admin_user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docId = generateId();
      await setDoc(doc(db, 'products', docId), newProduct);
      console.log("[Admin] Firestore save success:", docId);

      setSuccess(true);
      setLoadingStatus('');
      setUrl('');
      setPrice('');
      setOriginalPrice('');
      setDescription('');
      setImageFile(null);
      setBadgeTag('');
      setIsFlashDeal(false);
      setDealType('loot');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err: any) {
      console.error("[Admin] Process Failed:", err);
      setError(err.message || 'An error occurred while posting the deal.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 max-w-2xl mx-auto mb-12">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Plus className="w-6 h-6 text-orange-500" />
          Add New Deal
        </h2>
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
      <p className="text-sm text-gray-500 mb-8">
        Add products via link or upload manually. All deals are live instantly.
      </p>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">{error}</div>}
      {success && <div className="mb-6 p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm border border-orange-100 font-bold">Deal added successfully!</div>}

      <form onSubmit={handleAddProduct} className="space-y-6">
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
              <Plus className="w-5 h-5" />
              <span>Add Deal to OfferBazar</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
}
