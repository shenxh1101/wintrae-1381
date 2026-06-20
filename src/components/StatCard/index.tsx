import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
  suffix?: string;
  subText?: string;
  trend?: number;
  variant?: 'green' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  suffix,
  subText,
  trend,
  variant = 'green'
}) => {
  return (
    <View className={classnames(styles.statCard, variant === 'orange' && styles.statCardOrange)}>
      <View className={styles.header}>
        <View className={classnames(styles.iconBox, variant === 'green' ? styles.iconGreen : styles.iconOrange)}>
          <Text>{icon}</Text>
        </View>
        <Text className={styles.label}>{label}</Text>
      </View>
      <View>
        <Text className={styles.value}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix && <Text className={styles.suffix}>{suffix}</Text>}
        </Text>
      </View>
      <View className={styles.footer}>
        {subText && <Text className={styles.subText}>{subText}</Text>}
        {trend !== undefined && (
          <Text className={trend >= 0 ? styles.trendUp : styles.trendDown}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </Text>
        )}
      </View>
    </View>
  );
};

export default StatCard;
