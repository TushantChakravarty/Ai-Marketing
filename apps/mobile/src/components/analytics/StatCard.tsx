import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { formatNumber, formatPercentage } from '../../utils/format.util';

interface StatCardProps {
  title: string;
  value: number;
  iconName: string;
  iconColor?: string;
  trend?: number;
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
  const formattedValue = isPercentage ? formatPercentage(value) : formatNumber(value);

  return (
    <View style={[styles.card, style]}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Icon name={iconName} size={20} color={iconColor} />
      </View>

      {/* Value + label */}
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {formattedValue}
      </Text>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {/* Trend */}
      {trend !== undefined && (
        <View style={[styles.trendPill, { backgroundColor: trendPositive ? Colors.successLight : Colors.errorLight }]}>
          <Icon
            name={trendPositive ? 'arrow-up' : 'arrow-down'}
            size={11}
            color={trendPositive ? Colors.success : Colors.error}
          />
          <Text style={[styles.trendText, { color: trendPositive ? Colors.success : Colors.error }]}>
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
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 30,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default StatCard;
