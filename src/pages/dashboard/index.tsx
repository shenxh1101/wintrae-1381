import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import StatCard from '../../components/StatCard';
import SectionHeader from '../../components/SectionHeader';
import { mockRevenue, mockHotProducts, mockDailyStats } from '../../data/stats';
import { formatCurrency, formatDate } from '../../utils';
import styles from './index.module.scss';

const DashboardPage: React.FC = () => {
  const { bookings, products } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[Dashboard] didShow');
  });

  usePullDownRefresh(() => {
    console.log('[Dashboard] pullDownRefresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = formatDate(today, 'YYYY-MM-DD');
    const todayBookings = bookings.filter(b => formatDate(b.createdAt, 'YYYY-MM-DD') === todayStr);
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const pickedBookings = bookings.filter(b => b.status === 'picked' || b.status === 'partial');
    const refundBookings = bookings.filter(b => b.status === 'refund');
    const onSaleProducts = products.filter(p => p.isOnSale);
    const lowStockProducts = products.filter(p =>
      p.specs.some(s => s.stock > 0 && s.stock / s.originalStock <= 0.2)
    ).length;

    return {
      totalOrders: bookings.length,
      todayOrders: todayBookings.length,
      pendingOrders: pendingBookings.length,
      pickedOrders: pickedBookings.length,
      refundOrders: refundBookings.length,
      totalProducts: products.length,
      onSaleProducts: onSaleProducts.length,
      lowStockProducts
    };
  }, [bookings, products]);

  const handleQuickAction = (action: string) => {
    console.log('[Dashboard] quickAction:', action);
    switch (action) {
      case 'addProduct':
        Taro.navigateTo({ url: '/pages/product-edit/index' });
        break;
      case 'viewBookings':
        Taro.switchTab({ url: '/pages/bookings/index' });
        break;
      case 'verify':
        Taro.switchTab({ url: '/pages/verify/index' });
        break;
      case 'notify':
        Taro.switchTab({ url: '/pages/notify/index' });
        break;
      default:
        break;
    }
  };

  const maxRevenue = Math.max(...mockDailyStats.map(d => d.totalRevenue));

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.heroSection}>
          <Text className={styles.heroTitle}>🌿 周末农夫市集</Text>
          <Text className={styles.heroSubtitle}>{formatDate(new Date(), 'YYYY年MM月DD日')} · 营业中</Text>

          <View className={styles.revenueBox}>
            <Text className={styles.revenueLabel}>今日预订收入</Text>
            <View>
              <Text className={styles.revenueValue}>
                <Text className={styles.revenueUnit}>¥</Text>
                {mockRevenue.today.toLocaleString()}
              </Text>
            </View>
            <View className={styles.revenueMeta}>
              <Text className={styles.revenueMetaItem}>
                本周 {formatCurrency(mockRevenue.week)}
                <Text className={styles.revenueTrend}>↑ {mockRevenue.compareYesterday}%</Text>
              </Text>
              <Text className={styles.revenueMetaItem}>
                本月 {formatCurrency(mockRevenue.month)}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.contentSection}>
          <View className={styles.statsGrid}>
            <StatCard
              icon="📋"
              label="预订订单"
              value={stats.totalOrders}
              suffix="单"
              subText={`今日新增 ${stats.todayOrders} 单`}
            />
            <StatCard
              icon="⏰"
              label="待取货"
              value={stats.pendingOrders}
              suffix="单"
              subText="请及时处理"
              variant="orange"
            />
            <StatCard
              icon="✅"
              label="已取货"
              value={stats.pickedOrders}
              suffix="单"
              subText="完成取货"
            />
            <StatCard
              icon="⚠️"
              label="低库存"
              value={stats.lowStockProducts}
              suffix="件"
              subText="需及时补货"
              variant="orange"
            />
          </View>

          <View className={styles.quickActions}>
            <Text className={styles.quickActionsTitle}>快捷操作</Text>
            <View className={styles.quickActionsGrid}>
              <View className={styles.actionItem} onClick={() => handleQuickAction('addProduct')}>
                <View className={`${styles.actionIcon} ${styles.actionGreen}`}>➕</View>
                <Text className={styles.actionLabel}>上架商品</Text>
              </View>
              <View className={styles.actionItem} onClick={() => handleQuickAction('viewBookings')}>
                <View className={`${styles.actionIcon} ${styles.actionOrange}`}>📦</View>
                <Text className={styles.actionLabel}>预订管理</Text>
              </View>
              <View className={styles.actionItem} onClick={() => handleQuickAction('verify')}>
                <View className={`${styles.actionIcon} ${styles.actionBlue}`}>🎯</View>
                <Text className={styles.actionLabel}>取货核销</Text>
              </View>
              <View className={styles.actionItem} onClick={() => handleQuickAction('notify')}>
                <View className={`${styles.actionIcon} ${styles.actionPurple}`}>📢</View>
                <Text className={styles.actionLabel}>顾客通知</Text>
              </View>
            </View>
          </View>

          <SectionHeader title="近7日订单趋势" />
          <View className={styles.chartSection}>
            <Text className={styles.chartTitle}>订单与收入</Text>
            <View className={styles.chartContainer}>
              {mockDailyStats.map((day, index) => (
                <View key={index} className={styles.chartBar}>
                  <View className={styles.barWrapper}>
                    <View
                      className={styles.bar}
                      style={{ height: `${(day.totalRevenue / maxRevenue) * 100}%` }}
                    >
                      <Text className={styles.barValue}>{day.totalOrders}</Text>
                    </View>
                  </View>
                  <Text className={styles.barLabel}>{day.date}</Text>
                </View>
              ))}
            </View>
          </View>

          <SectionHeader title="热卖商品榜" subtitle="Top 5" />
          <View className={styles.hotList}>
            {mockHotProducts.map((product) => (
              <View key={product.productId} className={styles.hotItem}>
                <View className={`${styles.rankBadge} ${
                  product.rank === 1 ? styles.rank1 :
                  product.rank === 2 ? styles.rank2 :
                  product.rank === 3 ? styles.rank3 : styles.rankOther
                }`}>
                  {product.rank}
                </View>
                <Image
                  className={styles.hotImage}
                  src={product.productImage}
                  mode="aspectFill"
                />
                <View className={styles.hotInfo}>
                  <Text className={styles.hotName}>{product.productName}</Text>
                  <Text className={styles.hotCategory}>{product.category}</Text>
                </View>
                <View className={styles.hotStats}>
                  <Text className={styles.hotSold}>
                    {product.soldCount}
                    <Text className={styles.hotSoldUnit}> 件</Text>
                  </Text>
                  <Text className={styles.hotRevenue}>{formatCurrency(product.revenue)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default DashboardPage;
