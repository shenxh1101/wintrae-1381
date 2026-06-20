import React from 'react';
import { Text } from '@tarojs/components';
import classnames from 'classnames';
import { BookingStatus, statusLabels } from '../../types/booking';
import styles from './index.module.scss';

interface StatusTagProps {
  status: BookingStatus;
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  return (
    <Text className={classnames(styles.statusTag, styles[status])}>
      {statusLabels[status]}
    </Text>
  );
};

export default StatusTag;
