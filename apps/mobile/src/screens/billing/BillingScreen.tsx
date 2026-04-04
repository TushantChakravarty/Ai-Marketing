import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Text, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { billingService } from '../../services/billing.service';
import { PLANS, CREDIT_PACKAGES } from '../../config/constants';
import PlanCard from '../../components/billing/PlanCard';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { formatDate } from '../../utils/format.util';
import type { Plan } from '../../types';

type BillingCycle = 'monthly' | 'yearly';

const BillingScreen: React.FC = () => {
  const user = useAppSelector(s => s.auth.user);
  const business = useAppSelector(s => s.business.currentBusiness);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  // In a real app, subscription would come from RTK Query
  const subscription = user?.subscription;

  const handleSelectPlan = async (plan: Plan) => {
    if (!user || !business) return;
    if (plan.id === 'free') {
      Alert.alert(
        'Downgrade to Free',
        'You will lose access to premium features at the end of your current billing period.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Downgrade',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoadingPlanId(plan.id);
                await billingService.cancelSubscription();
                Alert.alert('Done', 'Your subscription will end at the billing period end.');
              } catch {
                Alert.alert('Error', 'Failed to cancel subscription.');
              } finally {
                setLoadingPlanId(null);
              }
            },
          },
        ],
      );
      return;
    }

    try {
      setLoadingPlanId(plan.id);
      const response = await billingService.createCheckout({
        planId: plan.id,
        billingCycle,
        businessId: business.id,
      });
      if (response.data?.url) {
        await Linking.openURL(response.data.url);
      }
    } catch {
      Alert.alert('Error', 'Failed to start checkout. Please try again.');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await billingService.createPortalSession();
      if (response.data?.url) {
        await Linking.openURL(response.data.url);
      }
    } catch {
      Alert.alert('Error', 'Failed to open billing portal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseCredits = async (packageItem: typeof CREDIT_PACKAGES[0]) => {
    try {
      setIsLoading(true);
      const response = await billingService.purchaseCredits({
        credits: packageItem.credits,
        businessId: business?.id ?? '',
      });
      if (response.data?.url) {
        await Linking.openURL(response.data.url);
      }
    } catch {
      Alert.alert('Error', 'Failed to start credits purchase.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Subscription */}
      {subscription && (
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <View>
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
              <Text style={styles.currentPlanName}>
                {PLANS.find(p => p.id === subscription.planType)?.name ?? subscription.planType}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                subscription.status === 'active' ? styles.statusActive : styles.statusInactive,
              ]}>
              <Text
                style={[
                  styles.statusText,
                  subscription.status === 'active' ? styles.statusTextActive : styles.statusTextInactive,
                ]}>
                {subscription.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.planMetaRow}>
            <View style={styles.planMetaItem}>
              <Icon name="calendar-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.planMetaText}>
                Renews {formatDate(subscription.currentPeriodEnd)}
              </Text>
            </View>
            {subscription.credits !== undefined && (
              <View style={styles.planMetaItem}>
                <Icon name="star-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.planMetaText}>{subscription.credits} credits remaining</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.manageBtn}
            onPress={handleManageSubscription}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.manageBtnText}>Manage Subscription</Text>
                <Icon name="open-in-new" size={14} color={Colors.primary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Billing Cycle Toggle */}
      <View style={styles.cycleToggle}>
        {(['monthly', 'yearly'] as BillingCycle[]).map(cycle => (
          <TouchableOpacity
            key={cycle}
            style={[styles.cycleBtn, billingCycle === cycle && styles.cycleBtnActive]}
            onPress={() => setBillingCycle(cycle)}>
            <Text style={[styles.cycleBtnText, billingCycle === cycle && styles.cycleBtnTextActive]}>
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
            </Text>
            {cycle === 'yearly' && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 17%</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Plans */}
      <Text style={styles.sectionTitle}>Choose Your Plan</Text>
      {PLANS.map(plan => (
        <PlanCard
          key={plan.id}
          plan={plan}
          currentPlanType={subscription?.planType}
          billingCycle={billingCycle}
          onSelect={handleSelectPlan}
          isLoading={loadingPlanId === plan.id}
          style={styles.planCard}
        />
      ))}

      {/* Per-Post Credits */}
      <Text style={styles.sectionTitle}>Buy Post Credits</Text>
      <Text style={styles.creditsDescription}>
        Purchase credits to publish individual posts without a subscription.
        1 credit = 1 post published to all selected platforms.
      </Text>
      {CREDIT_PACKAGES.map(pkg => (
        <TouchableOpacity
          key={pkg.credits}
          style={styles.creditPackageRow}
          onPress={() => handlePurchaseCredits(pkg)}
          disabled={isLoading}>
          <View style={styles.creditPackageLeft}>
            <Icon name="star" size={24} color={Colors.warning} />
            <View>
              <Text style={styles.creditPackageLabel}>{pkg.credits} Credits</Text>
              <Text style={styles.creditPackageSubtext}>
                ${(pkg.price / pkg.credits).toFixed(2)} per post
              </Text>
            </View>
          </View>
          <Text style={styles.creditPackagePrice}>${pkg.price}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  currentPlanCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  currentPlanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  currentPlanLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  currentPlanName: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  statusActive: { backgroundColor: Colors.successLight },
  statusInactive: { backgroundColor: Colors.errorLight },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: '700' },
  statusTextActive: { color: Colors.success },
  statusTextInactive: { color: Colors.error },
  divider: { marginVertical: Spacing.base },
  planMetaRow: { gap: Spacing.sm, marginBottom: Spacing.base },
  planMetaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  planMetaText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  manageBtnText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: '600' },
  cycleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.base,
  },
  cycleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  cycleBtnActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  cycleBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  cycleBtnTextActive: { color: Colors.primary },
  saveBadge: { backgroundColor: Colors.success, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.base },
  planCard: { marginBottom: Spacing.base },
  creditsDescription: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.base },
  creditPackageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  creditPackageLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  creditPackageLabel: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary },
  creditPackageSubtext: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  creditPackagePrice: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.primary },
});

export default BillingScreen;
