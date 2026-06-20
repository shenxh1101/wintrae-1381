import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  moreText?: string;
  onMore?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, moreText, onMore }) => {
  return (
    <View className={styles.sectionHeader}>
      <View className={styles.left}>
        <View className={styles.accentBar} />
        <Text className={styles.title}>{title}</Text>
        {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
      </View>
      {(moreText || onMore) && (
        <View className={styles.right} onClick={onMore}>
          {moreText && <Text className={styles.moreText}>{moreText}</Text>}
          <Text className={styles.moreIcon}>›</Text>
        </View>
      )}
    </View>
  );
};

export default SectionHeader;
