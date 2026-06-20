import React from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import styles from './index.module.scss';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: () => void;
  actionText?: string;
  showAction?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = '搜索...',
  onSearch,
  actionText,
  showAction = false
}) => {
  return (
    <View className={styles.searchBar}>
      <Text className={styles.icon}>🔍</Text>
      <Input
        className={styles.input}
        value={value}
        placeholder={placeholder}
        placeholderClass="text-tertiary"
        onInput={(e) => onChange(e.detail.value)}
        onConfirm={onSearch}
      />
      {value && (
        <Button className={styles.clearBtn} onClick={() => onChange('')}>
          ×
        </Button>
      )}
      {showAction && actionText && (
        <Button className={styles.actionBtn} onClick={onSearch}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

export default SearchBar;
