import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useAppSelector } from '../../store';
import {
  useGetDashboardQuery,
  useGetTrendsQuery,
  useGetTopPostsQuery,
} from '../../store/api/analytics.api';
import StatCard from '../../components/analytics/StatCard';
import EngagementChart from '../../components/analytics/EngagementChart';
import EmptyState from '../../components/common/EmptyState';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { PLATFORMS } from '../../config/constants';
import { formatNumber, formatPercent } from '../../utils/format.util';

type DateRange = '7d' | '30d' | '90d';

const DATE_RANGES: { label: string; value: DateRange; days: number }[] = [
  { label: '7 Days', value: '7d', days: 7 },
  { label: '30 Days', value: '30d', days: 30 },
  { label: '90 Days', value: '90d', days: 90 },
];

const AnalyticsScreen: React.FC = () => {
  const business = useAppSelector(s => s.business.currentBusiness);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const rangeConfig = DATE_RANGES.find(r => r.value === dateRange)!;
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(rangeConfig.days, 'day').format('YYYY-MM-DD');

  const queryParams = {
    businessId: business?.id ?? '',
    startDate,
    endDate,
  };

  const { data: dashboardData, isLoading: isDashboardLoading } = useGetDashboardQuery(
    queryParams,
    { skip: !business?.id },
  );
  const { data: trendsData, isLoading: isTrendsLoading } = useGetTrendsQuery(
    queryParams,
    { skip: !business?.id },
  );
  const { data: topPostsData } = useGetTopPostsQuery(
    { ...queryParams, limit: 5 },
    { skip: !business?.id },
  );

  const summary = dashboardData?.data?.summary;
  const platformBreakdown = dashboardData?.data?.platformBreakdown ?? [];
  const topPosts = topPostsData?.data ?? [];
  const trends = trendsData?.data;

  if (!business) {
    return (
      <EmptyState
        icon="chart-line"
        title="No Business Found"
        description="Set up your business to view analytics."
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Date Range Selector */}
      <View style={styles.dateRangeRow}>
        {DATE_RANGES.map(range => (
          <TouchableOpacity
            key={range.value}
            style={[styles.rangeChip, dateRange === range.value && styles.rangeChipActive]}
            onPress={() => setDateRange(range.value)}>
            <Text
              style={[
                styles.rangeChipLabel,
                dateRange === range.value && styles.rangeChipLabelActive,
              ]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      {isDashboardLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.statsGrid}>
          <StatCard
            icon="eye-outline"
            label="Impressions"
            value={formatNumber(summary?.totalImpressions ?? 0)}
            trend={summary?.impressionsTrend}
            color={Colors.primary}
            style={styles.statCard}
          />
          <StatCard
            icon="account-multiple-outline"
            label="Reach"
            value={formatNumber(summary?.totalReach ?? 0)}
            trend={summary?.reachTrend}
            color={Colors.info}
            style={styles.statCard}
          />
          <StatCard
            icon="heart-outline"
            label="Engagement"
            value={formatNumber(summary?.totalEngagement ?? 0)}
            trend={summary?.engagementTrend}
            color={Colors.error}
            style={styles.statCard}
          />
          <StatCard
            icon="account-plus-outline"
            label="New Followers"
            value={formatNumber(summary?.followersGained ?? 0)}
            trend={summary?.followersTrend}
            color={Colors.success}
            style={styles.statCard}
          />
        </View>
      )}

      {/* Engagement Trend Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Engagement Over Time</Text>
        {isTrendsLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : trends?.engagement && trends.engagement.length > 0 ? (
          <EngagementChart
            data={trends.engagement}
            color={Colors.primary}
            label="Engagement"
          />
        ) : (
          <Text style={styles.noDataText}>No trend data available</Text>
        )}
      </View>

      {/* Reach Trend Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Reach Over Time</Text>
        {isTrendsLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : trends?.reach && trends.reach.length > 0 ? (
          <EngagementChart
            data={trends.reach}
            color={Colors.info}
            label="Reach"
          />
        ) : (
          <Text style={styles.noDataText}>No trend data available</Text>
        )}
      </View>

      {/* Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Platform Breakdown</Text>
          {platformBreakdown.map(pb => {
            const platformConfig = PLATFORMS.find(p => p.id === pb.platform);
            return (
              <View key={pb.platform} style={styles.platformRow}>
                <View style={[styles.platformIcon, { backgroundColor: platformConfig?.color + '20' }]}>
                  <Icon name={platformConfig?.icon ?? 'circle'} size={20} color={platformConfig?.color} />
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformName}>{platformConfig?.name}</Text>
                  <View style={styles.platformBar}>
                    <View
                      style={[
                        styles.platformBarFill,
                        {
                          width: `${pb.engagementRate ?? 0}%`,
                          backgroundColor: platformConfig?.color ?? Colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.platformStats}>
                  <Text style={styles.platformEngagement}>
                    {formatPercent(pb.engagementRate ?? 0)}
                  </Text>
                  <Text style={styles.platformEngagementLabel}>eng. rate</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Top Posts */}
      {topPosts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Performing Posts</Text>
          {topPosts.map((post, index) => (
            <View key={post.postId} style={styles.topPostRow}>
              <Text style={styles.topPostRank}>#{index + 1}</Text>
              <View style={styles.topPostContent}>
                <Text style={styles.topPostText} numberOfLines={2}>
                  {post.content}
                </Text>
                <View style={styles.topPostStats}>
                  <View style={styles.topPostStat}>
                    <Icon name="heart-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.topPostStatValue}>{formatNumber(post.totalLikes)}</Text>
                  </View>
                  <View style={styles.topPostStat}>
                    <Icon name="comment-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.topPostStatValue}>{formatNumber(post.totalComments)}</Text>
                  </View>
                  <View style={styles.topPostStat}>
                    <Icon name="share-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.topPostStatValue}>{formatNumber(post.totalShares)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  dateRangeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  rangeChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  rangeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rangeChipLabel: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  rangeChipLabelActive: { color: Colors.white },
  loader: { marginVertical: Spacing.xl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  statCard: { width: '48%' },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  chartTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.base },
  noDataText: { textAlign: 'center', color: Colors.textSecondary, paddingVertical: Spacing.xl },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.base },
  platformRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  platformIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  platformInfo: { flex: 1 },
  platformName: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  platformBar: { height: 6, backgroundColor: Colors.gray200, borderRadius: Radius.full, overflow: 'hidden' },
  platformBarFill: { height: '100%', borderRadius: Radius.full },
  platformStats: { alignItems: 'flex-end' },
  platformEngagement: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary },
  platformEngagementLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  topPostRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadows.sm },
  topPostRank: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: Colors.primary, minWidth: 28 },
  topPostContent: { flex: 1 },
  topPostText: { fontSize: Typography.fontSize.sm, color: Colors.textPrimary, lineHeight: 18, marginBottom: Spacing.xs },
  topPostStats: { flexDirection: 'row', gap: Spacing.base },
  topPostStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  topPostStatValue: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
});

export default AnalyticsScreen;
