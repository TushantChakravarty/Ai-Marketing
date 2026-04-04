import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Plan, PlanType } from '../../types';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import Button from '../common/Button';

interface PlanCardProps {
  plan: Plan;
  currentPlanType?: PlanType;
  billingCycle?: 'monthly' | 'yearly';
  onSelect: (plan: Plan) => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentPlanType,
  billingCycle = 'monthly',
  onSelect,
  isLoading = false,
  style,
}) => {
  const isCurrentPlan = plan.id === currentPlanType;
  const isMostPopular = plan.id === 'pro';
  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const priceLabel = billingCycle === 'yearly'
    ? `$${Math.round(plan.yearlyPrice / 12)}/mo`
    : `$${plan.monthlyPrice}/mo`;

  return (
    <View
      style={[
        styles.card,
        isMostPopular && styles.popularCard,
        isCurrentPlan && styles.currentCard,
        style,
      ]}>
      {/* Badges */}
      {isMostPopular && !isCurrentPlan && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>Most Popular</Text>
        </View>
      )}
      {isCurrentPlan && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Current Plan</Text>
        </View>
      )}

      {/* Plan name & price */}
      <Text style={styles.planName}>{plan.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{priceLabel}</Text>
        {billingCycle === 'yearly' && price > 0 && (
          <Text style={styles.yearlyNote}>billed ${price}/yr</Text>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Features */}
      <View style={styles.features}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Icon
              name={feature.included ? 'check-circle' : 'close-circle'}
              size={16}
              color={feature.included ? Colors.success : Colors.gray400}
            />
            <Text
              style={[
                styles.featureLabel,
                !feature.included && styles.featureLabelDisabled,
              ]}>
              {feature.label}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Button
        label={
          isCurrentPlan
            ? 'Current Plan'
            : plan.id === 'free'
            ? 'Downgrade'
            : 'Upgrade'
        }
        onPress={() => onSelect(plan)}
        variant={isCurrentPlan ? 'outline' : isMostPopular ? 'primary' : 'outline'}
        disabled={isCurrentPlan}
        isLoading={isLoading}
        fullWidth
        style={styles.cta}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  popularCard: {
    borderColor: Colors.primary,
    ...Shadows.md,
  },
  currentCard: {
    borderColor: Colors.success,
  },
  popularBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  popularBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  currentBadgeText: {
    color: Colors.success,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  planName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  price: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: Colors.primary,
  },
  yearlyNote: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.base,
  },
  features: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  featureLabelDisabled: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  cta: {},
});

export default PlanCard;
