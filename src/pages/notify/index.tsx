import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Button, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import { useApp } from '../../store/AppContext';
import { mockTemplates } from '../../data/notifications';
import { NotificationType, NotificationTarget, notificationTypeLabels, notificationTargetLabels } from '../../types/notification';
import { timeAgo } from '../../utils';
import styles from './index.module.scss';

const NotifyPage: React.FC = () => {
  const { notifications, bookings, addNotification } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationType>('open');
  const [title, setTitle] = useState(mockTemplates[0].title);
  const [content, setContent] = useState(mockTemplates[0].content);
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [refreshing, setRefreshing] = useState(false);

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

  const targetCounts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      picked: bookings.filter(b => b.status === 'picked' || b.status === 'partial').length,
      specific: 0
    };
  }, [bookings]);

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
        setTarget(tpl.target);
      }
    } else {
      setTitle('');
      setContent('');
    }
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
    if (targetCounts[target] === 0 && target !== 'specific') {
      Taro.showToast({ title: '当前分组暂无顾客', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认发送',
      content: `将向「${notificationTargetLabels[target]}」(${targetCounts[target] || '待定'}人) 发送此消息？`,
      confirmText: '确认发送',
      confirmColor: '#9C27B0',
      success: (res) => {
        if (res.confirm) {
          addNotification({
            type: selectedTemplate,
            title: title.trim(),
            content: content.trim(),
            target,
            targetCount: targetCounts[target]
          });
          Taro.showToast({ title: '发送成功', icon: 'success' });
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
                  className={`${styles.targetOption} ${target === t ? styles.targetOptionActive : ''}`}
                  onClick={() => setTarget(t)}
                >
                  {notificationTargetLabels[t]}
                  {t !== 'specific' && (
                    <Text className={styles.targetCount}>{targetCounts[t]}人</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <Button
            className={styles.sendBtn}
            disabled={!title.trim() || !content.trim()}
            onClick={handleSend}
          >
            📤 发送消息
          </Button>
        </View>

        <View className={styles.historySection}>
          <Text className={styles.sectionTitle}>发送记录</Text>
          <ScrollView scrollY style={{ maxHeight: '600rpx' }}>
            {notifications.length > 0 ? (
              notifications.map(record => (
                <View key={record.id} className={styles.historyItem}>
                  <View className={`${styles.historyTypeBar} ${getTypeColorClass(record.type)}`} />
                  <View className={styles.historyHeader}>
                    <Text className={styles.historyTitle}>{record.title}</Text>
                    <Text className={`${styles.statusBadge} ${styles.statusSuccess}`}>✓ 已发送</Text>
                  </View>
                  <Text className={styles.historyContent}>{record.content}</Text>
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
                    <Button
                      className={styles.resendBtn}
                      onClick={() => handleResend(record)}
                    >
                      再次发送
                    </Button>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ padding: '80rpx 0', textAlign: 'center' }}>
                <Text style={{ fontSize: '100rpx', opacity: 0.5 }}>📭</Text>
                <View style={{ height: '24rpx' }} />
                <Text style={{ fontSize: '28rpx', color: '#86909C' }}>暂无发送记录</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default NotifyPage;
