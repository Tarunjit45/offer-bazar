export interface Product {
    id?: string;
    title: string;
    price: number;
    originalPrice?: number;
    imageUrl: string;
    originalLink: string;
    category: string;
    description: string;
    isFlashDeal?: boolean;
    badgeTag?: string;
    dealType: 'loot' | 'coupon' | 'best_offer';
    addedBy: string;
    createdAt: any;
    updatedAt: any;
    expireAt: any;
}
