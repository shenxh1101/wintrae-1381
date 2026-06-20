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
