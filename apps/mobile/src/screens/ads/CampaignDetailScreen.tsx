import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import dayjs from 'dayjs';
import {
  useGetCampaignQuery,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useDeleteCampaignMutation,
  useSyncInsightsMutation,
} from '../../store/api/ads.api';
import type { AdsStackParamList } from '../../types';
import { STATUS_CONFIG, OBJECTIVES } from '../../types/ads';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { formatNumber } from '../../utils/format.util';

type RouteProps = RouteProp<AdsStackParamList, 'CampaignDetail'>;
type Nav = StackNavigationProp<AdsStackParamList>;

const CampaignDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { campaignId } = route.params;

  const { data, isLoading, refetch } = useGetCampaignQuery(campaignId);
  const [pauseCampaign, { isLoading: isPausing }] = usePauseCampaignMutation();
  const [resumeCampaign, { isLoading: isResuming }] = useResumeCampaignMutation();
  const [deleteCampaign, { isLoading: isDeleting }] = useDeleteCampaignMutation();
  const [syncInsights, { isLoading: isSyncing }] = useSyncInsightsMutation();

  const campaign = data?.data;

  const handlePause = useCallback(async () => {
    try {
      await pauseCampaign(campaignId).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to pause campaign.');
    }
  }, [campaignId, pauseCampaign]);

  const handleResume = useCallback(async () => {
    try {
      await resumeCampaign(campaignId).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to resume campaign.');
    }
  }, [campaignId, resumeCampaign]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Campaign',
      'This will archive the campaign on Meta and remove it from your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCampaign(campaignId).unwrap();
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to delete campaign.');
            }
          },
        },
      ],
    );
  }, [campaignId, deleteCampaign, navigation]);

  const handleSyncInsights = useCallback(async () => {
    try {
      await syncInsights(campaignId).unwrap();
    } catch {
      Alert.alert('Error', 'Failed to sync insights. Make sure the campaign has been launched.');
    }
  }, [campaignId, syncInsights]);

  if (isLoading) return <LoadingOverlay visible />;
  if (!campaign)
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Campaign Not Found"
        description="This campaign could not be loaded."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );

  const statusCfg = STATUS_CONFIG[campaign.status];
  const objective = OBJECTIVES.find(o => o.value === campaign.objective);
  const metrics = campaign.metrics;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.objectiveIcon}>
            <Icon name={objective?.icon ?? 'bullhorn'} size={22} color={Colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.campaignName}>{campaign.name}</Text>
            <Text style={styles.campaignMeta}>
              {objective?.label} · Meta · Created {dayjs(campaign.createdAt).format('MMM D, YYYY')}
            </Text>
          </View>
        </View>

        <View style={[styles.statusRow, { backgroundColor: statusCfg.color + '15' }]}>
          <Icon name={statusCfg.icon} size={16} color={statusCfg.color} />
          <Text style={[styles.statusLabel, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
          {campaign.status === 'active' && (
            <Text style={[styles.statusSince, { color: statusCfg.color }]}>
              · Live since {dayjs(campaign.updatedAt).format('MMM D')}
            </Text>
          )}
        </View>

        {campaign.errorMessage && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={14} color={Colors.error} />
            <Text style={styles.errorText}>{campaign.errorMessage}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        {campaign.status === 'active' && (
          <Button
            label="Pause"
            onPress={handlePause}
            variant="outline"
            icon="pause"
            isLoading={isPausing}
            style={styles.actionBtn}
          />
        )}
        {campaign.status === 'paused' && (
          <Button
            label="Resume"
            onPress={handleResume}
            variant="primary"
            icon="play"
            isLoading={isResuming}
            style={styles.actionBtn}
          />
        )}
        {campaign.metaCampaignId && (
          <Button
            label={isSyncing ? 'Syncing…' : 'Sync Insights'}
            onPress={handleSyncInsights}
            variant="outline"
            icon="refresh"
            isLoading={isSyncing}
            style={styles.actionBtn}
          />
        )}
      </View>

      {/* Performance Metrics */}
      <Text style={styles.sectionTitle}>Performance</Text>
      {metrics ? (
        <>
          <View style={styles.metricsGrid}>
            <MetricCard
              icon="currency-usd"
              label="Total Spend"
              value={`$${(metrics.spend / 100).toFixed(2)}`}
              color={Colors.primary}
            />
            <MetricCard
              icon="eye-outline"
              label="Impressions"
              value={formatNumber(metrics.impressions)}
              color={Colors.info}
            />
            <MetricCard
              icon="account-group-outline"
              label="Reach"
              value={formatNumber(metrics.reach)}
              color={Colors.success}
            />
            <MetricCard
              icon="cursor-pointer"
              label="Clicks"
              value={formatNumber(metrics.clicks)}
              color={Colors.warning}
            />
          </View>

          <View style={styles.metricsGrid}>
            <MetricCard
              icon="percent"
              label="CTR"
              value={`${metrics.ctr.toFixed(2)}%`}
              color={Colors.primary}
            />
            <MetricCard
              icon="cash-multiple"
              label="CPM"
              value={`$${metrics.cpm.toFixed(2)}`}
              color={Colors.info}
            />
            <MetricCard
              icon="mouse-move-vertical"
              label="CPC"
              value={`$${metrics.cpc.toFixed(2)}`}
              color={Colors.secondary}
            />
            <MetricCard
              icon="repeat"
              label="Frequency"
              value={metrics.frequency.toFixed(1)}
              color={Colors.warning}
            />
          </View>

          {metrics.conversions > 0 && (
            <View style={styles.conversionCard}>
              <Icon name="check-decagram" size={28} color={Colors.success} />
              <View>
                <Text style={styles.conversionValue}>{formatNumber(metrics.conversions)}</Text>
                <Text style={styles.conversionLabel}>Conversions</Text>
              </View>
              <View style={styles.conversionDivider} />
              <View>
                <Text style={styles.conversionValue}>
                  ${(metrics.costPerConversion / 100).toFixed(2)}
                </Text>
                <Text style={styles.conversionLabel}>Cost per conversion</Text>
              </View>
            </View>
          )}

          <Text style={styles.syncNote}>
            Last synced {dayjs(metrics.lastSyncedAt).fromNow()}
          </Text>
        </>
      ) : (
        <View style={styles.noMetricsBox}>
          <Icon name="chart-line" size={32} color={Colors.gray300} />
          <Text style={styles.noMetricsTitle}>No metrics yet</Text>
          <Text style={styles.noMetricsDesc}>
            {campaign.metaCampaignId
              ? 'Tap "Sync Insights" to pull the latest data from Meta.'
              : 'Launch the campaign to start collecting performance data.'}
          </Text>
        </View>
      )}

      {/* Budget */}
      <Text style={styles.sectionTitle}>Budget</Text>
      <View style={styles.detailCard}>
        <DetailRow
          label="Type"
          value={campaign.budget.type === 'daily' ? 'Daily Budget' : 'Lifetime Budget'}
        />
        <DetailRow
          label="Amount"
          value={`$${(campaign.budget.amount / 100).toFixed(2)} ${campaign.budget.currency}`}
        />
        <DetailRow label="Start" value={dayjs(campaign.budget.startDate).format('MMM D, YYYY')} />
        {campaign.budget.endDate && (
          <DetailRow label="End" value={dayjs(campaign.budget.endDate).format('MMM D, YYYY')} />
        )}
      </View>

      {/* Audience */}
      <Text style={styles.sectionTitle}>Audience</Text>
      <View style={styles.detailCard}>
        {campaign.targeting.countries?.length ? (
          <DetailRow label="Countries" value={campaign.targeting.countries.join(', ')} />
        ) : null}
        {campaign.targeting.ageMin || campaign.targeting.ageMax ? (
          <DetailRow
            label="Age"
            value={`${campaign.targeting.ageMin ?? 13} – ${campaign.targeting.ageMax ?? 65}`}
          />
        ) : null}
        {campaign.targeting.interests?.length ? (
          <DetailRow
            label="Interests"
            value={campaign.targeting.interests.map(i => i.name).join(', ')}
          />
        ) : null}
      </View>

      {/* Creative */}
      <Text style={styles.sectionTitle}>Ad Creative</Text>
      <View style={styles.detailCard}>
        <Text style={styles.creativeHeadline}>{campaign.creative.headline}</Text>
        <Text style={styles.creativeBody}>{campaign.creative.bodyText}</Text>
        <View style={styles.creativeMeta}>
          <Icon name="link-variant" size={13} color={Colors.textSecondary} />
          <Text style={styles.creativeLink} numberOfLines={1}>{campaign.creative.linkUrl}</Text>
        </View>
        <View style={styles.ctaBadge}>
          <Text style={styles.ctaText}>{campaign.creative.callToAction.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      {/* IDs */}
      {campaign.metaCampaignId && (
        <>
          <Text style={styles.sectionTitle}>Meta IDs</Text>
          <View style={styles.detailCard}>
            <DetailRow label="Campaign ID" value={campaign.metaCampaignId} mono />
            {campaign.metaAdSetId && <DetailRow label="Ad Set ID" value={campaign.metaAdSetId} mono />}
            {campaign.metaAdId && <DetailRow label="Ad ID" value={campaign.metaAdId} mono />}
          </View>
        </>
      )}

      {/* Delete */}
      <Button
        label="Delete Campaign"
        onPress={handleDelete}
        variant="outline"
        icon="trash-can-outline"
        isLoading={isDeleting}
        fullWidth
        style={styles.deleteBtn}
      />
    </ScrollView>
  );
};

const MetricCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({
  icon, label, value, color,
}) => (
  <View style={[styles.metricCard, { borderTopColor: color }]}>
    <Icon name={icon} size={18} color={color} />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const DetailRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label, value, mono,
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, mono && styles.detailValueMono]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  objectiveIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  campaignName: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  campaignMeta: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  statusLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  statusSince: { fontSize: Typography.fontSize.sm },
  errorBox: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  errorText: { flex: 1, fontSize: Typography.fontSize.xs, color: Colors.error },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  actionBtn: { flex: 1 },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  metricsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 3,
    ...Shadows.sm,
  },
  metricValue: { fontSize: Typography.fontSize.base, fontWeight: '800', color: Colors.textPrimary },
  metricLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
  conversionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  conversionValue: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.success },
  conversionLabel: { fontSize: Typography.fontSize.xs, color: Colors.success },
  conversionDivider: { width: 1, height: 40, backgroundColor: Colors.success + '40' },
  syncNote: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, textAlign: 'right', marginBottom: Spacing.sm },
  noMetricsBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  noMetricsTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary },
  noMetricsDesc: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.base },
  detailLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, flex: 1 },
  detailValue: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary, fontWeight: '600', flex: 2, textAlign: 'right' },
  detailValueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },
  creativeHeadline: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  creativeBody: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  creativeMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  creativeLink: { fontSize: Typography.fontSize.xs, color: Colors.primary, flex: 1 },
  ctaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  ctaText: { color: Colors.white, fontSize: Typography.fontSize.xs, fontWeight: '700' },
  deleteBtn: { marginTop: Spacing.xl, borderColor: Colors.error },
});

export default CampaignDetailScreen;
