export type NotificationType = 'open' | 'outOfStock' | 'close' | 'custom';

export type NotificationTarget = 'all' | 'pending' | 'picked' | 'specific';

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  target: NotificationTarget;
}

export interface ItemSnapshot {
  productName: string;
  specName: string;
  price: number;
  quantity: number;
  status: 'normal' | 'exchanged' | 'refunded';
  exchangedItem?: string;
}

export interface CustomerSnapshot {
  customerId: string;
  customerName: string;
  customerPhone: string;
  bookingId: string;
  pickupCode: string;
  orderNo: string;
  items: ItemSnapshot[];
}

export interface SelectedCustomer {
  customerId: string;
  customerName: string;
  customerPhone: string;
  bookingId: string;
  pickupCode: string;
}

export interface NotificationRecord {
  id: string;
  templateId?: string;
  type: NotificationType;
  title: string;
  content: string;
  target: NotificationTarget;
  targetCount: number;
  targetCustomers?: CustomerSnapshot[];
  sentAt: string;
  status: 'success' | 'failed' | 'sending';
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  open: '开摊提醒',
  outOfStock: '缺货说明',
  close: '收摊通知',
  custom: '自定义消息'
};

export const notificationTargetLabels: Record<NotificationTarget, string> = {
  all: '全部顾客',
  pending: '待取货顾客',
  picked: '已取货顾客',
  specific: '指定顾客'
};
