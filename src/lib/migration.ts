import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Migration script to update legacy products with missing required fields.
 * This ensures old products work perfectly with the new UI and security rules.
 */
export async function migrateLegacyProducts() {
  console.log("Starting migration of legacy products...");
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  let updatedCount = 0;
  
  const updates = snapshot.docs.map(async (productDoc) => {
    const data = productDoc.data();
    const needsUpdate = !data.dealType || !data.description || data.isFlashDeal === undefined;
    
    if (needsUpdate) {
      console.log(`Updating product: ${data.title || productDoc.id}`);
      const docRef = doc(db, 'products', productDoc.id);
      
      // We must provide ALL required fields to satisfy the strict isValidProduct rule
      await updateDoc(docRef, {
        title: data.title || "Unknown Product",
        price: data.price || 0,
        imageUrl: data.imageUrl || "https://placehold.co/400x400/png?text=No+Image",
        originalLink: data.originalLink || "#",
        category: data.category || "Miscellaneous",
        addedBy: data.addedBy || "admin_user",
        createdAt: data.createdAt || serverTimestamp(),
        dealType: data.dealType || 'best_offer',
        isFlashDeal: data.isFlashDeal || false,
        badgeTag: data.badgeTag || "",
        description: data.description || "A great deal discovered on OfferBazar.",
        originalPrice: data.originalPrice || (data.price ? data.price * 1.2 : 0),
        updatedAt: serverTimestamp()
      });
      updatedCount++;
    }
  });

  await Promise.all(updates);
  console.log(`Migration complete. Updated ${updatedCount} products.`);
  return updatedCount;
}
