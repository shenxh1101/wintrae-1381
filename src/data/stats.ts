import { HotProduct, PendingOrderStat, RevenueStat, DailyStats } from '../types/stats';
import { generateId } from '../utils';

export const mockRevenue: RevenueStat = {
  today: 2856.5,
  week: 15680.0,
  month: 52340.0,
  compareYesterday: 12.5,
  compareLastWeek: 8.3
};

export const mockPendingStats: PendingOrderStat = {
  total: 23,
  today: 18,
  overdue: 2,
  bySlot: [
    { slotId: generateId(), slotLabel: '上午场 9:00-11:00', count: 8 },
    { slotId: generateId(), slotLabel: '下午场 14:00-16:00', count: 6 },
    { slotId: generateId(), slotLabel: '傍晚场 16:00-18:00', count: 4 }
  ]
};

export const mockHotProducts: HotProduct[] = [
  {
    productId: generateId(),
    productName: '古法红糖馒头',
    productImage: 'https://picsum.photos/id/625/300/300',
    category: '手作食品',
    soldCount: 208,
    revenue: 3680.0,
    rank: 1
  },
  {
    productId: generateId(),
    productName: '新鲜小青菜',
    productImage: 'https://picsum.photos/id/312/300/300',
    category: '新鲜蔬果',
    soldCount: 156,
    revenue: 1248.0,
    rank: 2
  },
  {
    productId: generateId(),
    productName: '手工酒酿',
    productImage: 'https://picsum.photos/id/431/300/300',
    category: '手作食品',
    soldCount: 92,
    revenue: 2760.0,
    rank: 3
  },
  {
    productId: generateId(),
    productName: '有机西红柿',
    productImage: 'https://picsum.photos/id/292/300/300',
    category: '新鲜蔬果',
    soldCount: 87,
    revenue: 1580.0,
    rank: 4
  },
  {
    productId: generateId(),
    productName: '水蜜桃',
    productImage: 'https://picsum.photos/id/326/300/300',
    category: '时令水果',
    soldCount: 63,
    revenue: 2394.0,
    rank: 5
  }
];

const now = new Date();
export const mockDailyStats: DailyStats[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(now.getTime() - 86400000 * (6 - i));
  return {
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    totalOrders: Math.floor(20 + Math.random() * 30),
    pickedOrders: Math.floor(15 + Math.random() * 25),
    pendingOrders: Math.floor(3 + Math.random() * 8),
    totalRevenue: Math.floor(1500 + Math.random() * 2000),
    refundAmount: Math.floor(Math.random() * 200)
  };
});
