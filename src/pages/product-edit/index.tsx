import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, Textarea, Image, Switch } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import { ProductCategory, categoryLabels, ProductSpec, PickupTimeSlot } from '../../types/product';
import { defaultPickupSlots, normalizePickupSlots } from '../../data/products';
import { generateId } from '../../utils';
import styles from './index.module.scss';

interface SpecForm {
  id: string;
  name: string;
  price: string;
  stock: string;
}

const ProductEditPage: React.FC = () => {
  const router = useRouter();
  const { products, addProduct, updateProduct } = useApp();

  const editId = router.params?.id;
  const isEdit = !!editId;

  const existingProduct = useMemo(() =>
    products.find(p => p.id === editId), [products, editId]
  );

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('vegetable');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [specs, setSpecs] = useState<SpecForm[]>([
    { id: generateId(), name: '', price: '', stock: '' }
  ]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(defaultPickupSlots.map(s => s.label));
  const [isLimited, setIsLimited] = useState(false);
  const [isOnSale, setIsOnSale] = useState(true);
  const [focusedSpecId, setFocusedSpecId] = useState<string | null>(null);

  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name);
      setCategory(existingProduct.category);
      setDescription(existingProduct.description);
      setImage(existingProduct.image);
      setSpecs(existingProduct.specs.map(s => ({
        id: s.id,
        name: s.name,
        price: String(s.price),
        stock: String(s.stock)
      })));
      setSelectedSlots(existingProduct.pickupSlots.map(s => s.label));
      setIsLimited(existingProduct.isLimited);
      setIsOnSale(existingProduct.isOnSale);
    }
  }, [existingProduct]);

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: isEdit ? '编辑商品' : '上架新商品'
    });
  }, [isEdit]);

  const categoryOptions: Array<{ key: ProductCategory; icon: string; label: string }> = [
    { key: 'vegetable', icon: '🥬', label: categoryLabels.vegetable },
    { key: 'fruit', icon: '🍑', label: categoryLabels.fruit },
    { key: 'handmade', icon: '🍞', label: categoryLabels.handmade },
    { key: 'combo', icon: '🎁', label: categoryLabels.combo }
  ];

  const handleAddSpec = () => {
    setSpecs(prev => [...prev, { id: generateId(), name: '', price: '', stock: '' }]);
  };

  const handleRemoveSpec = (id: string) => {
    if (specs.length <= 1) {
      Taro.showToast({ title: '至少保留一个规格', icon: 'none' });
      return;
    }
    setSpecs(prev => prev.filter(s => s.id !== id));
  };

  const handleSpecChange = (id: string, field: keyof SpecForm, value: string) => {
    setSpecs(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleToggleSlot = (slotLabel: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotLabel)) {
        return prev.filter(l => l !== slotLabel);
      }
      return [...prev, slotLabel];
    });
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      success: (res) => {
        setImage(res.tempFilePaths[0]);
        Taro.showToast({ title: '图片已选择', icon: 'success' });
      },
      fail: () => {
        const fallbackImages: Record<ProductCategory, string> = {
          vegetable: 'https://picsum.photos/id/292/300/300',
          fruit: 'https://picsum.photos/id/326/300/300',
          handmade: 'https://picsum.photos/id/431/300/300',
          combo: 'https://picsum.photos/id/570/300/300'
        };
        setImage(fallbackImages[category]);
        Taro.showToast({ title: '已使用默认图片', icon: 'none' });
      }
    });
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return '请输入商品名称';
    if (name.length > 30) return '商品名称不能超过30字';
    if (!image) return '请选择商品图片';
    const validSpecs = specs.filter(s => s.name.trim() && s.price && s.stock);
    if (validSpecs.length === 0) return '请至少填写一个完整规格';
    for (const s of specs) {
      if (s.name.trim() || s.price || s.stock) {
        if (!s.name.trim()) return '请填写规格名称';
        if (!s.price || isNaN(Number(s.price)) || Number(s.price) <= 0) return '请输入有效的价格';
        if (!s.stock || isNaN(Number(s.stock)) || Number(s.stock) < 0) return '请输入有效的库存';
      }
    }
    if (selectedSlots.length === 0) return '请至少选择一个取货时段';
    return null;
  };

  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      Taro.showToast({ title: error, icon: 'none' });
      return;
    }

    const validSpecs: ProductSpec[] = specs
      .filter(s => s.name.trim())
      .map(s => ({
        id: s.id,
        name: s.name.trim(),
        price: Number(s.price),
        stock: Number(s.stock),
        originalStock: isEdit
          ? (existingProduct?.specs.find(es => es.id === s.id)?.originalStock ?? Number(s.stock))
          : Number(s.stock)
      }));

    const pickupSlots: PickupTimeSlot[] = normalizePickupSlots(
      defaultPickupSlots.filter(s => selectedSlots.includes(s.label))
    );

    const productData = {
      name: name.trim(),
      category,
      image,
      description: description.trim(),
      specs: validSpecs,
      pickupSlots,
      isLimited,
      isOnSale
    };

    if (isEdit && existingProduct) {
      updateProduct(existingProduct.id, productData);
      Taro.showToast({ title: '更新成功', icon: 'success' });
    } else {
      addProduct(productData);
      Taro.showToast({ title: '上架成功', icon: 'success' });
    }

    setTimeout(() => {
      Taro.navigateBack();
    }, 800);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const canSubmit = useMemo(() => {
    return name.trim().length > 0
      && specs.some(s => s.name.trim() && s.price && s.stock)
      && selectedSlots.length > 0;
  }, [name, specs, selectedSlots]);

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.heroSection}>
          <Text className={styles.heroTitle}>
            {isEdit ? '✏️ 编辑商品' : '🌿 上架新商品'}
          </Text>
          <Text className={styles.heroSubtitle}>
            {isEdit ? '更新商品信息，让顾客看到最新状态' : '填写商品信息，开启本周预订'}
          </Text>
        </View>

        <View className={styles.formCard}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>基本信息</Text>
          </View>

          <View className={styles.formGroup}>
            <Text className={`${styles.formLabel} ${styles.formLabelRequired}`}>商品名称</Text>
            <Input
              className={styles.formInput}
              placeholder="如：有机西红柿、手工酒酿"
              value={name}
              onInput={e => setName(e.detail.value)}
              maxlength={30}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={`${styles.formLabel} ${styles.formLabelRequired}`}>商品分类</Text>
            <View className={styles.categoryGrid}>
              {categoryOptions.map(opt => (
                <View
                  key={opt.key}
                  className={`${styles.categoryItem} ${category === opt.key ? styles.categoryItemActive : ''}`}
                  onClick={() => setCategory(opt.key)}
                >
                  <Text className={styles.categoryIcon}>{opt.icon}</Text>
                  <Text className={`${styles.categoryLabel} ${category === opt.key ? styles.categoryLabelActive : ''}`}>
                    {opt.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={`${styles.formLabel} ${styles.formLabelRequired}`}>商品图片</Text>
            <View className={styles.imagePicker} onClick={handleChooseImage}>
              {image ? (
                <Image className={styles.previewImage} src={image} mode="aspectFill" />
              ) : (
                <>
                  <Text className={styles.imagePickerIcon}>📷</Text>
                  <Text className={styles.imagePickerText}>点击上传图片</Text>
                </>
              )}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>商品描述</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="描述商品特点、产地、保存方式等，帮助顾客了解商品"
              value={description}
              onInput={e => setDescription(e.detail.value)}
              maxlength={200}
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>规格设置</Text>
          </View>

          <View className={styles.specList}>
            {specs.map((spec, idx) => (
              <View
                key={spec.id}
                className={`${styles.specItem} ${focusedSpecId === spec.id ? styles.specItemFocused : ''}`}
              >
                <View className={styles.specRow}>
                  <View className={styles.specField} style={{ flex: 2 }}>
                    <Text className={styles.specFieldLabel}>规格 {idx + 1} 名称</Text>
                    <Input
                      className={styles.specInput}
                      placeholder="如：500g/份"
                      value={spec.name}
                      onFocus={() => setFocusedSpecId(spec.id)}
                      onBlur={() => setFocusedSpecId(null)}
                      onInput={e => handleSpecChange(spec.id, 'name', e.detail.value)}
                    />
                  </View>
                  {specs.length > 1 && (
                    <View
                      className={styles.specRemoveBtn}
                      onClick={() => handleRemoveSpec(spec.id)}
                    >
                      ×
                    </View>
                  )}
                </View>
                <View className={styles.specRow}>
                  <View className={styles.specField}>
                    <Text className={styles.specFieldLabel}>价格 (元)</Text>
                    <Input
                      className={styles.specInput}
                      type="digit"
                      placeholder="0.00"
                      value={spec.price}
                      onFocus={() => setFocusedSpecId(spec.id)}
                      onBlur={() => setFocusedSpecId(null)}
                      onInput={e => handleSpecChange(spec.id, 'price', e.detail.value.replace(/[^\d.]/g, ''))}
                    />
                  </View>
                  <View className={styles.specField}>
                    <Text className={styles.specFieldLabel}>库存数量</Text>
                    <Input
                      className={styles.specInput}
                      type="number"
                      placeholder="0"
                      value={spec.stock}
                      onFocus={() => setFocusedSpecId(spec.id)}
                      onBlur={() => setFocusedSpecId(null)}
                      onInput={e => handleSpecChange(spec.id, 'stock', e.detail.value.replace(/\D/g, ''))}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View className={styles.addSpecBtn} onClick={handleAddSpec}>
            + 添加规格
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>取货时段</Text>
          </View>

          <View className={styles.slotList}>
            {defaultPickupSlots.map(slot => (
              <View
                key={slot.id}
                className={`${styles.slotItem} ${selectedSlots.includes(slot.label) ? styles.slotItemActive : ''}`}
                onClick={() => handleToggleSlot(slot.label)}
              >
                <View className={`${styles.slotCheckbox} ${selectedSlots.includes(slot.label) ? styles.slotCheckboxActive : ''}`}>
                  {selectedSlots.includes(slot.label) && (
                    <Text className={styles.slotCheckIcon}>✓</Text>
                  )}
                </View>
                <Text className={`${styles.slotLabel} ${selectedSlots.includes(slot.label) ? styles.slotLabelActive : ''}`}>
                  {slot.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.cardHeader}>
            <View className={styles.cardHeaderBar} />
            <Text className={styles.cardHeaderTitle}>其他设置</Text>
          </View>

          <View className={styles.switchRow}>
            <View className={styles.switchInfo}>
              <Text className={styles.switchLabel}>立即上架</Text>
              <Text className={styles.switchDesc}>开启后顾客可立即预订此商品</Text>
            </View>
            <Switch checked={isOnSale} onChange={e => setIsOnSale(e.detail.value)} color="#4CAF50" />
          </View>

          <View className={styles.switchRow}>
            <View className={styles.switchInfo}>
              <Text className={styles.switchLabel}>限量商品</Text>
              <Text className={styles.switchDesc}>标记为限量后会显示限量标识，吸引顾客</Text>
            </View>
            <Switch checked={isLimited} onChange={e => setIsLimited(e.detail.value)} color="#4CAF50" />
          </View>
        </View>
      </View>

      <View className={styles.footerBar}>
        <View className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </View>
        <View
          className={`${styles.saveBtn} ${!canSubmit ? styles.saveBtnDisabled : ''}`}
          onClick={canSubmit ? handleSubmit : undefined}
        >
          {isEdit ? '保存修改' : '确认上架'}
        </View>
      </View>
    </View>
  );
};

export default ProductEditPage;
