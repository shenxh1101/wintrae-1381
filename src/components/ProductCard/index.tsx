import React, { useState } from 'react';
import { View, Text, Image, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { Product, categoryLabels, categoryColorMap } from '../../types/product';
import { getStockStatus, formatCurrency } from '../../utils';
import { useApp } from '../../store/AppContext';
import styles from './index.module.scss';

interface ProductCardProps {
  product: Product;
  showEdit?: boolean;
  showStockAdjust?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showEdit = true, showStockAdjust = true }) => {
  const { toggleProductSale, updateSpecStock } = useApp();
  const [adjustingSpecId, setAdjustingSpecId] = useState<string | null>(null);
  const [adjustStock, setAdjustStock] = useState<string>('');

  const handleToggleSale = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleProductSale(product.id);
    Taro.showToast({
      title: product.isOnSale ? '已下架' : '已上架',
      icon: 'success'
    });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    Taro.navigateTo({
      url: `/pages/product-edit/index?id=${product.id}`
    });
  };

  const handleStartAdjust = (specId: string, currentStock: number) => {
    setAdjustingSpecId(specId);
    setAdjustStock(String(currentStock));
  };

  const handleConfirmAdjust = (specId: string) => {
    const newStock = parseInt(adjustStock) || 0;
    updateSpecStock(product.id, specId, newStock);
    setAdjustingSpecId(null);
    Taro.showToast({ title: '库存已更新', icon: 'success' });
  };

  const handleAdjustChange = (delta: number, originalStock: number) => {
    const current = parseInt(adjustStock) || 0;
    setAdjustStock(String(Math.max(0, Math.min(originalStock, current + delta))));
  };

  return (
    <View className={styles.productCard}>
      <View className={styles.header}>
        <Image
          className={styles.image}
          src={product.image}
          mode="aspectFill"
          onError={(e) => console.error('[ProductCard] image load error:', e)}
        />
        <View className={styles.info}>
          <View>
            <View className={styles.topRow}>
              <Text className={styles.name}>{product.name}</Text>
              <View className={classnames(styles.categoryTag)} style={{ backgroundColor: categoryColorMap[product.category] }}>
                {categoryLabels[product.category]}
              </View>
            </View>
            <View className={styles.tagRow}>
              {product.isLimited && <Text className={styles.limitedTag}>限量</Text>}
              {!product.isOnSale && <Text className={styles.offTag}>已下架</Text>}
            </View>
          </View>
          <Text className={styles.description}>{product.description}</Text>
        </View>
      </View>

      <View className={styles.specsContainer}>
        <Text className={styles.specsTitle}>规格与库存</Text>
        {product.specs.map((spec) => {
          const stockStatus = getStockStatus(spec.stock, spec.originalStock);
          const isAdjusting = adjustingSpecId === spec.id;
          return (
            <View key={spec.id} className={styles.specItem}>
              <View className={styles.specLeft}>
                <Text className={styles.specName}>{spec.name}</Text>
                <View className={styles.specStock}>
                  <Text className={styles.specPrice}>{formatCurrency(spec.price)}</Text>
                  <Text style={{ margin: '0 16rpx', color: '#E5E6EB' }}>|</Text>
                  <Text className={classnames(styles.stockText, {
                    [styles.stockNormal]: stockStatus === 'normal',
                    [styles.stockWarn]: stockStatus === 'warn',
                    [styles.stockOut]: stockStatus === 'out'
                  })}>
                    库存：{spec.stock}/{spec.originalStock}
                    {stockStatus === 'warn' && ' (紧张)'}
                    {stockStatus === 'out' && ' (售罄)'}
                  </Text>
                </View>
              </View>
              {showStockAdjust && (
                <View className={styles.specActions}>
                  {!isAdjusting ? (
                    <Button
                      className={classnames(styles.btn, styles.btnOutline)}
                      onClick={() => handleStartAdjust(spec.id, spec.stock)}
                    >
                      调库存
                    </Button>
                  ) : (
                    <>
                      <Button
                        className={styles.stockBtn}
                        onClick={() => handleAdjustChange(-1, spec.originalStock)}
                      >
                        -
                      </Button>
                      <Input
                        className={styles.stockInput}
                        type="number"
                        value={adjustStock}
                        onInput={(e) => setAdjustStock(e.detail.value)}
                      />
                      <Button
                        className={styles.stockBtn}
                        onClick={() => handleAdjustChange(1, spec.originalStock)}
                      >
                        +
                      </Button>
                      <Button
                        className={classnames(styles.btn, styles.btnPrimary)}
                        onClick={() => handleConfirmAdjust(spec.id)}
                      >
                        确定
                      </Button>
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View className={styles.footer}>
        <Text className={styles.salesInfo}>销量 {product.salesCount} 件</Text>
        <View className={styles.actions}>
          {showEdit && (
            <Button className={classnames(styles.btn, styles.btnOutline)} onClick={handleEdit}>
              编辑
            </Button>
          )}
          <Button
            className={classnames(styles.btn, product.isOnSale ? styles.btnGray : styles.btnSecondary)}
            onClick={handleToggleSale}
          >
            {product.isOnSale ? '下架' : '上架'}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default ProductCard;
