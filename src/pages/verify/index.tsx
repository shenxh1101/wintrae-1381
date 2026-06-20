import React, { useState, useMemo } from 'react';
import { View, Text, Input, Button, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import SearchBar from '../../components/SearchBar';
import StatusTag from '../../components/StatusTag';
import { Booking } from '../../types/booking';
import { formatCurrency } from '../../utils';
import styles from './index.module.scss';

type SearchMode = 'code' | 'name';

const VerifyPage: React.FC = () => {
  const { bookings, updateBookingStatus, updateBookingItemStatus } = useApp();
  const [searchMode, setSearchMode] = useState<SearchMode>('code');
  const [codeInput, setCodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[Verify] didShow');
  });

  usePullDownRefresh(() => {
    console.log('[Verify] pullDownRefresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const pendingBookings = useMemo(() => {
    return bookings
      .filter(b => b.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings]);

  const stats = useMemo(() => {
    return {
      totalPending: pendingBookings.length,
      todayPicked: bookings.filter(b =>
        b.status === 'picked' &&
        new Date(b.pickedAt || '').toDateString() === new Date().toDateString()
      ).length,
      todayRefund: bookings.filter(b => b.status === 'refund').length
    };
  }, [bookings, pendingBookings]);

  const searchResult: Booking | null = useMemo(() => {
    if (searchMode === 'code') {
      if (codeInput.length !== 4) return null;
      return bookings.find(b => b.pickupCode === codeInput) || null;
    } else {
      if (!nameInput.trim()) return null;
      return bookings.find(b =>
        b.customerName.toLowerCase().includes(nameInput.toLowerCase())
      ) || null;
    }
  }, [bookings, searchMode, codeInput, nameInput]);

  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setCodeInput(cleaned);
  };

  const handleQuickVerify = (booking: Booking) => {
    setCodeInput(booking.pickupCode);
    console.log('[Verify] quickSelect:', booking.customerName, booking.pickupCode);
  };

  const handleConfirmPick = (booking: Booking) => {
    console.log('[Verify] confirmPick:', booking.id);
    const refundItems = booking.items.filter(i => i.status === 'refunded');
    const exchangedItems = booking.items.filter(i => i.status === 'exchanged');

    if (refundItems.length > 0 || exchangedItems.length > 0) {
      Taro.showModal({
        title: '确认部分取货',
        content: `该订单有${refundItems.length}件退款、${exchangedItems.length}件替换，确认完成核销？`,
        confirmText: '确认核销',
        confirmColor: '#4CAF50',
        success: (res) => {
          if (res.confirm) {
            updateBookingStatus(booking.id, refundItems.length > 0 && exchangedItems.length === 0 && refundItems.length === booking.items.length
              ? 'cancelled'
              : refundItems.length > 0 || exchangedItems.length > 0 ? 'partial' : 'picked'
            );
            Taro.showToast({ title: '核销成功', icon: 'success' });
            setCodeInput('');
            setNameInput('');
          }
        }
      });
    } else {
      Taro.showModal({
        title: '确认取货',
        content: `确认 ${booking.customerName} 的所有商品已取走？`,
        confirmText: '确认取货',
        confirmColor: '#4CAF50',
        success: (res) => {
          if (res.confirm) {
            updateBookingStatus(booking.id, 'picked');
            Taro.showToast({ title: '核销成功', icon: 'success' });
            setCodeInput('');
            setNameInput('');
          }
        }
      });
    }
  };

  const handleMarkRefund = (booking: Booking, itemIndex: number) => {
    console.log('[Verify] markItemRefund:', booking.id, itemIndex);
    Taro.showModal({
      title: '商品缺货退款',
      content: `确认将 ${booking.items[itemIndex].productName} 标记为退款？`,
      confirmText: '确认退款',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          updateBookingItemStatus(booking.id, itemIndex, 'refunded');
          Taro.showToast({ title: '已标记退款', icon: 'success' });
        }
      }
    });
  };

  const handleMarkExchange = (booking: Booking, itemIndex: number) => {
    console.log('[Verify] markItemExchange:', booking.id, itemIndex);
    Taro.showModal({
      title: '缺货替换',
      editable: true,
      placeholderText: '请输入替换商品说明...',
      content: '请输入替换商品说明',
      confirmText: '确认替换',
      confirmColor: '#FF7D00',
      success: (res) => {
        if (res.confirm && res.content) {
          updateBookingItemStatus(booking.id, itemIndex, 'exchanged', res.content);
          Taro.showToast({ title: '已标记替换', icon: 'success' });
        }
      }
    });
  };

  const handleVerifyAll = () => {
    if (searchResult) {
      handleConfirmPick(searchResult);
    }
  };

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.heroSection}>
          <Text className={styles.heroTitle}>🎯 取货核销中心</Text>
          <Text className={styles.heroSubtitle}>输入取货码或搜索顾客姓名快速核销</Text>

          <View className={styles.verifyCodeSection}>
            <Text className={styles.verifyTitle}>快速输入取货码</Text>
            <View
              className={styles.codeInputRow}
              onClick={() => {
                // focus hidden input workaround handled by direct input
              }}
            >
              {[0, 1, 2, 3].map(i => (
                <View
                  key={i}
                  className={`${styles.codeDigit} ${
                    codeInput.length === i ? styles.codeDigitActive : ''
                  } ${codeInput.length > i ? styles.codeDigitFilled : ''}`}
                >
                  {codeInput[i] || ''}
                </View>
              ))}
            </View>
            <Input
              className={styles.hiddenInput}
              type="number"
              maxlength={4}
              value={codeInput}
              onInput={(e) => handleCodeChange(e.detail.value)}
              focus={true}
            />
            <Button
              className={styles.verifyBtn}
              disabled={codeInput.length !== 4 || !searchResult || searchResult.status !== 'pending'}
              onClick={handleVerifyAll}
            >
              {codeInput.length === 4
                ? (searchResult
                    ? (searchResult.status === 'pending' ? '确认核销' : '该订单已处理')
                    : '未找到订单')
                : `请输入4位取货码 (${codeInput.length}/4)`}
            </Button>
          </View>
        </View>

        <View className={styles.pendingStats}>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{stats.totalPending}</Text>
            <Text className={styles.statLabel}>待取货</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={`${styles.statNum} ${styles.statNumGreen}`}>{stats.todayPicked}</Text>
            <Text className={styles.statLabel}>今日已取</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={`${styles.statNum} ${styles.statNumRed}`}>{stats.todayRefund}</Text>
            <Text className={styles.statLabel}>退款中</Text>
          </View>
        </View>

        <View className={styles.searchSection}>
          <View className={styles.searchModeTabs}>
            <View
              className={`${styles.searchTab} ${searchMode === 'code' ? styles.searchTabActive : ''}`}
              onClick={() => { setSearchMode('code'); setNameInput(''); }}
            >
              🔢 按取货码
            </View>
            <View
              className={`${styles.searchTab} ${searchMode === 'name' ? styles.searchTabActive : ''}`}
              onClick={() => { setSearchMode('name'); setCodeInput(''); }}
            >
              👤 按姓名
            </View>
          </View>

          {searchMode === 'name' && (
            <SearchBar
              value={nameInput}
              onChange={setNameInput}
              placeholder="输入顾客姓名搜索..."
            />
          )}
        </View>

        {(searchMode === 'name' || codeInput.length === 4) && (
          <ScrollView scrollY style={{ maxHeight: 'calc(100vh - 800rpx)' }}>
            {searchResult ? (
              <View className={styles.resultCard}>
                <View className={styles.resultHeader}>
                  <View className={styles.resultCustomer}>
                    <View className={styles.resultAvatar}>
                      {searchResult.customerName.charAt(0)}
                    </View>
                    <View>
                      <Text className={styles.resultName}>{searchResult.customerName}</Text>
                      <Text className={styles.resultPhone}>{searchResult.customerPhone} · {searchResult.pickupSlotLabel}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                    <StatusTag status={searchResult.status} />
                    <View className={styles.resultCodeBox} style={{ marginTop: '12rpx' }}>
                      <Text className={styles.resultCodeLabel}>取货码</Text>
                      <Text className={styles.resultCode}>{searchResult.pickupCode}</Text>
                    </View>
                  </View>
                </View>

                <View className={styles.resultItems}>
                  {searchResult.items.map((item, index) => (
                    <View key={index} className={styles.resultItemRow}>
                      <Image
                        className={styles.resultItemImage}
                        src={item.productImage}
                        mode="aspectFill"
                      />
                      <View className={styles.resultItemInfo}>
                        <Text className={styles.resultItemName}>
                          {item.productName}
                          {item.status === 'exchanged' && <Text style={{ color: '#FF7D00' }}> [已替换]</Text>}
                          {item.status === 'refunded' && <Text style={{ color: '#F53F3F', textDecoration: 'line-through' }}> [已退款]</Text>}
                        </Text>
                        <Text className={styles.resultItemSpec}>
                          {item.specName}
                          {item.exchangedItem && ` → ${item.exchangedItem}`}
                        </Text>
                      </View>
                      <View className={styles.resultItemPrice}>
                        <Text className={styles.resultItemAmount}>{formatCurrency(item.price)}</Text>
                        <Text className={styles.resultItemQty}>×{item.quantity}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {searchResult.remark && (
                  <View style={{ marginBottom: '24rpx', padding: '16rpx', background: '#FFF8E6', borderRadius: '8rpx' }}>
                    <Text style={{ fontSize: '24rpx', color: '#FF9800' }}>📝 {searchResult.remark}</Text>
                  </View>
                )}

                {searchResult.status === 'pending' && (
                  <View className={styles.resultActions}>
                    <Button
                      className={`${styles.actionBtn} ${styles.actionBtnError}`}
                      onClick={() => {
                        Taro.showActionSheet({
                          itemList: searchResult.items.map((it, i) =>
                            `缺货退款: ${it.productName}(${it.specName})`
                          ).concat(
                            searchResult.items.map((it, i) =>
                              `缺货替换: ${it.productName}(${it.specName})`
                            )
                          ),
                          success: (res) => {
                            const idx = res.tapIndex;
                            if (idx < searchResult.items.length) {
                              handleMarkRefund(searchResult, idx);
                            } else {
                              handleMarkExchange(searchResult, idx - searchResult.items.length);
                            }
                          }
                        });
                      }}
                    >
                      缺货处理
                    </Button>
                    <Button
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={() => handleConfirmPick(searchResult)}
                    >
                      确认取货
                    </Button>
                  </View>
                )}
              </View>
            ) : (
              (searchMode === 'name' && nameInput.trim()) || codeInput.length === 4 ? (
                <View className={styles.notFoundBox}>
                  <Text className={styles.notFoundIcon}>🔍</Text>
                  <Text className={styles.notFoundText}>未找到相关订单</Text>
                  <Text className={styles.notFoundSubtext}>
                    {searchMode === 'code' ? '请检查取货码是否正确' : '请检查姓名是否正确'}
                  </Text>
                </View>
              ) : null
            )}
          </ScrollView>
        )}

        {!searchResult && (
          <View className={styles.quickList}>
            <Text className={styles.quickListTitle}>⏰ 待取货订单（快速选择）</Text>
            {pendingBookings.length > 0 ? (
              pendingBookings.slice(0, 10).map(booking => (
                <View
                  key={booking.id}
                  className={styles.quickItem}
                  onClick={() => handleQuickVerify(booking)}
                >
                  <View className={styles.quickItemAvatar}>
                    {booking.customerName.charAt(0)}
                  </View>
                  <View className={styles.quickItemInfo}>
                    <Text className={styles.quickItemName}>{booking.customerName}</Text>
                    <Text className={styles.quickItemSlot}>{booking.pickupSlotLabel} · {booking.items.length}件商品</Text>
                  </View>
                  <Text className={styles.quickItemCode}>{booking.pickupCode}</Text>
                </View>
              ))
            ) : (
              <View style={{ padding: '48rpx 0', textAlign: 'center' }}>
                <Text style={{ fontSize: '28rpx', color: '#86909C' }}>✅ 所有订单已处理完成</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default VerifyPage;
