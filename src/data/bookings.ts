import { Booking } from '../types/booking';
import { generateId, generatePickupCode, generateOrderNo } from '../utils';

const now = Date.now();

export const mockBookings: Booking[] = [
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '2847',
    customerName: '张女士',
    customerPhone: '138****5678',
    items: [
      {
        productId: 'p1',
        productName: '有机西红柿',
        productImage: 'https://picsum.photos/id/292/300/300',
        specId: 's1',
        specName: '约1kg/份',
        price: 22.8,
        quantity: 2,
        status: 'normal'
      },
      {
        productId: 'p2',
        productName: '新鲜小青菜',
        productImage: 'https://picsum.photos/id/312/300/300',
        specId: 's2',
        specName: '约300g/把',
        price: 6.5,
        quantity: 3,
        status: 'normal'
      }
    ],
    totalAmount: 65.1,
    status: 'pending',
    pickupSlotId: 'slot1',
    pickupSlotLabel: '上午场 9:00-11:00',
    createdAt: new Date(now - 3600000 * 5).toISOString(),
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 3600000 * 5).toISOString(),
        detail: '在线支付完成'
      }
    ]
  },
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '5621',
    customerName: '李先生',
    customerPhone: '139****1234',
    items: [
      {
        productId: 'p3',
        productName: '水蜜桃',
        productImage: 'https://picsum.photos/id/326/300/300',
        specId: 's3',
        specName: '精选4个装',
        price: 38.0,
        quantity: 1,
        status: 'normal'
      }
    ],
    totalAmount: 38.0,
    status: 'pending',
    pickupSlotId: 'slot2',
    pickupSlotLabel: '下午场 14:00-16:00',
    createdAt: new Date(now - 3600000 * 8).toISOString(),
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 3600000 * 8).toISOString(),
        detail: '在线支付完成'
      }
    ]
  },
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '8394',
    customerName: '王阿姨',
    customerPhone: '137****9876',
    items: [
      {
        productId: 'p5',
        productName: '周末蔬果礼包',
        productImage: 'https://picsum.photos/id/570/300/300',
        specId: 's5',
        specName: '标准套餐',
        price: 78.0,
        quantity: 1,
        status: 'normal'
      },
      {
        productId: 'p4',
        productName: '手工酒酿',
        productImage: 'https://picsum.photos/id/431/300/300',
        specId: 's4',
        specName: '500g/瓶',
        price: 25.0,
        quantity: 1,
        status: 'normal'
      }
    ],
    totalAmount: 103.0,
    status: 'picked',
    pickupSlotId: 'slot1',
    pickupSlotLabel: '上午场 9:00-11:00',
    createdAt: new Date(now - 86400000).toISOString(),
    pickedAt: new Date(now - 3600000 * 3).toISOString(),
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 86400000).toISOString(),
        detail: '在线支付完成'
      },
      {
        id: generateId(),
        action: '确认取货',
        operator: '摊主',
        timestamp: new Date(now - 3600000 * 3).toISOString()
      }
    ]
  },
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '1056',
    customerName: '陈先生',
    customerPhone: '135****4321',
    items: [
      {
        productId: 'p6',
        productName: '古法红糖馒头',
        productImage: 'https://picsum.photos/id/625/300/300',
        specId: 's6',
        specName: '6个装',
        price: 18.0,
        quantity: 2,
        status: 'refunded'
      },
      {
        productId: 'p7',
        productName: '有机黄瓜',
        productImage: 'https://picsum.photos/id/1080/300/300',
        specId: 's7',
        specName: '约500g/份',
        price: 8.0,
        quantity: 2,
        status: 'normal'
      }
    ],
    totalAmount: 52.0,
    status: 'partial',
    pickupSlotId: 'slot1',
    pickupSlotLabel: '上午场 9:00-11:00',
    createdAt: new Date(now - 3600000 * 12).toISOString(),
    pickedAt: new Date(now - 3600000 * 2).toISOString(),
    remark: '红糖馒头缺货，已退款¥36',
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 3600000 * 12).toISOString(),
        detail: '在线支付完成'
      },
      {
        id: generateId(),
        action: '缺货处理',
        operator: '摊主',
        timestamp: new Date(now - 3600000 * 4).toISOString(),
        detail: '古法红糖馒头6个装缺货，办理退款'
      },
      {
        id: generateId(),
        action: '部分取货',
        operator: '摊主',
        timestamp: new Date(now - 3600000 * 2).toISOString()
      }
    ]
  },
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '4729',
    customerName: '刘小姐',
    customerPhone: '136****8765',
    items: [
      {
        productId: 'p3',
        productName: '水蜜桃',
        productImage: 'https://picsum.photos/id/326/300/300',
        specId: 's3',
        specName: '精选4个装',
        price: 38.0,
        quantity: 2,
        status: 'normal'
      }
    ],
    totalAmount: 76.0,
    status: 'pending',
    pickupSlotId: 'slot3',
    pickupSlotLabel: '傍晚场 16:00-18:00',
    createdAt: new Date(now - 3600000 * 20).toISOString(),
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 3600000 * 20).toISOString(),
        detail: '在线支付完成'
      }
    ]
  },
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '6183',
    customerName: '赵先生',
    customerPhone: '133****2468',
    items: [
      {
        productId: 'p1',
        productName: '有机西红柿',
        productImage: 'https://picsum.photos/id/292/300/300',
        specId: 's1',
        specName: '约500g/份',
        price: 12.8,
        quantity: 3,
        status: 'normal'
      },
      {
        productId: 'p7',
        productName: '有机黄瓜',
        productImage: 'https://picsum.photos/id/1080/300/300',
        specId: 's7',
        specName: '约500g/份',
        price: 8.0,
        quantity: 2,
        status: 'normal'
      },
      {
        productId: 'p2',
        productName: '新鲜小青菜',
        productImage: 'https://picsum.photos/id/312/300/300',
        specId: 's2',
        specName: '约500g/把',
        price: 9.8,
        quantity: 1,
        status: 'exchanged',
        exchangedItem: '已替换为约300g/把'
      }
    ],
    totalAmount: 64.2,
    status: 'picked',
    pickupSlotId: 'slot2',
    pickupSlotLabel: '下午场 14:00-16:00',
    createdAt: new Date(now - 86400000 * 2).toISOString(),
    pickedAt: new Date(now - 86400000).toISOString(),
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 86400000 * 2).toISOString(),
        detail: '在线支付完成'
      },
      {
        id: generateId(),
        action: '缺货替换',
        operator: '摊主',
        timestamp: new Date(now - 86400000 + 3600000).toISOString(),
        detail: '小青菜500g缺货，已替换为300g'
      },
      {
        id: generateId(),
        action: '确认取货',
        operator: '摊主',
        timestamp: new Date(now - 86400000).toISOString()
      }
    ]
  },
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '9502',
    customerName: '孙女士',
    customerPhone: '131****1357',
    items: [
      {
        productId: 'p4',
        productName: '手工酒酿',
        productImage: 'https://picsum.photos/id/431/300/300',
        specId: 's4',
        specName: '1kg/瓶',
        price: 45.0,
        quantity: 1,
        status: 'normal'
      }
    ],
    totalAmount: 45.0,
    status: 'refund',
    pickupSlotId: 'slot2',
    pickupSlotLabel: '下午场 14:00-16:00',
    createdAt: new Date(now - 86400000 * 3).toISOString(),
    remark: '顾客临时有事无法取货，申请全额退款',
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 86400000 * 3).toISOString(),
        detail: '在线支付完成'
      },
      {
        id: generateId(),
        action: '退款申请',
        operator: '顾客',
        timestamp: new Date(now - 3600000 * 6).toISOString(),
        detail: '申请全额退款，待摊主确认'
      }
    ]
  },
  {
    id: generateId(),
    orderNo: generateOrderNo(),
    pickupCode: '3741',
    customerName: '周大伯',
    customerPhone: '130****7531',
    items: [
      {
        productId: 'p6',
        productName: '古法红糖馒头',
        productImage: 'https://picsum.photos/id/625/300/300',
        specId: 's6',
        specName: '12个装',
        price: 32.0,
        quantity: 1,
        status: 'normal'
      },
      {
        productId: 'p2',
        productName: '新鲜小青菜',
        productImage: 'https://picsum.photos/id/312/300/300',
        specId: 's2',
        specName: '约300g/把',
        price: 6.5,
        quantity: 2,
        status: 'normal'
      }
    ],
    totalAmount: 45.0,
    status: 'pending',
    pickupSlotId: 'slot1',
    pickupSlotLabel: '上午场 9:00-11:00',
    createdAt: new Date(now - 3600000 * 2).toISOString(),
    operationLogs: [
      {
        id: generateId(),
        action: '创建订单',
        operator: '顾客',
        timestamp: new Date(now - 3600000 * 2).toISOString(),
        detail: '在线支付完成'
      }
    ]
  }
];
