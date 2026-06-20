import React, { useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import { NotificationType, NotificationTarget, notificationTypeLabels, notificationTargetLabels, SelectedCustomer } from '../../types/notification';
import { formatDate, timeAgo } from '../../utils';
import styles from './index.module.scss';

const NotificationDetailPage: React.FC = () => {
  const router = useRouter();
  const { notifications, bookings } = useApp();
  const [loading, setLoading] = useState(false);

  const notificationId = router.params?.id;
  const notification = useMemo(() =>
    notifications.find(n => n.id === notificationId),
    [notifications, notificationId]
  );

  useDidShow(() => {
    if (!notification && notificationId) {
      console.warn('[NotificationDetail] notification not found:', notificationId);
    }
  });

  const targetCustomers = useMemo<SelectedCustomer[]>(() => {
    if (!notification) return [];
    if (notification.target === 'specific' && notification.targetCustomers && notification.targetCustomers.length > 0) {
      return notification.targetCustomers;
    }
    if (notification.target === 'pending') {
      return bookings
        .filter(b => b.status === 'pending' || b.status === 'partial')
        .map(b => ({
          customerId: b.customerPhone,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          bookingId: b.id,
          pickupCode: b.pickupCode
        }));
    }
    if (notification.target === 'picked') {
      return bookings
        .filter(b => b.status === 'picked')
        .map(b => ({
          customerId: b.customerPhone,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          bookingId: b.id,
          pickupCode: b.pickupCode
        }));
    }
    if (notification.target === 'all') {
      return bookings.map(b => ({
        customerId: b.customerPhone,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        bookingId: b.id,
        pickupCode: b.pickupCode
      }));
    }
    return [];
  }, [notification, bookings]);

  const getBookingByCustomer = (customerId: string) => {
    return bookings.find(b => b.customerPhone === customerId || b.id === customerId);
  };

  const handleOpenBooking = (bookingId: string) => {
    const found = bookings.find(b => b.id === bookingId);
    if (found) {
      Taro.navigateTo({ url: `/pages/booking-detail/index?id=${bookingId}` });
    } else {
      Taro.showToast({ title: '订单不存在', icon: 'none' });
    }
  };

  const handleCallCustomer = (phone: string) => {
    const cleanPhone = phone.replace(/\*/g, '0');
    Taro.makePhoneCall({
      phoneNumber: cleanPhone.length === 11 ? cleanPhone : '13800138000',
      fail: () => {
        Taro.showToast({ title: '拨号失败，请手动拨打', icon: 'none' });
      }
    });
  };

  const getTypeColorClass = (type: NotificationType) => {
    const map: Record<NotificationType, string> = {
      open: styles.typeOpen,
      outOfStock: styles.typeStock,
      close: styles.typeClose,
      custom: styles.typeCustom
    };
    return map[type];
  };

  const getTargetHint = (target: NotificationTarget) => {
    const hints: Record<NotificationTarget, string> = {
      all: '系统向全部顾客发送此通知',
      pending: '系统向所有待取货和部分取货的顾客发送',
      picked: '系统向已完成取货的顾客发送',
      specific: '以下为本次指定的收件人和对应订单'
    };
    return hints[target];
  };

  if (!notification) {
    return (
      <View className={styles.page}>
        <View className="pageContainer">
          <View style={{ padding: '200rpx 0', textAlign: 'center' }}>
            <Text style={{ fontSize: '80rpx', display: 'block', marginBottom: '24rpx' }}>📭</Text>
            <Text style={{ fontSize: '28rpx', color: '#86909C' }}>通知记录不存在或已删除</Text>
            <View style={{ marginTop: '32rpx' }}>
              <Button onClick={() => Taro.navigateBack()}>返回</Button>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.heroSection}>
          <View className={`${styles.heroTypeBar} ${getTypeColorClass(notification.type)}`} />
          <View className={styles.heroTypeBadge}>
            {notificationTypeLabels[notification.type]}
          </View>
          <Text className={styles.heroTitle}>{notification.title}</Text>
          <View className={styles.heroMeta}>
            <Text className={styles.heroMetaItem}>
              🎯 {notificationTargetLabels[notification.target]}
            </Text>
            <Text className={styles.heroMetaItem}>
              👥 {notification.targetCount} 人
            </Text>
            <Text className={styles.heroMetaItem}>
              ⏱ {timeAgo(notification.sentAt)}
            </Text>
          </View>
          <View className={styles.heroStatusRow}>
            <View className={`${styles.statusBadge} ${styles.statusSuccess}`}>
              ✓ 发送成功
            </View>
            <Text className={styles.sentAt}>
              {formatDate(notification.sentAt, 'YYYY-MM-DD HH:mm:ss')}
            </Text>
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>通知内容</Text>
          </View>
          <View className={styles.contentBox}>
            <Text className={styles.contentText}>{notification.content}</Text>
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>发送对象</Text>
            <Text className={styles.cardHeaderCount}>共 {targetCustomers.length} 人</Text>
          </View>

          <View className={styles.targetHintBox}>
            <Text className={styles.targetHintText}>
              💡 {getTargetHint(notification.target)}
            </Text>
          </View>

          {targetCustomers.length > 0 ? (
            <View className={styles.customerList}>
              {targetCustomers.map((cust, idx) => {
                const booking = getBookingByCustomer(cust.bookingId || cust.customerId);
                return (
                  <View
                    key={cust.customerId + '_' + idx}
                    className={styles.customerCard}
                    onClick={() => cust.bookingId && handleOpenBooking(cust.bookingId)}
                  >
                    <View className={styles.customerAvatar}>
                      {cust.customerName.charAt(0) || '客'}
                    </View>
                    <View className={styles.customerInfo}>
                      <View className={styles.customerTopRow}>
                        <Text className={styles.customerName}>{cust.customerName}</Text>
                        {booking && (
                          <View className={styles.customerPickupCode}>
                            取货码 {booking.pickupCode}
                          </View>
                        )}
                      </View>
                      <Text className={styles.customerPhone}>📱 {cust.customerPhone}</Text>
                      {booking && (
                        <Text className={styles.customerOrder}>
                          📦 订单号 {booking.orderNo} · {booking.items.length}件商品
                        </Text>
                      )}
                    </View>
                    <View className={styles.customerActions}>
                      <View
                        className={styles.actionIconBtn}
                        onClick={(e) => { e.stopPropagation(); handleCallCustomer(cust.customerPhone); }}
                      >
                        📞
                      </View>
                      {cust.bookingId && (
                        <View
                          className={styles.actionIconBtn}
                          onClick={(e) => { e.stopPropagation(); handleOpenBooking(cust.bookingId); }}
                        >
                          📋
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ padding: '60rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '80rpx', opacity: 0.4 }}>👥</Text>
              <View style={{ height: '16rpx' }} />
              <Text style={{ fontSize: '26rpx', color: '#86909C' }}>暂无收件人信息</Text>
            </View>
          )}
        </View>

        <View style={{ height: '48rpx' }} />
      </View>
    </View>
  );
};

export default NotificationDetailPage;
