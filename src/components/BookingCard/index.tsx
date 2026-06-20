import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Booking } from '../../types/booking';
import { formatCurrency, formatDate } from '../../utils';
import StatusTag from '../StatusTag';
import styles from './index.module.scss';

interface BookingCardProps {
  booking: Booking;
  showActions?: boolean;
  onPick?: () => void;
  onDetail?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, showActions = true, onPick, onDetail }) => {
  const handleDetail = () => {
    if (onDetail) {
      onDetail();
    } else {
      Taro.navigateTo({
        url: `/pages/booking-detail/index?id=${booking.id}`
      });
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0) || '客';
  };

  return (
    <View className={styles.bookingCard} onClick={handleDetail}>
      <View className={styles.header}>
        <View className={styles.customerInfo}>
          <View className={styles.avatar}>{getInitial(booking.customerName)}</View>
          <View className={styles.customerDetails}>
            <Text className={styles.customerName}>{booking.customerName}</Text>
            <Text className={styles.customerPhone}>{booking.customerPhone}</Text>
          </View>
          <View style={{ marginLeft: '24rpx' }}>
            <StatusTag status={booking.status} />
          </View>
        </View>
        <View className={styles.pickupCodeBox}>
          <Text className={styles.pickupCodeLabel}>取货码</Text>
          <Text className={styles.pickupCode}>{booking.pickupCode}</Text>
        </View>
      </View>

      <View className={styles.itemsSection}>
        {booking.items.map((item, index) => (
          <View key={index} className={styles.itemRow}>
            <Image
              className={styles.itemImage}
              src={item.productImage}
              mode="aspectFill"
            />
            <View className={styles.itemInfo}>
              <Text className={styles.itemName}>
                {item.productName}
                {item.status === 'exchanged' && (
                  <Text className={classnames(styles.itemStatus, styles.itemExchanged)}>
                    [已替换]
                  </Text>
                )}
                {item.status === 'refunded' && (
                  <Text className={classnames(styles.itemStatus, styles.itemRefunded)}>
                    [已退款]
                  </Text>
                )}
              </Text>
              <Text className={styles.itemSpec}>
                {item.specName}
                {item.exchangedItem && ` → ${item.exchangedItem}`}
              </Text>
            </View>
            <View className={styles.itemPriceRow}>
              <Text className={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              <Text className={styles.itemQty}>×{item.quantity}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className={styles.metaRow}>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>取货时段:</Text>
          <Text className={classnames(styles.metaValue, styles.metaValueHighlight)}>{booking.pickupSlotLabel}</Text>
        </View>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>下单时间:</Text>
          <Text className={styles.metaValue}>{formatDate(booking.createdAt, 'MM-DD HH:mm')}</Text>
        </View>
      </View>

      {booking.remark && (
        <View style={{ marginBottom: '24rpx', padding: '16rpx', background: '#FFF8E6', borderRadius: '8rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#FF9800' }}>📝 {booking.remark}</Text>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.amount}>
          <Text className={styles.amountLabel}>合计</Text>
          {booking.refundedAmount && booking.refundedAmount > 0 ? (
            <>
              <Text className={styles.amountValue}>{formatCurrency(booking.actualAmount ?? booking.totalAmount - booking.refundedAmount)}</Text>
              <Text className={styles.amountOriginal}> {formatCurrency(booking.totalAmount)}</Text>
            </>
          ) : (
            <Text className={styles.amountValue}>{formatCurrency(booking.totalAmount)}</Text>
          )}
        </Text>
        {showActions && (
          <View className={styles.actions}>
            <Button className={classnames(styles.btn, styles.btnOutline)} onClick={(e) => { e.stopPropagation(); handleDetail(); }}>
              详情
            </Button>
            {booking.status === 'pending' && onPick && (
              <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={(e) => { e.stopPropagation(); onPick(); }}>
                确认取货
              </Button>
            )}
            {booking.status === 'refund' && (
              <Button className={classnames(styles.btn, styles.btnWarning)}>
                处理退款
              </Button>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default BookingCard;
