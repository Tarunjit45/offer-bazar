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
    addedBy: string;
    createdAt: any;
    updatedAt: any;
}
