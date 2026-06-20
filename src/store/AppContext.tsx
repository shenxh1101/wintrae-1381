import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product } from '../types/product';
import { Booking } from '../types/booking';
import { NotificationRecord } from '../types/notification';
import { mockProducts } from '../data/products';
import { mockBookings } from '../data/bookings';
import { mockNotificationRecords } from '../data/notifications';
import { generateId } from '../utils';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(mockNotificationRecords);

  const addProduct = useCallback((productData) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      salesCount: 0
    };
    setProducts(prev => [newProduct, ...prev]);
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
      const log = {
        id: generateId(),
        action: status === 'picked' ? '确认取货' : status === 'refund' ? '退款处理' : '状态变更',
        operator: '摊主',
        timestamp: new Date().toISOString(),
        detail: remark
      };
      return {
        ...b,
        status,
        remark: remark || b.remark,
        pickedAt: status === 'picked' ? new Date().toISOString() : b.pickedAt,
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
      const log = {
        id: generateId(),
        action: status === 'exchanged' ? '缺货替换' : status === 'refunded' ? '商品退款' : '商品状态更新',
        operator: '摊主',
        timestamp: new Date().toISOString(),
        detail: `${newItems[itemIndex].productName} - ${exchangedItem || (status === 'refunded' ? '已退款' : '正常')}`
      };
      return {
        ...b,
        items: newItems,
        operationLogs: [...b.operationLogs, log]
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
    console.log('[AppContext] addNotification:', newNotification.title);
  }, []);

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
      addNotification
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
