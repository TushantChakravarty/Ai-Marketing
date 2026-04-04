import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
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
import {
  Campaign,
  CampaignStatus,
  STATUS_CONFIG,
  OBJECTIVES,
} from '../../types/ads';
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

  const { data, isLoading, refetch } = useGetCampaignsQuery(
    {
      businessId: business?.id ?? '',
      ...(activeFilter !== 'all' ? { status: activeFilter } : {}),
    },
    { skip: !business?.id },
  );

  const [deleteCampaign] = useDeleteCampaignMutation();
  const [launchCampaign, { isLoading: isLaunching }] = useLaunchCampaignMutation();
  const [pauseCampaign] = usePauseCampaignMutation();
  const [resumeCampaign] = useResumeCampaignMutation();

  const campaigns = data?.data ?? [];

  const handleDelete = (campaign: Campaign) => {
    Alert.alert('Delete Campaign', `Delete "${campaign.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCampaign(campaign._id).unwrap();
          } catch {
            Alert.alert('Error', 'Failed to delete campaign.');
          }
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
    const impressions = item.metrics ? formatNumber(item.metrics.impressions) : '—';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CampaignDetail', { campaignId: item._id })}
        activeOpacity={0.8}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.objectiveIcon}>
            <Icon name={objective?.icon ?? 'bullhorn'} size={18} color={Colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardObjective}>{objective?.label} · Meta</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '20' }]}>
            <Icon name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Metrics row */}
        <View style={styles.metricsRow}>
          <MetricChip icon="currency-usd" label="Spent" value={spend} />
          <MetricChip icon="eye-outline" label="Impressions" value={impressions} />
          <MetricChip
            icon="cursor-pointer"
            label="CTR"
            value={item.metrics ? `${item.metrics.ctr.toFixed(2)}%` : '—'}
          />
          <MetricChip
            icon="account-group-outline"
            label="Reach"
            value={item.metrics ? formatNumber(item.metrics.reach) : '—'}
          />
        </View>

        {/* Budget info */}
        <View style={styles.budgetRow}>
          <Icon name="wallet-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.budgetText}>
            ${(item.budget.amount / 100).toFixed(2)} {item.budget.type} budget ·{' '}
            {item.budget.currency}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {['draft', 'active', 'paused'].includes(item.status) && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                item.status === 'active' ? styles.pauseBtn : styles.launchBtn,
              ]}
              onPress={() => handleAction(item)}
              disabled={isLaunching}>
              <Icon
                name={
                  item.status === 'draft'
                    ? 'rocket-launch-outline'
                    : item.status === 'active'
                    ? 'pause'
                    : 'play'
                }
                size={14}
                color={item.status === 'active' ? Colors.warning : Colors.white}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  item.status === 'active' && { color: Colors.warning },
                ]}>
                {item.status === 'draft'
                  ? 'Launch'
                  : item.status === 'active'
                  ? 'Pause'
                  : 'Resume'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}>
            <Icon name="trash-can-outline" size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {item.errorMessage && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={13} color={Colors.error} />
            <Text style={styles.errorText} numberOfLines={2}>{item.errorMessage}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={i => i.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item.value && styles.filterChipActive]}
            onPress={() => setActiveFilter(item.value)}>
            <Text style={[styles.filterLabel, activeFilter === item.value && styles.filterLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon="bullhorn-outline"
          title="No Campaigns Yet"
          description="Launch your first ad campaign to reach more customers."
          actionLabel="Create Campaign"
          onAction={() => navigation.navigate('CreateCampaign')}
        />
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={i => i._id}
          renderItem={renderCampaign}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.white}
        onPress={() => navigation.navigate('CreateCampaign')}
      />
    </View>
  );
};

const MetricChip: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.metricChip}>
    <Icon name={icon} size={13} color={Colors.textSecondary} />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filterRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  objectiveIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceVariant,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray50,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.sm,
  },
  metricChip: { alignItems: 'center', gap: 3, flex: 1 },
  metricValue: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  metricLabel: { fontSize: 10, color: Colors.textSecondary },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  budgetText: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
  },
  launchBtn: { backgroundColor: Colors.primary },
  pauseBtn: { backgroundColor: Colors.warning + '15', borderWidth: 1.5, borderColor: Colors.warning },
  actionBtnText: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.white },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.error + '40',
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
