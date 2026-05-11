import React, { useState } from 'react';
import { db, storage } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Plus, Loader2, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { generateId } from '../lib/utils';

export default function AdminPanel() {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Mobile Phones');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isFlashDeal, setIsFlashDeal] = useState(false);
  const [badgeTag, setBadgeTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let finalImageUrl = "";
      let title = "Unknown Product";
      let price = 0;
      let originalLink = url;

      // 1. Scrape if URL is provided
      if (url) {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        if (response.ok) {
          const data = await response.json();
          title = data.title || title;
          price = data.price || price;
          finalImageUrl = data.imageUrl || finalImageUrl;
          originalLink = data.originalLink || url;
        }
      }

      // 2. Upload Image if local file selected
      if (imageFile) {
        const storageRef = ref(storage, `products/${generateId()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      if (!finalImageUrl) throw new Error("Please provide a URL or upload an image.");

      const newProduct = {
        title: title,
        price: price || 0,
        originalPrice: parseFloat(originalPrice) || (price ? price * 1.2 : 0),
        imageUrl: finalImageUrl,
        originalLink: originalLink || "#",
        category: category,
        description: description,
        isFlashDeal: isFlashDeal,
        badgeTag: badgeTag || (isFlashDeal ? "LOOT" : ""),
        addedBy: "admin_user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docId = generateId();
      await setDoc(doc(db, 'products', docId), newProduct);

      setSuccess(true);
      setUrl('');
      setOriginalPrice('');
      setDescription('');
      setImageFile(null);
      setBadgeTag('');
      setIsFlashDeal(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 max-w-2xl mx-auto mb-12">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 flex items-center gap-2">
        <Plus className="w-6 h-6 text-orange-500" />
        Add New Deal
      </h2>
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Manual Image Upload
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
            />
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
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Original Price</label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
           <div className="flex items-center gap-2">
             <input 
               type="checkbox" 
               id="flash" 
               checked={isFlashDeal} 
               onChange={(e) => setIsFlashDeal(e.target.checked)}
               className="w-5 h-5 rounded accent-orange-500"
             />
             <label htmlFor="flash" className="text-sm font-bold text-orange-700">Flash/Loot Deal</label>
           </div>
           <div className="flex-1">
             <input
               type="text"
               value={badgeTag}
               onChange={(e) => setBadgeTag(e.target.value)}
               className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
               placeholder="Custom Tag (e.g. 1 Rs Deal)"
             />
           </div>
        </div>

        <button
          type="submit"
          disabled={loading || (!url && !imageFile)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Add Deal to OfferBazar
        </button>
      </form>
    </div>
  );
}
