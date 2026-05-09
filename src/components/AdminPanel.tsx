import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { Loader2, Plus, AlertCircle, ExternalLink } from 'lucide-react';

// Generates a random alphanumeric ID for Firestore
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function AdminPanel() {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const categories = ["Electronics", "Fashion", "Home & Garden", "Sports", "Toys", "Miscellaneous"];

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !category) {
       setError("URL and category are required");
       return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Scrape URL
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to scrape URL. Please check if the link is correct or access is blocked.');
      }

      const data = await response.json();

      // 2. Add to Firestore
      if (!auth.currentUser) throw new Error("Must be logged in.");

      const newProduct = {
        title: data.title || "Unknown",
        price: data.price || 0,
        imageUrl: data.imageUrl || "https://placehold.co/400x400/png?text=No+Image",
        originalLink: data.originalLink || url,
        category: category,
        addedBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docId = generateId();

      try {
        await setDoc(doc(db, 'products', docId), newProduct);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `products/${docId}`);
      }

      setSuccess(true);
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding the product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto mb-12">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
        <Plus className="w-5 h-5 text-orange-500" />
        Curate a New Product
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Paste a product link from any external site. We'll automatically scrape its details and add it to our ultra-low price catalog!
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-orange-50 text-orange-700 rounded-xl text-sm border border-orange-100 flex gap-3">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-orange-500" />
          <p>Product added successfully! It is now live in the catalog.</p>
        </div>
      )}

      <form onSubmit={handleAddProduct} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ExternalLink className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400"
              placeholder="https://amazon.com/..."
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all appearance-none bg-white"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20class%3D%22lucide%20lucide-chevron-down%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '16px 12px' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
             <><Loader2 className="w-5 h-5 animate-spin" /> Scraping & Saving...</>
          ) : (
            <><Plus className="w-5 h-5" /> Quick Add Product</>
          )}
        </button>
      </form>
    </div>
  );
}
