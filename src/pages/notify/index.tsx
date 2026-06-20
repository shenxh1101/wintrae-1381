import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Button, ScrollView, Checkbox, CheckboxGroup } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import { mockTemplates } from '../../data/notifications';
import { NotificationType, NotificationTarget, notificationTypeLabels, notificationTargetLabels, SelectedCustomer } from '../../types/notification';
import { timeAgo } from '../../utils';
import styles from './index.module.scss';

const NotifyPage: React.FC = () => {
  const { notifications, bookings, addNotification } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationType>('open');
  const [title, setTitle] = useState(mockTemplates[0].title);
  const [content, setContent] = useState(mockTemplates[0].content);
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<NotificationType | 'all'>('all');
  const [historyTargetFilter, setHistoryTargetFilter] = useState<NotificationTarget | 'all'>('all');

  useDidShow(() => {
    console.log('[Notify] didShow');
  });

  usePullDownRefresh(() => {
    console.log('[Notify] pullDownRefresh');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 800);
  });

  const allCustomers = useMemo<SelectedCustomer[]>(() => {
    const customerMap = new Map<string, SelectedCustomer>();
    bookings.forEach(b => {
      const key = b.customerPhone;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: key,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          bookingId: b.id,
          pickupCode: b.pickupCode
        });
      }
    });
    return Array.from(customerMap.values());
  }, [bookings]);

  const selectedCustomers = useMemo(() => {
    return allCustomers.filter(c => selectedCustomerIds.includes(c.customerId));
  }, [allCustomers, selectedCustomerIds]);

  const targetCounts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending' || b.status === 'partial').length,
      picked: bookings.filter(b => b.status === 'picked').length,
      specific: selectedCustomerIds.length
    };
  }, [bookings, selectedCustomerIds.length]);

  const filteredPickerCustomers = useMemo(() => {
    if (!pickerSearch.trim()) return allCustomers;
    const kw = pickerSearch.toLowerCase();
    return allCustomers.filter(c =>
      c.customerName.toLowerCase().includes(kw)
      || c.customerPhone.includes(kw)
      || c.pickupCode.includes(kw)
    );
  }, [allCustomers, pickerSearch]);

  const templates = [
    { type: 'open' as NotificationType, icon: '🌿', label: '开摊提醒', desc: '通知顾客今日已开摊，可前往取货' },
    { type: 'outOfStock' as NotificationType, icon: '⚠️', label: '缺货说明', desc: '通知部分商品缺货，可替换或退款' },
    { type: 'close' as NotificationType, icon: '🌙', label: '收摊通知', desc: '提醒未取货顾客尽快取货' },
    { type: 'custom' as NotificationType, icon: '✏️', label: '自定义', desc: '自由编辑消息内容和收件人' }
  ];

  const handleSelectTemplate = (type: NotificationType) => {
    console.log('[Notify] selectTemplate:', type);
    setSelectedTemplate(type);
    const tpl = mockTemplates.find(t => t.type === type);
    if (tpl) {
      setTitle(tpl.title);
      setContent(tpl.content);
      if (type !== 'custom') {
        if (tpl.target !== 'specific') {
          setTarget(tpl.target);
        }
      }
    } else {
      setTitle('');
      setContent('');
    }
  };

  const handleTargetChange = (t: NotificationTarget) => {
    setTarget(t);
    if (t === 'specific' && !showCustomerPicker) {
      setTimeout(() => setShowCustomerPicker(true), 50);
    }
  };

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleAllCustomers = () => {
    const list = filteredPickerCustomers;
    const allSelected = list.every(c => selectedCustomerIds.includes(c.customerId));
    if (allSelected) {
      const excludeIds = new Set(list.map(c => c.customerId));
      setSelectedCustomerIds(prev => prev.filter(id => !excludeIds.has(id)));
    } else {
      const set = new Set(selectedCustomerIds);
      list.forEach(c => set.add(c.customerId));
      setSelectedCustomerIds(Array.from(set));
    }
  };

  const openPickerFromChip = () => {
    if (target !== 'specific') {
      setTarget('specific');
    }
    setTimeout(() => setShowCustomerPicker(true), 50);
  };

  const handleConfirmPicker = () => {
    if (selectedCustomerIds.length === 0) {
      Taro.showToast({ title: '请至少选择一位顾客', icon: 'none' });
      return;
    }
    setShowCustomerPicker(false);
    Taro.showToast({ title: `已选择 ${selectedCustomerIds.length} 位顾客`, icon: 'success' });
  };

  const handleSend = () => {
    console.log('[Notify] send message:', { title, content, target, selectedTemplate });
    if (!title.trim()) {
      Taro.showToast({ title: '请输入消息标题', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      Taro.showToast({ title: '请输入消息内容', icon: 'none' });
      return;
    }
    if (targetCounts[target] === 0) {
      if (target === 'specific') {
        Taro.showToast({ title: '请先选择要发送的顾客', icon: 'none' });
        setTimeout(() => setShowCustomerPicker(true), 300);
      } else {
        Taro.showToast({ title: '当前分组暂无顾客', icon: 'none' });
      }
      return;
    }

    const finalCount = targetCounts[target];
    const finalCustomers = target === 'specific' ? selectedCustomers : undefined;

    Taro.showModal({
      title: '确认发送',
      content: `将向「${notificationTargetLabels[target]}」(${finalCount}人) 发送此消息？${target === 'specific' && finalCustomers ? '\n' + finalCustomers.slice(0, 3).map(c => '• ' + c.customerName).join('\n') + (finalCustomers.length > 3 ? `\n等${finalCustomers.length}人` : '') : ''}`,
      confirmText: '确认发送',
      confirmColor: '#9C27B0',
      success: (res) => {
        if (res.confirm) {
          addNotification({
            type: selectedTemplate,
            title: title.trim(),
            content: content.trim(),
            target,
            targetCount: finalCount,
            targetCustomers: finalCustomers
          });
          Taro.showToast({ title: `已发送给 ${finalCount} 人`, icon: 'success' });
          if (selectedTemplate !== 'custom') {
            setTitle('');
            setContent('');
            setSelectedTemplate('custom');
          }
        }
      }
    });
  };

  const handleResend = (record: typeof notifications[0]) => {
    console.log('[Notify] resend:', record.id);
    setSelectedTemplate(record.type);
    setTitle(record.title);
    setContent(record.content);
    setTarget(record.target);
    if (record.target === 'specific' && record.targetCustomers) {
      setSelectedCustomerIds(record.targetCustomers.map(c => c.customerId));
    }
    Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
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

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (historyTypeFilter !== 'all' && n.type !== historyTypeFilter) return false;
      if (historyTargetFilter !== 'all' && n.target !== historyTargetFilter) return false;
      return true;
    });
  }, [notifications, historyTypeFilter, historyTargetFilter]);

  const historyTypeTabs = useMemo(() => {
    const tabs: Array<{ key: NotificationType | 'all'; label: string; count: number }> = [
      { key: 'all', label: '全部', count: notifications.length }
    ];
    (['open', 'outOfStock', 'close', 'custom'] as NotificationType[]).forEach(t => {
      tabs.push({ key: t, label: notificationTypeLabels[t], count: notifications.filter(n => n.type === t).length });
    });
    return tabs;
  }, [notifications]);

  const historyTargetTabs = useMemo(() => {
    const tabs: Array<{ key: NotificationTarget | 'all'; label: string; count: number }> = [
      { key: 'all', label: '全部对象', count: notifications.length }
    ];
    (['all', 'pending', 'picked', 'specific'] as NotificationTarget[]).forEach(t => {
      const c = notifications.filter(n => n.target === t).length;
      if (c > 0 || t !== 'all') {
        const exists = tabs.find(tab => tab.key === t);
        if (!exists) {
          tabs.push({ key: t, label: notificationTargetLabels[t], count: c });
        } else {
          exists.count = notifications.length;
        }
      }
    });
    return tabs;
  }, [notifications]);

  const openNotificationDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/notification-detail/index?id=${id}` });
  };

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.heroSection}>
          <Text className={styles.heroTitle}>📢 顾客通知</Text>
          <Text className={styles.heroSubtitle}>批量发送开摊提醒、缺货说明和收摊通知</Text>
        </View>

        <View className={styles.templateSection}>
          <Text className={styles.sectionTitle}>选择消息模板</Text>
          <View className={styles.templateGrid}>
            {templates.map(tpl => (
              <View
                key={tpl.type}
                className={`${styles.templateCard} ${selectedTemplate === tpl.type ? styles.templateCardActive : ''}`}
                onClick={() => handleSelectTemplate(tpl.type)}
              >
                <View className={`${styles.templateIcon} ${
                  tpl.type === 'open' ? styles.iconOpen :
                  tpl.type === 'outOfStock' ? styles.iconStock :
                  tpl.type === 'close' ? styles.iconClose : styles.iconCustom
                }`}>
                  {tpl.icon}
                </View>
                <Text className={styles.templateName}>{tpl.label}</Text>
                <Text className={styles.templateDesc}>{tpl.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.composeCard}>
          <Text className={styles.formLabel}>
            <Text className={styles.requiredStar}>*</Text>消息标题
          </Text>
          <Input
            className={styles.formInput}
            placeholder="请输入消息标题"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={30}
          />

          <Text className={styles.formLabel}>
            <Text className={styles.requiredStar}>*</Text>消息内容
          </Text>
          <Textarea
            className={styles.formTextarea}
            placeholder="请输入消息内容，可编辑模板文字..."
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={500}
          />
          <Text className={styles.charCount}>{content.length}/500</Text>

          <View className={styles.targetSection}>
            <Text className={styles.formLabel}>
              <Text className={styles.requiredStar}>*</Text>发送对象
            </Text>
            <View className={styles.targetOptions}>
              {(['all', 'pending', 'picked', 'specific'] as NotificationTarget[]).map(t => (
                <View
                  key={t}
                  className={`${styles.targetOption} ${target === t ? styles.targetOptionActive : ''} ${t === 'specific' ? styles.targetOptionSpecial : ''}`}
                  onClick={() => handleTargetChange(t)}
                >
                  <View style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8rpx' }}>
                    {notificationTargetLabels[t]}
                    {t !== 'specific' && (
                      <Text className={styles.targetCount}>{targetCounts[t]}人</Text>
                    )}
                  </View>
                  {t === 'specific' && (
                    <Text className={`${styles.targetCount} ${selectedCustomerIds.length > 0 ? styles.targetCountActive : ''}`} style={{ marginLeft: '8rpx' }}>
                      {selectedCustomerIds.length > 0 ? `已选${selectedCustomerIds.length}人` : '点击选择'}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {target === 'specific' && selectedCustomers.length > 0 && (
              <View className={styles.selectedChips}>
                {selectedCustomers.slice(0, 6).map(c => (
                  <View key={c.customerId} className={styles.customerChip}>
                    <Text>{c.customerName}</Text>
                    <Text className={styles.chipRemove} onClick={(e) => { e.stopPropagation(); toggleCustomer(c.customerId); }}>×</Text>
                  </View>
                ))}
                {selectedCustomers.length > 6 && (
                  <View className={styles.customerChip}>
                    <Text>+{selectedCustomers.length - 6}</Text>
                  </View>
                )}
                <View className={styles.chipEditBtn} onClick={openPickerFromChip}>
                  编辑
                </View>
              </View>
            )}
          </View>

          <Button
            className={styles.sendBtn}
            disabled={!title.trim() || !content.trim() || targetCounts[target] === 0}
            onClick={handleSend}
          >
            📤 {targetCounts[target] > 0 ? `发送给 ${targetCounts[target]} 人` : '发送消息'}
          </Button>
        </View>

        <View className={styles.historySection}>
          <Text className={styles.sectionTitle}>发送记录</Text>
          <View className={styles.filterTabsRow}>
            <ScrollView scrollX className={styles.filterTabsScroll}>
              <View className={styles.filterTabs}>
                {historyTypeTabs.map(tab => (
                  <View
                    key={tab.key}
                    className={`${styles.filterTab} ${historyTypeFilter === tab.key ? styles.filterTabActive : ''}`}
                    onClick={() => setHistoryTypeFilter(tab.key)}
                  >
                    <Text>{tab.label}</Text>
                    {tab.count > 0 && (
                      <Text className={`${styles.filterTabCount} ${historyTypeFilter === tab.key ? styles.filterTabCountActive : ''}`}>
                        {tab.count}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          <View className={styles.filterTabsRow}>
            <View className={styles.filterTabs}>
              {historyTargetTabs.map(tab => (
                <View
                  key={tab.key}
                  className={`${styles.filterTab} ${styles.filterTabSmall} ${historyTargetFilter === tab.key ? styles.filterTabActive : ''}`}
                  onClick={() => setHistoryTargetFilter(tab.key)}
                >
                  <Text>{tab.label}</Text>
                  <Text className={`${styles.filterTabCount} ${historyTargetFilter === tab.key ? styles.filterTabCountActive : ''}`}>
                    {tab.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <ScrollView scrollY style={{ maxHeight: '600rpx' }}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(record => (
                <View key={record.id} className={styles.historyItem} onClick={() => openNotificationDetail(record.id)}>
                  <View className={`${styles.historyTypeBar} ${getTypeColorClass(record.type)}`} />
                  <View className={styles.historyHeader}>
                    <Text className={styles.historyTitle}>{record.title}</Text>
                    <Text className={`${styles.statusBadge} ${styles.statusSuccess}`}>✓ 已发送</Text>
                  </View>
                  <Text className={styles.historyContent}>{record.content}</Text>
                  {record.target === 'specific' && record.targetCustomers && record.targetCustomers.length > 0 && (
                    <View className={styles.historyReceivers}>
                      👥 {record.targetCustomers.slice(0, 5).map(c => c.customerName).join('、')}
                      {record.targetCustomers.length > 5 ? ` 等${record.targetCustomers.length}人` : ''}
                    </View>
                  )}
                  <View className={styles.historyMeta}>
                    <View className={styles.metaLeft}>
                      <Text className={styles.metaItem}>
                        类型: {notificationTypeLabels[record.type]}
                      </Text>
                      <Text className={styles.metaItem}>
                        {notificationTargetLabels[record.target]} · {record.targetCount}人
                      </Text>
                      <Text className={styles.metaItem}>
                        {timeAgo(record.sentAt)}
                      </Text>
                    </View>
                    <View className={styles.historyActions}>
                      <Text className={styles.viewDetailBtn}>查看详情 →</Text>
                      <Button
                        className={styles.resendBtn}
                        onClick={(e) => { e.stopPropagation(); handleResend(record); }}
                      >
                        再次发送
                      </Button>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: '80rpx 0', textAlign: 'center' }}>
                <Text style={{ fontSize: '100rpx', opacity: 0.5 }}>📭</Text>
                <View style={{ height: '24rpx' }} />
                <Text style={{ fontSize: '28rpx', color: '#86909C' }}>
                  {(historyTypeFilter !== 'all' || historyTargetFilter !== 'all')
                    ? '当前筛选条件下暂无记录'
                    : '暂无发送记录'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {showCustomerPicker && (
        <View className={styles.modalMask} onClick={() => setShowCustomerPicker(false)}>
          <View className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>选择顾客</Text>
              <Text className={styles.modalClose} onClick={() => setShowCustomerPicker(false)}>×</Text>
            </View>

            <View className={styles.modalSearch}>
              <Input
                className={styles.modalSearchInput}
                placeholder="搜索姓名/手机号/取货码..."
                value={pickerSearch}
                onInput={e => setPickerSearch(e.detail.value)}
              />
            </View>

            <View className={styles.pickerToolbar}>
              <CheckboxGroup>
                <Checkbox
                  value="__all__"
                  checked={filteredPickerCustomers.length > 0 && filteredPickerCustomers.every(c => selectedCustomerIds.includes(c.customerId))}
                  onChange={toggleAllCustomers}
                  color="#9C27B0"
                />
                <Text style={{ marginLeft: '12rpx', fontSize: '26rpx', color: '#4E5969' }}>
                  全选当前 ({filteredPickerCustomers.length})
                </Text>
              </CheckboxGroup>
              <Text style={{ fontSize: '26rpx', color: '#1D2129' }}>
                已选 <Text style={{ color: '#9C27B0', fontWeight: 600 }}>{selectedCustomerIds.length}</Text> / {allCustomers.length}
              </Text>
            </View>

            <ScrollView scrollY style={{ height: '60vh' }}>
              {filteredPickerCustomers.length > 0 ? (
                filteredPickerCustomers.map(c => (
                  <View
                    key={c.customerId}
                    className={`${styles.customerItem} ${selectedCustomerIds.includes(c.customerId) ? styles.customerItemActive : ''}`}
                    onClick={() => toggleCustomer(c.customerId)}
                  >
                    <View className={styles.customerAvatar}>
                      {c.customerName.charAt(0)}
                    </View>
                    <View className={styles.customerInfo}>
                      <Text className={styles.customerName}>{c.customerName}</Text>
                      <Text className={styles.customerMeta}>
                        📱 {c.customerPhone} · 取货码 {c.pickupCode}
                      </Text>
                    </View>
                    <View className={`${styles.checkBox} ${selectedCustomerIds.includes(c.customerId) ? styles.checkBoxActive : ''}`}>
                      {selectedCustomerIds.includes(c.customerId) && <Text style={{ color: '#fff', fontSize: '24rpx', fontWeight: 700 }}>✓</Text>}
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ padding: '80rpx 0', textAlign: 'center' }}>
                  <Text style={{ fontSize: '80rpx', opacity: 0.4 }}>🔍</Text>
                  <View style={{ height: '16rpx' }} />
                  <Text style={{ fontSize: '26rpx', color: '#86909C' }}>
                    {pickerSearch ? '没有匹配的顾客' : '暂无订单顾客数据'}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View className={styles.modalFooter}>
              <View className={styles.modalCancelBtn} onClick={() => setShowCustomerPicker(false)}>
                取消
              </View>
              <View className={styles.modalConfirmBtn} onClick={handleConfirmPicker}>
                确认选择 ({selectedCustomerIds.length})
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default NotifyPage;
