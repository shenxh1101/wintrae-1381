import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import SearchBar from '../../components/SearchBar';
import ProductCard from '../../components/ProductCard';
import { ProductCategory, categoryLabels } from '../../types/product';
import styles from './index.module.scss';

type SaleFilter = 'all' | 'onSale' | 'offSale';

const ProductsPage: React.FC = () => {
  const { products } = useApp();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[Products] didShow, total products:', products.length);
  });

  usePullDownRefresh(() => {
    console.log('[Products] pullDownRefresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (saleFilter === 'onSale' && !p.isOnSale) return false;
      if (saleFilter === 'offSale' && p.isOnSale) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchText && !p.name.includes(searchText)) return false;
      return true;
    });
  }, [products, saleFilter, categoryFilter, searchText]);

  const summary = useMemo(() => {
    const onSale = products.filter(p => p.isOnSale).length;
    const offSale = products.filter(p => !p.isOnSale).length;
    const lowStock = products.filter(p =>
      p.specs.some(s => s.stock > 0 && s.stock / s.originalStock <= 0.2)
    ).length;
    return { total: products.length, onSale, offSale, lowStock };
  }, [products]);

  const handleAddProduct = () => {
    console.log('[Products] addProduct');
    Taro.navigateTo({ url: '/pages/product-edit/index' });
  };

  const categories: Array<{ key: ProductCategory | 'all'; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'vegetable', label: categoryLabels.vegetable },
    { key: 'fruit', label: categoryLabels.fruit },
    { key: 'handmade', label: categoryLabels.handmade },
    { key: 'combo', label: categoryLabels.combo }
  ];

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.topSection}>
          <Text className={styles.pageTitle}>商品管理</Text>
          <View style={{ marginBottom: '24rpx' }}>
            <SearchBar
              value={searchText}
              onChange={setSearchText}
              placeholder="搜索商品名称..."
            />
          </View>
          <ScrollView scrollX className="filterScroll" style={{ whiteSpace: 'nowrap' }}>
            <View className={styles.filterRow}>
              {categories.map(cat => (
                <View
                  key={cat.key}
                  className={`${styles.filterChip} ${categoryFilter === cat.key ? styles.filterChipActive : ''}`}
                  onClick={() => setCategoryFilter(cat.key)}
                >
                  {cat.label}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className={styles.summaryBar}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{summary.total}</Text>
            <Text className={styles.summaryLabel}>全部商品</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={`${styles.summaryValue} ${styles.summaryValueGreen}`}>{summary.onSale}</Text>
            <Text className={styles.summaryLabel}>在售中</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={`${styles.summaryValue} ${styles.summaryValueGray}`}>{summary.offSale}</Text>
            <Text className={styles.summaryLabel}>已下架</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={`${styles.summaryValue} ${styles.summaryValueOrange}`}>{summary.lowStock}</Text>
            <Text className={styles.summaryLabel}>低库存</Text>
          </View>
        </View>

        <View className={styles.toggleSection}>
          <View
            className={`${styles.toggleItem} ${saleFilter === 'all' ? styles.toggleItemActive : ''}`}
            onClick={() => setSaleFilter('all')}
          >
            全部状态
          </View>
          <View
            className={`${styles.toggleItem} ${saleFilter === 'onSale' ? styles.toggleItemActive : ''}`}
            onClick={() => setSaleFilter('onSale')}
          >
            在售中
          </View>
          <View
            className={`${styles.toggleItem} ${saleFilter === 'offSale' ? styles.toggleItemActive : ''}`}
            onClick={() => setSaleFilter('offSale')}
          >
            已下架
          </View>
        </View>

        <ScrollView scrollY style={{ height: 'calc(100vh - 580rpx)' }}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🥬</Text>
              <Text className={styles.emptyText}>暂无商品，快去上架吧</Text>
              <Button className={styles.emptyBtn} onClick={handleAddProduct}>
                + 上架商品
              </Button>
            </View>
          )}
        </ScrollView>
      </View>

      <View className={styles.addFab} onClick={handleAddProduct}>
        <Text className={styles.addFabText}>＋</Text>
      </View>
    </View>
  );
};

export default ProductsPage;
