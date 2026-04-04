import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { PostStatus } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';

interface StatusBadgeProps {
  status: PostStatus;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; bg: string; text: string }
> = {
  draft: {
    label: 'Draft',
    bg: Colors.gray200,
    text: Colors.gray700,
  },
  scheduled: {
    label: 'Scheduled',
    bg: Colors.infoLight,
    text: Colors.info,
  },
  published: {
    label: 'Published',
    bg: Colors.successLight,
    text: Colors.success,
  },
  failed: {
    label: 'Failed',
    bg: Colors.errorLight,
    text: Colors.error,
  },
  processing: {
    label: 'Processing',
    bg: Colors.warningLight,
    text: Colors.warning,
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        style,
      ]}>
      <Text style={[styles.label, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatusBadge;
