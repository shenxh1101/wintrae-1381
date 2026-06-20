import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import SearchBar from '../../components/SearchBar';
import BookingCard from '../../components/BookingCard';
import { BookingStatus, statusLabels } from '../../types/booking';
import styles from './index.module.scss';

type StatusFilter = BookingStatus | 'all';

const BookingsPage: React.FC = () => {
  const { bookings, updateBookingStatus } = useApp();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[Bookings] didShow, total bookings:', bookings.length);
  });

  usePullDownRefresh(() => {
    console.log('[Bookings] pullDownRefresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const summary = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      partial: bookings.filter(b => b.status === 'partial').length,
      picked: bookings.filter(b => b.status === 'picked').length,
      refund: bookings.filter(b => b.status === 'refund' || b.status === 'cancelled').length
    };
  }, [bookings]);

  const slots = useMemo(() => {
    const slotSet = new Set<string>();
    bookings.forEach(b => slotSet.add(b.pickupSlotLabel));
    return Array.from(slotSet);
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => {
        if (statusFilter !== 'all') {
          if (statusFilter === 'refund') {
            if (b.status !== 'refund' && b.status !== 'cancelled') return false;
          } else if (b.status !== statusFilter) {
            return false;
          }
        }
        if (slotFilter !== 'all' && b.pickupSlotLabel !== slotFilter) return false;
        if (searchText) {
          const search = searchText.toLowerCase();
          const matchName = b.customerName.toLowerCase().includes(search);
          const matchCode = b.pickupCode.includes(search);
          const matchPhone = b.customerPhone.includes(search);
          const matchOrder = b.orderNo.toLowerCase().includes(search);
          if (!matchName && !matchCode && !matchPhone && !matchOrder) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const statusPriority: Record<BookingStatus, number> = {
          pending: 0,
          partial: 1,
          picked: 2,
          refund: 3,
          cancelled: 4
        };
        const pa = statusPriority[a.status];
        const pb = statusPriority[b.status];
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [bookings, statusFilter, slotFilter, searchText]);

  const handlePick = (bookingId: string) => {
    console.log('[Bookings] confirmPick:', bookingId);
    Taro.showModal({
      title: '确认取货',
      content: '确认该订单所有商品已被顾客取走？',
      confirmText: '确认取货',
      confirmColor: '#4CAF50',
      success: (res) => {
        if (res.confirm) {
          updateBookingStatus(bookingId, 'picked');
          Taro.showToast({ title: '已确认取货', icon: 'success' });
        }
      }
    });
  };

  const handleGoVerify = () => {
    Taro.switchTab({ url: '/pages/verify/index' });
  };

  const handleGoNotify = () => {
    Taro.switchTab({ url: '/pages/notify/index' });
  };

  const statusTabs: Array<{ key: StatusFilter; label: string; count: number; emptyText: string; emptyIcon: string }> = [
    { key: 'all', label: '全部', count: summary.total, emptyText: '暂无订单数据', emptyIcon: '📦' },
    { key: 'pending', label: statusLabels.pending, count: summary.pending, emptyText: '太棒了！暂无待取货订单', emptyIcon: '🌿' },
    { key: 'partial', label: statusLabels.partial, count: summary.partial, emptyText: '暂无部分取货订单', emptyIcon: '📋' },
    { key: 'picked', label: '已完成', count: summary.picked, emptyText: '暂无已完成订单', emptyIcon: '✅' },
    { key: 'refund', label: '退款/取消', count: summary.refund, emptyText: '暂无退款或取消订单', emptyIcon: '💰' }
  ];

  const currentTab = statusTabs.find(t => t.key === statusFilter) || statusTabs[0];

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.topSection}>
          <Text className={styles.pageTitle}>预订订单</Text>
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="搜索姓名/取货码/手机号..."
          />
          <View style={{ height: '24rpx' }} />
          <ScrollView scrollX style={{ width: '100%', whiteSpace: 'nowrap' }}>
            <View className={styles.statusTabs}>
              {statusTabs.map(tab => (
                <View
                  key={tab.key}
                  className={`${styles.statusTab} ${statusFilter === tab.key ? styles.statusTabActive : ''}`}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label}
                  <Text className={styles.tabCount}>{tab.count}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <View className={styles.quickSearch}>
            <Button className={styles.quickBtn} onClick={handleGoVerify}>
              🎯 核销中心
            </Button>
            <Button className={`${styles.quickBtn} ${styles.quickBtnPrimary}`} onClick={handleGoNotify}>
              📢 催取通知
            </Button>
          </View>
        </View>

        <View className={styles.summaryCard}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryNum}>{summary.total}</Text>
            <Text className={styles.summaryLabel}>总订单</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={`${styles.summaryNum} ${styles.summaryNumOrange}`}>{summary.pending}</Text>
            <Text className={styles.summaryLabel}>待取货</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={`${styles.summaryNum} ${styles.summaryNumBlue}`}>{summary.partial}</Text>
            <Text className={styles.summaryLabel}>部分取货</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={`${styles.summaryNum} ${styles.summaryNumGreen}`}>{summary.picked}</Text>
            <Text className={styles.summaryLabel}>已完成</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={`${styles.summaryNum} ${styles.summaryNumRed}`}>{summary.refund}</Text>
            <Text className={styles.summaryLabel}>退款/取消</Text>
          </View>
        </View>

        {slots.length > 0 && (
          <ScrollView scrollX style={{ marginBottom: '24rpx', whiteSpace: 'nowrap' }}>
            <View className={styles.slotFilter}>
              <View
                className={`${styles.slotChip} ${slotFilter === 'all' ? styles.slotChipActive : ''}`}
                onClick={() => setSlotFilter('all')}
              >
                全部时段
              </View>
              {slots.map(slot => (
                <View
                  key={slot}
                  className={`${styles.slotChip} ${slotFilter === slot ? styles.slotChipActive : ''}`}
                  onClick={() => setSlotFilter(slot)}
                >
                  {slot}
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <View style={{ height: `calc(100vh - ${statusTabs.length > 4 ? '680' : '620'}rpx)` }}>
          <ScrollView scrollY style={{ height: '100%' }}>
            {filteredBookings.length > 0 ? (
              filteredBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPick={() => handlePick(booking.id)}
                />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>{currentTab.emptyIcon}</Text>
                <Text className={styles.emptyText}>{currentTab.emptyText}</Text>
                {(slotFilter !== 'all' || searchText.trim()) && (
                  <Text style={{ fontSize: '24rpx', color: '#86909C', marginTop: '12rpx' }}>
                    可尝试清除搜索或时段筛选条件
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default BookingsPage;
