import React, { useMemo, useState } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import { Booking, BookingItem, statusLabels, statusColorMap } from '../../types/booking';
import { formatDate, formatCurrency, timeAgo } from '../../utils';
import styles from './index.module.scss';

const BookingDetailPage: React.FC = () => {
  const router = useRouter();
  const { bookings, updateBookingStatus, updateBookingItemStatus } = useApp();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const bookingId = router.params?.id;
  const booking = useMemo(() =>
    bookings.find(b => b.id === bookingId),
    [bookings, bookingId]
  );

  useDidShow(() => {
    if (!booking && bookingId) {
      console.warn('[BookingDetail] order not found:', bookingId);
    }
  });

  if (!booking) {
    return (
      <View className={styles.page}>
        <View className="pageContainer">
          <View style={{
            padding: '200rpx 0',
            textAlign: 'center',
          }}>
            <Text style={{ fontSize: '80rpx', display: 'block', marginBottom: '24rpx' }}>📋</Text>
            <Text style={{ fontSize: '28rpx', color: '#86909C' }}>订单不存在或已删除</Text>
            <View style={{ marginTop: '32rpx' }}>
              <Button onClick={() => Taro.navigateBack()}>返回</Button>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const refundedTotal = booking.items
    .filter(i => i.status === 'refunded')
    .reduce((sum, i) => sum + i.price * i.quantity, 0);

  const actualAmount = booking.totalAmount - refundedTotal;

  const handlePickup = async () => {
    setActionLoading('pickup');
    await new Promise(r => setTimeout(r, 300));
    updateBookingStatus(booking.id, 'picked');
    Taro.showToast({ title: '已确认取货', icon: 'success' });
    setActionLoading(null);
  };

  const handleRefund = async () => {
    Taro.showModal({
      title: '确认退款',
      content: `确定为该订单办理退款吗？\n合计金额：${formatCurrency(booking.totalAmount)}`,
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          setActionLoading('refund');
          updateBookingStatus(booking.id, 'refund', '摊主确认全额退款');
          Taro.showToast({ title: '已提交退款', icon: 'success' });
          setActionLoading(null);
        }
      }
    });
  };

  const handleItemAction = (itemIndex: number, item: BookingItem) => {
    const itemName = `${item.productName} - ${item.specName}`;
    Taro.showActionSheet({
      itemList: [
        `🔄 缺货替换：${itemName}`,
        `💰 商品退款：${itemName}`,
        '取消'
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          Taro.showModal({
            title: '输入替换内容',
            editable: true,
            placeholderText: '请输入替换后的商品描述',
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content?.trim()) {
                setActionLoading(`item-${itemIndex}`);
                updateBookingItemStatus(booking.id, itemIndex, 'exchanged', modalRes.content.trim());
                const hasNormal = booking.items.some((i, idx) => idx !== itemIndex && i.status === 'normal');
                const currHasNormal = booking.items[itemIndex].status === 'normal';
                if (currHasNormal || hasNormal) {
                  updateBookingStatus(booking.id, 'partial');
                }
                Taro.showToast({ title: '已记录替换', icon: 'success' });
                setActionLoading(null);
              }
            }
          });
        } else if (res.tapIndex === 1) {
          Taro.showModal({
            title: '确认商品退款',
            content: `确定为"${itemName}"办理退款吗？\n退款金额：${formatCurrency(item.price * item.quantity)}`,
            confirmColor: '#F44336',
            success: (modalRes) => {
              if (modalRes.confirm) {
                setActionLoading(`item-${itemIndex}`);
                updateBookingItemStatus(booking.id, itemIndex, 'refunded');
                const hasNormal = booking.items.some((i, idx) => idx !== itemIndex && i.status === 'normal');
                if (hasNormal) {
                  updateBookingStatus(booking.id, 'partial');
                } else {
                  updateBookingStatus(booking.id, 'refund');
                }
                Taro.showToast({ title: '已提交退款', icon: 'success' });
                setActionLoading(null);
              }
            }
          });
        }
      }
    });
  };

  const handleCall = () => {
    const phone = booking.customerPhone.replace(/\*/g, '0');
    Taro.makePhoneCall({
      phoneNumber: phone.length === 11 ? phone : '13800138000',
      fail: () => {
        Taro.showToast({ title: '拨号失败，请手动拨打', icon: 'none' });
      }
    });
  };

  const handleCopyCode = () => {
    Taro.setClipboardData({
      data: booking.pickupCode,
      success: () => {
        Taro.showToast({ title: '取货码已复制', icon: 'success' });
      }
    });
  };

  const getItemStatusTag = (status: BookingItem['status']) => {
    const map = {
      normal: { className: styles.statusNormal, text: '正常' },
      exchanged: { className: styles.statusExchanged, text: '已替换' },
      refunded: { className: styles.statusRefunded, text: '已退款' }
    };
    return map[status];
  };

  const statusStyle = {
    background: `${statusColorMap[booking.status]}22`,
    color: statusColorMap[booking.status]
  };

  const canPickup = booking.status === 'pending' || booking.status === 'partial';
  const canRefund = booking.status === 'pending' || booking.status === 'partial';

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.heroSection} onClick={handleCopyCode}>
          <View className={styles.heroStatusRow}>
            <Text className={styles.heroStatusTag} style={statusStyle}>
              {statusLabels[booking.status]}
            </Text>
            <Text style={{ fontSize: '22rpx', opacity: 0.8 }}>点击复制取货码</Text>
          </View>
          <Text className={styles.heroCodeLabel}>取货码</Text>
          <Text className={styles.heroPickupCode}>{booking.pickupCode}</Text>
          <View className={styles.heroCustomerRow}>
            <View className={styles.heroAvatar}>
              {booking.customerName.charAt(0)}
            </View>
            <View className={styles.heroCustomerInfo}>
              <Text className={styles.heroCustomerName}>{booking.customerName}</Text>
              <Text className={styles.heroCustomerPhone}>{booking.customerPhone}</Text>
            </View>
            <View className={styles.heroCallBtn} onClick={(e) => { e.stopPropagation(); handleCall(); }}>
              📞
            </View>
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>订单信息</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>订单编号</Text>
            <Text className={styles.infoValue}>{booking.orderNo}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>取货时段</Text>
            <Text className={`${styles.infoValue} ${styles.infoValueHighlight}`}>{booking.pickupSlotLabel}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>下单时间</Text>
            <Text className={styles.infoValue}>{formatDate(booking.createdAt, 'YYYY-MM-DD HH:mm')}</Text>
          </View>
          {booking.pickedAt && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>取货时间</Text>
              <Text className={`${styles.infoValue} ${styles.infoValueHighlight}`}>
                {formatDate(booking.pickedAt, 'YYYY-MM-DD HH:mm')}
              </Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>商品件数</Text>
            <Text className={styles.infoValue}>
              {booking.items.reduce((s, i) => s + i.quantity, 0)} 件
            </Text>
          </View>
          {booking.remark && (
            <View className={styles.remarkBox}>
              <Text className={styles.remarkLabel}>📝 备注</Text>
              <Text className={styles.remarkContent}>{booking.remark}</Text>
            </View>
          )}
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>商品明细</Text>
          </View>
          <View className={styles.itemList}>
            {booking.items.map((item, idx) => {
              const statusTag = getItemStatusTag(item.status);
              const isRefunded = item.status === 'refunded';
              const isExchanged = item.status === 'exchanged';
              return (
                <View
                  key={idx}
                  className={`${styles.itemCard} ${isExchanged ? styles.itemCardExchanged : ''} ${isRefunded ? styles.itemCardRefunded : ''}`}
                  onClick={() => !isRefunded && canRefund && handleItemAction(idx, item)}
                >
                  <Image className={styles.itemImage} src={item.productImage} mode="aspectFill" />
                  <View className={styles.itemInfo}>
                    <View className={styles.itemTop}>
                      <Text className={styles.itemName}>{item.productName}</Text>
                      <Text className={`${styles.itemStatusTag} ${statusTag.className}`}>
                        {statusTag.text}
                      </Text>
                    </View>
                    <Text className={styles.itemSpec}>{item.specName}</Text>
                    {isExchanged && item.exchangedItem && (
                      <Text className={styles.itemExchangedNote}>
                        🔄 已替换为：{item.exchangedItem}
                      </Text>
                    )}
                    <View className={styles.itemBottom}>
                      <Text className={`${styles.itemPrice} ${isRefunded ? styles.itemPriceRefunded : ''}`}>
                        {formatCurrency(item.price)}
                      </Text>
                      <Text className={styles.itemQty}>× {item.quantity}</Text>
                      {!isRefunded && canRefund && (
                        <Text className={styles.itemActionBtn}>处理</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View className={styles.summarySection}>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>商品总额</Text>
              <Text className={styles.summaryValue}>{formatCurrency(booking.totalAmount)}</Text>
            </View>
            {refundedTotal > 0 && (
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>已退款</Text>
                <Text className={`${styles.summaryValue} ${styles.infoValueDanger}`}>
                  - {formatCurrency(refundedTotal)}
                </Text>
              </View>
            )}
            <View className={styles.summaryTotal}>
              <Text className={styles.summaryTotalLabel}>
                {refundedTotal > 0 ? '实付金额' : '订单总额'}
              </Text>
              <Text className={styles.summaryTotalValue}>{formatCurrency(actualAmount)}</Text>
            </View>
            {booking.status === 'refund' && refundedTotal === 0 && (
              <View className={styles.summaryRefundNote}>
                ⚠️ 该订单正在办理全额退款：{formatCurrency(booking.totalAmount)}
              </View>
            )}
          </View>
        </View>

        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>操作记录</Text>
          </View>
          <View className={styles.timeline}>
            {[...booking.operationLogs].reverse().map((log, idx, arr) => (
              <View key={log.id} className={styles.timelineItem}>
                <View className={`${styles.timelineDot} ${idx === 0 ? styles.timelineDotFirst : ''}`} />
                <View className={styles.timelineContent}>
                  <Text className={styles.timelineAction}>{log.action}</Text>
                  {log.detail && (
                    <Text className={styles.timelineDetail}>{log.detail}</Text>
                  )}
                  <View className={styles.timelineMeta}>
                    <Text className={styles.timelineOperator}>操作人：{log.operator}</Text>
                    <Text className={styles.timelineTime}>{timeAgo(log.timestamp)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.footerBar}>
        {canRefund && (
          <View
            className={`${styles.secondaryBtn} ${styles.secondaryBtnDanger}`}
            onClick={handleRefund}
          >
            {actionLoading === 'refund' ? '处理中...' : '全额退款'}
          </View>
        )}
        {canPickup ? (
          <View
            className={styles.primaryBtn}
            onClick={handlePickup}
          >
            {actionLoading === 'pickup' ? '确认中...' : '✅ 确认已取货'}
          </View>
        ) : booking.status === 'refund' ? (
          <View className={`${styles.primaryBtn} ${styles.primaryBtnWarn}`}>
            退款处理中
          </View>
        ) : booking.status === 'picked' ? (
          <View className={`${styles.primaryBtn} ${styles.primaryBtnDisabled}`}>
            ✅ 交易已完成
          </View>
        ) : (
          <View className={`${styles.primaryBtn} ${styles.primaryBtnDisabled}`}>
            {statusLabels[booking.status]}
          </View>
        )}
      </View>
    </View>
  );
};

export default BookingDetailPage;
