export type BookingStatus = 'pending' | 'picked' | 'partial' | 'refund' | 'cancelled';

export interface BookingItem {
  productId: string;
  productName: string;
  productImage: string;
  specId: string;
  specName: string;
  price: number;
  quantity: number;
  status: 'normal' | 'exchanged' | 'refunded';
  exchangedItem?: string;
}

export interface Booking {
  id: string;
  orderNo: string;
  pickupCode: string;
  customerName: string;
  customerPhone: string;
  items: BookingItem[];
  totalAmount: number;
  refundedAmount?: number;
  actualAmount?: number;
  status: BookingStatus;
  pickupSlotId: string;
  pickupSlotLabel: string;
  createdAt: string;
  pickedAt?: string;
  remark?: string;
  operationLogs: OperationLog[];
}

export interface OperationLog {
  id: string;
  action: string;
  operator: string;
  timestamp: string;
  detail?: string;
}

export const statusLabels: Record<BookingStatus, string> = {
  pending: '待取货',
  picked: '已取货',
  partial: '部分取货',
  refund: '退款中',
  cancelled: '已取消'
};

export const statusColorMap: Record<BookingStatus, string> = {
  pending: '#FF9800',
  picked: '#4CAF50',
  partial: '#2196F3',
  refund: '#F44336',
  cancelled: '#9E9E9E'
};

export const calcRefundedAmount = (items: BookingItem[]): number => {
  return items
    .filter(i => i.status === 'refunded')
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
};

export const calcActualAmount = (items: BookingItem[], totalAmount: number): number => {
  return totalAmount - calcRefundedAmount(items);
};

export const deriveBookingStatus = (
  items: BookingItem[],
  currentStatus: BookingStatus
): BookingStatus => {
  if (currentStatus === 'cancelled') return 'cancelled';
  if (currentStatus === 'picked') return 'picked';

  const totalCount = items.length;
  const refundedCount = items.filter(i => i.status === 'refunded').length;
  const normalCount = items.filter(i => i.status === 'normal').length;
  const exchangedCount = items.filter(i => i.status === 'exchanged').length;

  if (refundedCount === totalCount && totalCount > 0) {
    return 'refund';
  }
  if (normalCount === totalCount) {
    return 'pending';
  }
  if ((normalCount + exchangedCount) === totalCount && exchangedCount > 0) {
    return 'pending';
  }
  if (refundedCount > 0 && refundedCount < totalCount) {
    return 'partial';
  }
  if ((exchangedCount + normalCount + refundedCount) === totalCount && exchangedCount > 0 && refundedCount === 0) {
    return currentStatus === 'picked' ? 'picked' : 'pending';
  }
  return currentStatus;
};
