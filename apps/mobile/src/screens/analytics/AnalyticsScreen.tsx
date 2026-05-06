import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
import { formatNumber, formatPercentage, formatRelativeDate } from '../../utils/format.util';
import type { PlatformAnalytics } from '../../types';

type DateRange = '7d' | '30d' | '90d';

const DATE_RANGES: { label: string; value: DateRange; days: number }[] = [
  { label: '7D', value: '7d', days: 7 },
  { label: '30D', value: '30d', days: 30 },
  { label: '90D', value: '90d', days: 90 },
];

const AnalyticsScreen: React.FC = () => {
  const business = useAppSelector(s => s.business.currentBusiness);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const rangeConfig = DATE_RANGES.find(r => r.value === dateRange)!;
  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs().subtract(rangeConfig.days, 'day').format('YYYY-MM-DD');

  const queryParams = { businessId: business?.id ?? '', startDate, endDate };

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useGetDashboardQuery(queryParams, { skip: !business?.id });

  const {
    data: trendsData,
    isLoading: isTrendsLoading,
    refetch: refetchTrends,
  } = useGetTrendsQuery(queryParams, { skip: !business?.id });

  const {
    data: topPostsData,
    refetch: refetchTopPosts,
  } = useGetTopPostsQuery({ ...queryParams, limit: 5 }, { skip: !business?.id });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDashboard(), refetchTrends(), refetchTopPosts()]);
    setRefreshing(false);
  };

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

  const isLoading = isDashboardLoading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>{business.name}</Text>
        </View>
        <View style={styles.dateRangeRow}>
          {DATE_RANGES.map(range => (
            <TouchableOpacity
              key={range.value}
              style={[styles.rangeChip, dateRange === range.value && styles.rangeChipActive]}
              onPress={() => setDateRange(range.value)}>
              <Text style={[styles.rangeChipLabel, dateRange === range.value && styles.rangeChipLabelActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary Stats */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading analytics…</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatCard
              iconName="eye-outline"
              title="Impressions"
              value={summary?.totalImpressions ?? 0}
              iconColor={Colors.primary}
              style={styles.statCard}
            />
            <StatCard
              iconName="account-multiple-outline"
              title="Reach"
              value={summary?.totalReach ?? 0}
              iconColor={Colors.info}
              style={styles.statCard}
            />
            <StatCard
              iconName="heart-outline"
              title="Engagements"
              value={summary?.totalEngagements ?? 0}
              iconColor={Colors.error}
              style={styles.statCard}
            />
            <StatCard
              iconName="percent-outline"
              title="Eng. Rate"
              value={summary?.engagementRate ?? 0}
              isPercentage
              iconColor={Colors.success}
              style={styles.statCard}
            />
          </View>

          {/* Posts & Followers row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Icon name="file-document-outline" size={15} color={Colors.primary} />
              <Text style={styles.summaryPillValue}>{formatNumber(summary?.totalPosts ?? 0)}</Text>
              <Text style={styles.summaryPillLabel}>posts</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryPill}>
              <Icon name="account-plus-outline" size={15} color={Colors.success} />
              <Text style={[styles.summaryPillValue, { color: Colors.success }]}>
                +{formatNumber(summary?.followersGained ?? 0)}
              </Text>
              <Text style={styles.summaryPillLabel}>new followers</Text>
            </View>
          </View>
        </>
      )}

      {/* Engagement Trend Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.chartTitle}>Engagement Trend</Text>
        </View>
        {isTrendsLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.chartLoader} />
        ) : trends?.engagement && trends.engagement.length > 0 ? (
          <EngagementChart data={trends.engagement} color={Colors.primary} label="Engagement" />
        ) : (
          <View style={styles.chartEmpty}>
            <Icon name="chart-line-variant" size={32} color={Colors.gray300} />
            <Text style={styles.noDataText}>No trend data yet</Text>
          </View>
        )}
      </View>

      {/* Reach Trend Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartDot, { backgroundColor: Colors.info }]} />
          <Text style={styles.chartTitle}>Reach Trend</Text>
        </View>
        {isTrendsLoading ? (
          <ActivityIndicator color={Colors.info} style={styles.chartLoader} />
        ) : trends?.reach && trends.reach.length > 0 ? (
          <EngagementChart data={trends.reach} color={Colors.info} label="Reach" />
        ) : (
          <View style={styles.chartEmpty}>
            <Icon name="chart-areaspline" size={32} color={Colors.gray300} />
            <Text style={styles.noDataText}>No trend data yet</Text>
          </View>
        )}
      </View>

      {/* Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <>
          <SectionHeader title="Platform Breakdown" icon="view-grid-outline" />
          {platformBreakdown.map(pb => (
            <PlatformCard key={pb.platform} pb={pb} />
          ))}
        </>
      )}

      {/* Top Posts */}
      {topPosts.length > 0 && (
        <>
          <SectionHeader title="Top Performing Posts" icon="trophy-outline" />
          {topPosts.map((post, index) => {
            const platformConfig = PLATFORMS.find(p => p.id === post.platform);
            return (
              <View key={post.postId} style={styles.topPostCard}>
                <View style={styles.topPostRankWrap}>
                  <Text style={[styles.topPostRank, index === 0 && styles.topPostRankGold]}>
                    #{index + 1}
                  </Text>
                </View>
                <View style={styles.topPostBody}>
                  <Text style={styles.topPostText} numberOfLines={2}>{post.content}</Text>
                  <View style={styles.topPostMeta}>
                    {platformConfig && (
                      <View style={[styles.platformBadge, { backgroundColor: platformConfig.color + '18' }]}>
                        <Icon name={platformConfig.icon} size={11} color={platformConfig.color} />
                        <Text style={[styles.platformBadgeText, { color: platformConfig.color }]}>
                          {platformConfig.name}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.topPostDate}>{formatRelativeDate(post.publishedAt)}</Text>
                  </View>
                  <View style={styles.topPostStats}>
                    <PostStat icon="heart-outline" value={post.likes} />
                    <PostStat icon="comment-outline" value={post.comments} />
                    <PostStat icon="share-outline" value={post.shares} />
                    <PostStat icon="eye-outline" value={post.reach} label="reach" />
                    <View style={styles.engRatePill}>
                      <Text style={styles.engRateText}>{formatPercentage(post.engagementRate)} eng.</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}

      {!isLoading && !summary && (
        <EmptyState
          icon="chart-bar"
          title="No Data Yet"
          description="Post content and run campaigns to start seeing analytics here."
        />
      )}
    </ScrollView>
  );
};

const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <Icon name={icon} size={16} color={Colors.primary} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const PostStat: React.FC<{ icon: string; value: number; label?: string }> = ({ icon, value, label }) => (
  <View style={styles.topPostStat}>
    <Icon name={icon} size={12} color={Colors.textSecondary} />
    <Text style={styles.topPostStatValue}>{formatNumber(value)}</Text>
    {label && <Text style={styles.topPostStatLabel}>{label}</Text>}
  </View>
);

const PlatformCard: React.FC<{ pb: PlatformAnalytics }> = ({ pb }) => {
  const platformConfig = PLATFORMS.find(p => p.id === pb.platform);
  const color = platformConfig?.color ?? Colors.primary;
  const barWidth = Math.min(pb.engagementRate ?? 0, 100);

  return (
    <View style={styles.platformCard}>
      <View style={styles.platformCardTop}>
        <View style={[styles.platformIcon, { backgroundColor: color + '18' }]}>
          <Icon name={platformConfig?.icon ?? 'circle'} size={20} color={color} />
        </View>
        <View style={styles.platformMeta}>
          <Text style={styles.platformName}>{platformConfig?.name ?? pb.platform}</Text>
          <Text style={styles.platformFollowers}>
            {formatNumber(pb.followers)} followers · +{formatNumber(pb.followersGained)} gained
          </Text>
        </View>
        <View style={styles.platformEngWrap}>
          <Text style={[styles.platformEngRate, { color }]}>{formatPercentage(pb.engagementRate)}</Text>
          <Text style={styles.platformEngLabel}>eng. rate</Text>
        </View>
      </View>

      <View style={styles.platformBar}>
        <View style={[styles.platformBarFill, { width: `${barWidth}%`, backgroundColor: color }]} />
      </View>

      <View style={styles.platformStatsRow}>
        <PlatformStat label="Impressions" value={pb.impressions} />
        <PlatformStat label="Reach" value={pb.reach} />
        <PlatformStat label="Engagements" value={pb.engagements} />
        <PlatformStat label="Posts" value={pb.postsCount} />
      </View>
    </View>
  );
};

const PlatformStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.platformStatItem}>
    <Text style={styles.platformStatValue}>{formatNumber(value)}</Text>
    <Text style={styles.platformStatLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing['2xl'] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.lg,
    padding: 3,
  },
  rangeChip: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  rangeChipActive: { backgroundColor: Colors.primary },
  rangeChipLabel: { fontSize: Typography.fontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  rangeChipLabelActive: { color: Colors.white },

  loadingWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  loadingText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  statCard: { width: '47.5%' },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  summaryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  summaryPillValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryPillLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.divider,
  },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.base },
  chartDot: { width: 10, height: 10, borderRadius: Radius.full },
  chartTitle: { fontSize: Typography.fontSize.base, fontWeight: '700', color: Colors.textPrimary },
  chartLoader: { marginVertical: Spacing.xl },
  chartEmpty: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  noDataText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  platformCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  platformCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  platformIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  platformMeta: { flex: 1 },
  platformName: { fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.textPrimary },
  platformFollowers: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  platformEngWrap: { alignItems: 'flex-end' },
  platformEngRate: { fontSize: Typography.fontSize.lg, fontWeight: '800' },
  platformEngLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  platformBar: {
    height: 5,
    backgroundColor: Colors.gray200,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  platformBarFill: { height: '100%', borderRadius: Radius.full },
  platformStatsRow: { flexDirection: 'row' },
  platformStatItem: { flex: 1, alignItems: 'center' },
  platformStatValue: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  platformStatLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },

  topPostCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  topPostRankWrap: { width: 28, alignItems: 'center', paddingTop: 2 },
  topPostRank: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  topPostRankGold: { color: '#F59E0B' },
  topPostBody: { flex: 1 },
  topPostText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  topPostMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  platformBadgeText: { fontSize: 10, fontWeight: '600' },
  topPostDate: { fontSize: 10, color: Colors.textSecondary },
  topPostStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  topPostStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  topPostStatValue: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  topPostStatLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  engRatePill: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  engRateText: { fontSize: 10, fontWeight: '700', color: Colors.success },
});

export default AnalyticsScreen;
