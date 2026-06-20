export interface DailyStats {
  date: string;
  totalOrders: number;
  pickedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  refundAmount: number;
}

export interface HotProduct {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  soldCount: number;
  revenue: number;
  rank: number;
}

export interface PendingOrderStat {
  total: number;
  today: number;
  overdue: number;
  bySlot: {
    slotId: string;
    slotLabel: string;
    count: number;
  }[];
}

export interface RevenueStat {
  today: number;
  week: number;
  month: number;
  compareYesterday: number;
  compareLastWeek: number;
}
