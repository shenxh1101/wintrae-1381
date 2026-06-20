export type ProductCategory = 'vegetable' | 'fruit' | 'handmade' | 'combo';

export interface ProductSpec {
  id: string;
  name: string;
  price: number;
  stock: number;
  originalStock: number;
}

export interface PickupTimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  image: string;
  description: string;
  specs: ProductSpec[];
  pickupSlots: PickupTimeSlot[];
  isOnSale: boolean;
  isLimited: boolean;
  createdAt: string;
  updatedAt: string;
  salesCount: number;
}

export const categoryLabels: Record<ProductCategory, string> = {
  vegetable: '新鲜蔬果',
  fruit: '时令水果',
  handmade: '手作食品',
  combo: '限量组合'
};

export const categoryColorMap: Record<ProductCategory, string> = {
  vegetable: '#4CAF50',
  fruit: '#FF9800',
  handmade: '#9C27B0',
  combo: '#F44336'
};
