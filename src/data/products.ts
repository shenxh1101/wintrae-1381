import { Product, PickupTimeSlot } from '../types/product';
import { generateId } from '../utils';

export const defaultPickupSlots: PickupTimeSlot[] = [
  { id: 'slot_morning', label: '上午场 9:00-11:00', startTime: '09:00', endTime: '11:00' },
  { id: 'slot_afternoon', label: '下午场 14:00-16:00', startTime: '14:00', endTime: '16:00' },
  { id: 'slot_evening', label: '傍晚场 16:00-18:00', startTime: '16:00', endTime: '18:00' }
];

export const findSlotByLabel = (label: string): PickupTimeSlot | undefined => {
  return defaultPickupSlots.find(s => s.label === label);
};

export const normalizePickupSlots = (slots: PickupTimeSlot[]): PickupTimeSlot[] => {
  return slots.map(slot => {
    const match = findSlotByLabel(slot.label);
    return match || slot;
  });
};

export const mockProducts: Product[] = [
  {
    id: generateId(),
    name: '有机西红柿',
    category: 'vegetable',
    image: 'https://picsum.photos/id/292/300/300',
    description: '本地农场直供，自然成熟，酸甜多汁，适合生食或烹饪。无农药残留，孕妇儿童放心食用。',
    specs: [
      { id: generateId(), name: '约500g/份', price: 12.8, stock: 45, originalStock: 50 },
      { id: generateId(), name: '约1kg/份', price: 22.8, stock: 28, originalStock: 30 }
    ],
    pickupSlots: defaultPickupSlots,
    isOnSale: true,
    isLimited: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    salesCount: 87
  },
  {
    id: generateId(),
    name: '新鲜小青菜',
    category: 'vegetable',
    image: 'https://picsum.photos/id/312/300/300',
    description: '清晨采摘，叶片翠绿鲜嫩，口感清爽。富含维生素和膳食纤维。',
    specs: [
      { id: generateId(), name: '约300g/把', price: 6.5, stock: 8, originalStock: 40 },
      { id: generateId(), name: '约500g/把', price: 9.8, stock: 15, originalStock: 30 }
    ],
    pickupSlots: defaultPickupSlots,
    isOnSale: true,
    isLimited: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    salesCount: 156
  },
  {
    id: generateId(),
    name: '水蜜桃',
    category: 'fruit',
    image: 'https://picsum.photos/id/326/300/300',
    description: '阳山品种，皮薄肉厚，汁水丰盈，香甜可口。自然熟，不催熟。',
    specs: [
      { id: generateId(), name: '精选4个装', price: 38.0, stock: 22, originalStock: 25 },
      { id: generateId(), name: '礼盒8个装', price: 68.0, stock: 0, originalStock: 15 }
    ],
    pickupSlots: [defaultPickupSlots[0], defaultPickupSlots[1]],
    isOnSale: true,
    isLimited: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    salesCount: 63
  },
  {
    id: generateId(),
    name: '手工酒酿',
    category: 'handmade',
    image: 'https://picsum.photos/id/431/300/300',
    description: '传统工艺，自然发酵，口感醇厚，甜而不腻。冷藏可保存一周。',
    specs: [
      { id: generateId(), name: '500g/瓶', price: 25.0, stock: 35, originalStock: 40 },
      { id: generateId(), name: '1kg/瓶', price: 45.0, stock: 18, originalStock: 20 }
    ],
    pickupSlots: defaultPickupSlots,
    isOnSale: true,
    isLimited: false,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    salesCount: 92
  },
  {
    id: generateId(),
    name: '周末蔬果礼包',
    category: 'combo',
    image: 'https://picsum.photos/id/570/300/300',
    description: '当季精选组合：西红柿2斤+小青菜1把+黄瓜3根+水蜜桃4个，总价值约98元，礼包价更优惠！',
    specs: [
      { id: generateId(), name: '标准套餐', price: 78.0, stock: 5, originalStock: 20 }
    ],
    pickupSlots: defaultPickupSlots,
    isOnSale: true,
    isLimited: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    salesCount: 34
  },
  {
    id: generateId(),
    name: '古法红糖馒头',
    category: 'handmade',
    image: 'https://picsum.photos/id/625/300/300',
    description: '老面发酵，红糖揉制，口感松软有嚼劲。纯手工制作，每日限量。',
    specs: [
      { id: generateId(), name: '6个装', price: 18.0, stock: 0, originalStock: 50 },
      { id: generateId(), name: '12个装', price: 32.0, stock: 3, originalStock: 25 }
    ],
    pickupSlots: [defaultPickupSlots[0]],
    isOnSale: true,
    isLimited: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    salesCount: 208
  },
  {
    id: generateId(),
    name: '有机黄瓜',
    category: 'vegetable',
    image: 'https://picsum.photos/id/1080/300/300',
    description: '带刺黄瓜，清脆爽口，可生吃可凉拌。当天采摘，保证新鲜。',
    specs: [
      { id: generateId(), name: '约500g/份', price: 8.0, stock: 60, originalStock: 60 }
    ],
    pickupSlots: defaultPickupSlots,
    isOnSale: true,
    isLimited: false,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    salesCount: 45
  },
  {
    id: generateId(),
    name: '蓝莓',
    category: 'fruit',
    image: 'https://picsum.photos/id/580/300/300',
    description: '云南高山蓝莓，颗颗饱满，酸甜适中，富含花青素。',
    specs: [
      { id: generateId(), name: '125g/盒', price: 28.0, stock: 40, originalStock: 50 },
      { id: generateId(), name: '四盒装', price: 98.0, stock: 12, originalStock: 15 }
    ],
    pickupSlots: defaultPickupSlots,
    isOnSale: false,
    isLimited: false,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    salesCount: 0
  }
];
