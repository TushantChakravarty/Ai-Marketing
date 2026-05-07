import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import {
  useGetCampaignsQuery,
  useDeleteCampaignMutation,
  useLaunchCampaignMutation,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
} from '../../store/api/ads.api';
import type { AdsStackParamList } from '../../types';
import { Campaign, CampaignStatus, STATUS_CONFIG, OBJECTIVES } from '../../types/ads';
import EmptyState from '../../components/common/EmptyState';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { formatNumber } from '../../utils/format.util';

type Nav = StackNavigationProp<AdsStackParamList>;

const STATUS_FILTERS: { label: string; value: CampaignStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
];

const CampaignsListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const business = useAppSelector(s => s.business.currentBusiness);
  const [activeFilter, setActiveFilter] = useState<CampaignStatus | 'all'>('all');

  // Always fetch all for summary stats
  const { data: allData, isLoading, refetch } = useGetCampaignsQuery(
    { businessId: business?.id ?? '' },
    { skip: !business?.id },
  );

  const allCampaigns: Campaign[] = allData?.data ?? [];

  const filtered =
    activeFilter === 'all'
      ? allCampaigns
      : allCampaigns.filter(c => c.status === activeFilter);

  const activeCampaigns = allCampaigns.filter(c => c.status === 'active').length;
  const totalSpend = allCampaigns.reduce((sum, c) => sum + (c.metrics?.spend ?? 0), 0);

  const [deleteCampaign] = useDeleteCampaignMutation();
  const [launchCampaign, { isLoading: isLaunching }] = useLaunchCampaignMutation();
  const [pauseCampaign] = usePauseCampaignMutation();
  const [resumeCampaign] = useResumeCampaignMutation();

  const handleDelete = (campaign: Campaign) => {
    Alert.alert('Delete Campaign', `Delete "${campaign.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteCampaign(campaign._id).unwrap(); }
          catch { Alert.alert('Error', 'Failed to delete campaign.'); }
        },
      },
    ]);
  };

  const handleAction = async (campaign: Campaign) => {
    try {
      if (campaign.status === 'draft') {
        await launchCampaign(campaign._id).unwrap();
        Alert.alert('Launched!', 'Your campaign is now live on Meta.');
      } else if (campaign.status === 'active') {
        await pauseCampaign(campaign._id).unwrap();
      } else if (campaign.status === 'paused') {
        await resumeCampaign(campaign._id).unwrap();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.data?.message ?? 'Action failed.');
    }
  };

  const renderCampaign = ({ item }: { item: Campaign }) => {
    const statusCfg = STATUS_CONFIG[item.status];
    const objective = OBJECTIVES.find(o => o.value === item.objective);
    const spend = item.metrics ? `$${(item.metrics.spend / 100).toFixed(2)}` : '$0.00';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CampaignDetail', { campaignId: item._id })}
        activeOpacity={0.85}>

        {/* Top row */}
        <View style={styles.cardHeader}>
          <View style={[styles.objectiveIcon, { backgroundColor: Colors.primary + '15' }]}>
            <Icon name={objective?.icon ?? 'bullhorn'} size={18} color={Colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardObjective}>{objective?.label} · Meta</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '18' }]}>
            <Icon name={statusCfg.icon} size={11} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricItem
            icon="currency-usd"
            label="Spent"
            value={spend}
            color={Colors.primary}
          />
          <View style={styles.metricDivider} />
          <MetricItem
            icon="eye-outline"
            label="Impressions"
            value={item.metrics ? formatNumber(item.metrics.impressions) : '—'}
            color={Colors.info}
          />
          <View style={styles.metricDivider} />
          <MetricItem
            icon="cursor-pointer"
            label="CTR"
            value={item.metrics ? `${item.metrics.ctr.toFixed(2)}%` : '—'}
            color={Colors.success}
          />
          <View style={styles.metricDivider} />
          <MetricItem
            icon="account-group-outline"
            label="Reach"
            value={item.metrics ? formatNumber(item.metrics.reach) : '—'}
            color={Colors.warning}
          />
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.budgetRow}>
            <Icon name="wallet-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.budgetText}>
              ${(item.budget.amount / 100).toFixed(2)}/{item.budget.type}
            </Text>
          </View>

          <View style={styles.footerActions}>
            {['draft', 'active', 'paused'].includes(item.status) && (
              <TouchableOpacity
                style={[
                  styles.actionPill,
                  item.status === 'active' ? styles.pausePill : styles.launchPill,
                ]}
                onPress={() => handleAction(item)}
                disabled={isLaunching}>
                <Icon
                  name={
                    item.status === 'draft' ? 'rocket-launch-outline'
                    : item.status === 'active' ? 'pause'
                    : 'play'
                  }
                  size={12}
                  color={item.status === 'active' ? Colors.warning : Colors.primary}
                />
                <Text style={[
                  styles.actionPillText,
                  { color: item.status === 'active' ? Colors.warning : Colors.primary },
                ]}>
                  {item.status === 'draft' ? 'Launch' : item.status === 'active' ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteIconBtn}
              onPress={() => handleDelete(item)}>
              <Icon name="trash-can-outline" size={15} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {item.errorMessage && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={12} color={Colors.error} />
            <Text style={styles.errorText} numberOfLines={2}>{item.errorMessage}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary header */}
      <View style={styles.summaryRow}>
        <SummaryStat label="Total" value={String(allCampaigns.length)} icon="bullhorn" color={Colors.primary} />
        <View style={styles.summaryDivider} />
        <SummaryStat label="Active" value={String(activeCampaigns)} icon="play-circle" color={Colors.success} />
        <View style={styles.summaryDivider} />
        <SummaryStat label="Total Spend" value={`$${(totalSpend / 100).toFixed(2)}`} icon="currency-usd" color={Colors.info} />
        <View style={styles.summaryDivider} />
        <TouchableOpacity
          style={styles.newCampaignBtn}
          onPress={() => navigation.navigate('CreateCampaign')}>
          <Icon name="plus" size={14} color={Colors.white} />
          <Text style={styles.newCampaignText}>New</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.newCampaignBtn, styles.aiCampaignBtn]}
          onPress={() => navigation.navigate('CreateAICampaign')}>
          <Icon name="creation" size={14} color={Colors.white} />
          <Text style={styles.newCampaignText}>AI</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips — ScrollView with explicit height, not FlatList */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, activeFilter === f.value && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.value)}>
              <Text style={[styles.filterLabel, activeFilter === f.value && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="bullhorn-outline"
          title={activeFilter === 'all' ? 'No Campaigns Yet' : `No ${activeFilter} campaigns`}
          description={
            activeFilter === 'all'
              ? 'Launch your first ad campaign to reach more customers.'
              : `You don't have any ${activeFilter} campaigns right now.`
          }
          actionLabel={activeFilter === 'all' ? 'Build with AI' : undefined}
          onAction={activeFilter === 'all' ? () => navigation.navigate('CreateAICampaign') : undefined}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          renderItem={renderCampaign}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
        />
      )}

      {filtered.length > 0 && (
        <FAB
          icon="creation"
          style={styles.fab}
          color={Colors.white}
          onPress={() => navigation.navigate('CreateAICampaign')}
        />
      )}
    </View>
  );
};

const MetricItem: React.FC<{ icon: string; label: string; value: string; color: string }> = ({
  icon, label, value, color,
}) => (
  <View style={styles.metricItem}>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const SummaryStat: React.FC<{ label: string; value: string; icon: string; color: string }> = ({
  label, value, icon, color,
}) => (
  <View style={styles.summaryStat}>
    <Icon name={icon} size={14} color={color} />
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Summary bar
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    ...Shadows.sm,
  },
  summaryStat: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: Typography.fontSize.base, fontWeight: '800', color: Colors.textPrimary },
  summaryLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.divider },
  newCampaignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    marginLeft: Spacing.xs,
  },
  newCampaignText: { color: Colors.white, fontSize: Typography.fontSize.xs, fontWeight: '700' },
  aiCampaignBtn: { backgroundColor: Colors.secondary, marginLeft: Spacing.xs },

  // Filters
  filterContainer: { height: 52 },
  filterRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    height: 34,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  filterLabelActive: { color: Colors.white },

  loader: { marginTop: Spacing['2xl'] },
  listContent: { padding: Spacing.base, paddingBottom: 100 },

  // Campaign card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  objectiveIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary },
  cardObjective: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricItem: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { fontSize: Typography.fontSize.sm, fontWeight: '800' },
  metricLabel: { fontSize: 10, color: Colors.textSecondary },
  metricDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budgetText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  launchPill: { borderColor: Colors.primary + '50', backgroundColor: Colors.surfaceVariant },
  pausePill: { borderColor: Colors.warning + '50', backgroundColor: Colors.warningLight },
  actionPillText: { fontSize: 12, fontWeight: '700' },
  deleteIconBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.error + '30',
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  errorText: { flex: 1, fontSize: Typography.fontSize.xs, color: Colors.error },
  fab: { position: 'absolute', bottom: Spacing.xl, right: Spacing.xl, backgroundColor: Colors.primary },
});

export default CampaignsListScreen;
