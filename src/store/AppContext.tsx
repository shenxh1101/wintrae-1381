import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Product } from '../types/product';
import { Booking, deriveBookingStatus, calcRefundedAmount, calcActualAmount, statusLabels } from '../types/booking';
import { NotificationRecord, CustomerSnapshot } from '../types/notification';
import { mockProducts } from '../data/products';
import { mockBookings } from '../data/bookings';
import { mockNotificationRecords } from '../data/notifications';
import { generateId, formatCurrency } from '../utils';

const STORAGE_KEYS = {
  products: 'fm_products_v1',
  bookings: 'fm_bookings_v1',
  notifications: 'fm_notifications_v1',
  initialized: 'fm_initialized_v1'
};

interface AppState {
  products: Product[];
  bookings: Booking[];
  notifications: NotificationRecord[];
}

interface AppContextType extends AppState {
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'salesCount'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  toggleProductSale: (id: string) => void;
  updateSpecStock: (productId: string, specId: string, newStock: number) => void;
  updateBookingStatus: (id: string, status: Booking['status'], remark?: string) => void;
  updateBookingItemStatus: (bookingId: string, itemIndex: number, status: 'normal' | 'exchanged' | 'refunded', exchangedItem?: string) => void;
  addNotification: (notification: Omit<NotificationRecord, 'id' | 'sentAt' | 'status'>) => void;
  addBookingOperationLog: (bookingId: string, action: string, operator: string, detail?: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw && typeof raw === 'string' && raw.length > 0) {
      return JSON.parse(raw) as T;
    }
    return fallback;
  } catch (e) {
    console.warn('[AppContext] load storage fail:', key, e);
    return fallback;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[AppContext] save storage fail:', key, e);
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(mockNotificationRecords);

  useEffect(() => {
    try {
      const isInited = Taro.getStorageSync(STORAGE_KEYS.initialized);
      if (isInited === true || isInited === 'true') {
        const savedProducts = loadFromStorage<Product[]>(STORAGE_KEYS.products, mockProducts);
        const savedBookings = loadFromStorage<Booking[]>(STORAGE_KEYS.bookings, mockBookings);
        const savedNotifications = loadFromStorage<NotificationRecord[]>(STORAGE_KEYS.notifications, mockNotificationRecords);
        setProducts(savedProducts);
        setBookings(savedBookings);
        setNotifications(savedNotifications);
        console.log('[AppContext] restored from storage', {
          products: savedProducts.length,
          bookings: savedBookings.length,
          notifications: savedNotifications.length
        });
      } else {
        saveToStorage(STORAGE_KEYS.products, mockProducts);
        saveToStorage(STORAGE_KEYS.bookings, mockBookings);
        saveToStorage(STORAGE_KEYS.notifications, mockNotificationRecords);
        Taro.setStorageSync(STORAGE_KEYS.initialized, true);
        console.log('[AppContext] initialized with mock data');
      }
    } catch (e) {
      console.warn('[AppContext] init failed, using mocks:', e);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    saveToStorage(STORAGE_KEYS.products, products);
  }, [products, initialized]);

  useEffect(() => {
    if (!initialized) return;
    saveToStorage(STORAGE_KEYS.bookings, bookings);
  }, [bookings, initialized]);

  useEffect(() => {
    if (!initialized) return;
    saveToStorage(STORAGE_KEYS.notifications, notifications);
  }, [notifications, initialized]);

  const addProduct = useCallback((productData) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      salesCount: 0
    };
    setProducts(prev => {
      const next = [newProduct, ...prev];
      return next;
    });
    console.log('[AppContext] addProduct:', newProduct.name);
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
    console.log('[AppContext] updateProduct:', id);
  }, []);

  const toggleProductSale = useCallback((id: string) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, isOnSale: !p.isOnSale, updatedAt: new Date().toISOString() } : p
    ));
    console.log('[AppContext] toggleProductSale:', id);
  }, []);

  const updateSpecStock = useCallback((productId: string, specId: string, newStock: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        specs: p.specs.map(s =>
          s.id === specId ? { ...s, stock: Math.max(0, newStock) } : s
        ),
        updatedAt: new Date().toISOString()
      };
    }));
    console.log('[AppContext] updateSpecStock:', productId, specId, newStock);
  }, []);

  const updateBookingStatus = useCallback((id: string, status: Booking['status'], remark?: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      let newItems = b.items;
      if (status === 'refund') {
        newItems = b.items.map(item => ({ ...item, status: 'refunded' as const }));
      }
      const refundedAmt = calcRefundedAmount(newItems);
      const actualAmt = calcActualAmount(newItems, b.totalAmount);
      const log = {
        id: generateId(),
        action: status === 'picked' ? '确认取货' : status === 'refund' ? '退款处理' : status === 'partial' ? '部分取货' : status === 'cancelled' ? '订单取消' : '状态变更',
        operator: '摊主',
        timestamp: new Date().toISOString(),
        detail: remark || (status === 'refund' ? `全额退款 ${formatCurrency(b.totalAmount)}` : undefined)
      };
      return {
        ...b,
        status,
        items: newItems,
        refundedAmount: refundedAmt,
        actualAmount: actualAmt,
        remark: remark || b.remark,
        pickedAt: (status === 'picked' || status === 'partial') ? new Date().toISOString() : b.pickedAt,
        operationLogs: [...b.operationLogs, log]
      };
    }));
    console.log('[AppContext] updateBookingStatus:', id, status);
  }, []);

  const updateBookingItemStatus = useCallback((bookingId: string, itemIndex: number, status: 'normal' | 'exchanged' | 'refunded', exchangedItem?: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const newItems = [...b.items];
      newItems[itemIndex] = { ...newItems[itemIndex], status, exchangedItem };
      const derivedStatus = deriveBookingStatus(newItems, b.status);
      const refundedAmt = calcRefundedAmount(newItems);
      const actualAmt = calcActualAmount(newItems, b.totalAmount);
      const log = {
        id: generateId(),
        action: status === 'exchanged' ? '缺货替换' : status === 'refunded' ? '商品退款' : '商品状态更新',
        operator: '摊主',
        timestamp: new Date().toISOString(),
        detail: `${newItems[itemIndex].productName} - ${exchangedItem || (status === 'refunded' ? '已退款 ' + formatCurrency(newItems[itemIndex].price * newItems[itemIndex].quantity) : '正常')}`
      };
      const statusChanged = derivedStatus !== b.status;
      const mergedLogs = [...b.operationLogs, log];
      if (statusChanged) {
        mergedLogs.push({
          id: generateId(),
          action: derivedStatus === 'partial' ? '部分取货' : derivedStatus === 'refund' ? '退款处理' : '状态变更',
          operator: '系统',
          timestamp: new Date().toISOString(),
          detail: `订单状态同步为${statusLabels[derivedStatus]}（实付金额 ${formatCurrency(actualAmt)}）`
        });
      }
      return {
        ...b,
        items: newItems,
        status: derivedStatus,
        refundedAmount: refundedAmt,
        actualAmount: actualAmt,
        pickedAt: derivedStatus === 'partial' ? b.pickedAt || new Date().toISOString() : b.pickedAt,
        operationLogs: mergedLogs
      };
    }));
    console.log('[AppContext] updateBookingItemStatus:', bookingId, itemIndex, status);
  }, []);

  const addNotification = useCallback((notificationData) => {
    const newNotification: NotificationRecord = {
      ...notificationData,
      id: generateId(),
      sentAt: new Date().toISOString(),
      status: 'success'
    };
    setNotifications(prev => [newNotification, ...prev]);
    console.log('[AppContext] addNotification:', newNotification.title, 'to', notificationData.targetCount, 'people');
    return newNotification;
  }, []);

  const addBookingOperationLog = useCallback((bookingId: string, action: string, operator: string, detail?: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const log = {
        id: generateId(),
        action,
        operator,
        timestamp: new Date().toISOString(),
        detail
      };
      return {
        ...b,
        operationLogs: [...b.operationLogs, log]
      };
    }));
    console.log('[AppContext] addBookingOperationLog:', bookingId, action);
  }, []);

  const resetAllData = useCallback(() => {
    Taro.showModal({
      title: '重置数据',
      content: '确认将所有商品、订单、通知数据重置为初始演示状态？此操作不可撤销。',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          setProducts(mockProducts);
          setBookings(mockBookings);
          setNotifications(mockNotificationRecords);
          Taro.setStorageSync(STORAGE_KEYS.initialized, false);
          setTimeout(() => {
            Taro.setStorageSync(STORAGE_KEYS.initialized, true);
          }, 0);
          Taro.showToast({ title: '已重置为初始数据', icon: 'success' });
        }
      }
    });
  }, []);

  if (!initialized) {
    return null;
  }

  return (
    <AppContext.Provider value={{
      products,
      bookings,
      notifications,
      addProduct,
      updateProduct,
      toggleProductSale,
      updateSpecStock,
      updateBookingStatus,
      updateBookingItemStatus,
      addNotification,
      addBookingOperationLog,
      resetAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
