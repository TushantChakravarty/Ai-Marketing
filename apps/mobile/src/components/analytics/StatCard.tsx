import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { formatNumber, formatPercentage } from '../../utils/format.util';

interface StatCardProps {
  title: string;
  value: number;
  iconName: string;
  iconColor?: string;
  trend?: number; // positive = up, negative = down
  isPercentage?: boolean;
  subtitle?: string;
  style?: ViewStyle;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  iconName,
  iconColor = Colors.primary,
  trend,
  isPercentage = false,
  subtitle,
  style,
}) => {
  const trendPositive = trend !== undefined && trend >= 0;
  const formattedValue = isPercentage
    ? formatPercentage(value)
    : formatNumber(value);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={22} color={iconColor} />
      </View>
      <Text style={styles.value}>{formattedValue}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {trend !== undefined && (
        <View style={styles.trendRow}>
          <Icon
            name={trendPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trendPositive ? Colors.success : Colors.error}
          />
          <Text
            style={[
              styles.trendText,
              { color: trendPositive ? Colors.success : Colors.error },
            ]}>
            {Math.abs(trend).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: Spacing.xs,
  },
  trendText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
});

export default StatCard;
