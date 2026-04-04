import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAppSelector } from '../../store';
import { useGetDashboardQuery } from '../../store/api/analytics.api';
import { useGetPostsQuery } from '../../store/api/posts.api';
import { PLATFORMS } from '../../config/constants';
import StatCard from '../../components/analytics/StatCard';
import PostCard from '../../components/posts/PostCard';
import EmptyState from '../../components/common/EmptyState';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { formatDate } from '../../utils/format.util';
import dayjs from 'dayjs';
import type { MainDrawerParamList } from '../../types';

type DashboardNav = DrawerNavigationProp<MainDrawerParamList>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNav>();
  const user = useAppSelector(s => s.auth.user);
  const business = useAppSelector(s => s.business.currentBusiness);

  const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = dayjs().format('YYYY-MM-DD');

  const {
    data: dashboardData,
    isLoading: dashLoading,
    refetch: refetchDash,
  } = useGetDashboardQuery(
    { businessId: business?.id ?? '', startDate, endDate },
    { skip: !business?.id },
  );

  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } =
    useGetPostsQuery(
      { businessId: business?.id ?? '', limit: 5 },
      { skip: !business?.id },
    );

  const isRefreshing = dashLoading || postsLoading;

  const onRefresh = () => {
    refetchDash();
    refetchPosts();
  };

  const summary = dashboardData?.data?.summary;
  const recentPosts = postsData?.data ?? [];
  const platformConnections =
    dashboardData?.data?.platformBreakdown ?? [];

  const greetingEmoji =
    dayjs().hour() < 12
      ? '☀️'
      : dayjs().hour() < 17
      ? '👋'
      : '🌙';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greetingEmoji} Hello, {user?.firstName ?? 'there'}
          </Text>
          <Text style={styles.businessName}>{business?.name ?? 'Your Business'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Icon name="menu" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Period */}
      <Text style={styles.period}>
        Last 30 days · {formatDate(startDate)} – {formatDate(endDate)}
      </Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Posts"
          value={summary?.totalPosts ?? 0}
          iconName="file-document-multiple"
          iconColor={Colors.primary}
          style={styles.statCard}
        />
        <StatCard
          title="Total Reach"
          value={summary?.totalReach ?? 0}
          iconName="eye"
          iconColor={Colors.info}
          trend={12.5}
          style={styles.statCard}
        />
        <StatCard
          title="Engagement Rate"
          value={summary?.engagementRate ?? 0}
          iconName="heart-outline"
          iconColor={Colors.secondary}
          isPercentage
          trend={-2.3}
          style={styles.statCard}
        />
        <StatCard
          title="Followers Gained"
          value={summary?.followersGained ?? 0}
          iconName="account-plus"
          iconColor={Colors.success}
          trend={8.1}
          style={styles.statCard}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryAction]}
            onPress={() =>
              navigation.navigate('Tabs', { screen: 'Posts', params: { screen: 'CreatePost', params: { mode: 'manual' } } } as never)
            }>
            <Icon name="pencil" size={22} color={Colors.white} />
            <Text style={styles.actionBtnText}>Create Post</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.aiAction]}
            onPress={() =>
              navigation.navigate('Tabs', { screen: 'Posts', params: { screen: 'CreatePost', params: { mode: 'ai' } } } as never)
            }>
            <Icon name="robot" size={22} color={Colors.white} />
            <Text style={styles.actionBtnText}>AI Generate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Platform Health */}
      {platformConnections.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Health</Text>
          <View style={styles.platformsCard}>
            {PLATFORMS.map((platform, index) => {
              const stats = platformConnections.find(
                p => p.platform === platform.id,
              );
              return (
                <React.Fragment key={platform.id}>
                  <View style={styles.platformRow}>
                    <Icon
                      name={platform.icon}
                      size={20}
                      color={platform.color}
                    />
                    <Text style={styles.platformName}>{platform.name}</Text>
                    <View style={styles.platformStats}>
                      {stats ? (
                        <>
                          <Text style={styles.platformStat}>
                            {stats.followers.toLocaleString()} followers
                          </Text>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: Colors.success },
                            ]}
                          />
                        </>
                      ) : (
                        <>
                          <Text style={styles.platformDisconnected}>
                            Not connected
                          </Text>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: Colors.gray400 },
                            ]}
                          />
                        </>
                      )}
                    </View>
                  </View>
                  {index < PLATFORMS.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      )}

      {/* Recent Posts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Posts</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Tabs', { screen: 'Posts' } as never)
            }>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentPosts.length === 0 && !postsLoading ? (
          <EmptyState
            iconName="file-document-outline"
            title="No posts yet"
            description="Create your first post to get started"
            actionLabel="Create Post"
            onAction={() =>
              navigation.navigate('Tabs', { screen: 'Posts', params: { screen: 'CreatePost' } } as never)
            }
          />
        ) : (
          recentPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onPress={() =>
                navigation.navigate('Tabs', {
                  screen: 'Posts',
                  params: { screen: 'PostDetail', params: { postId: post.id } },
                } as never)
              }
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
    paddingTop: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  businessName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  period: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statCard: {
    flex: 0,
    width: '48%',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  seeAll: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  aiAction: {
    backgroundColor: '#4F46E5',
  },
  actionBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  platformsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  platformName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  platformStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  platformStat: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  platformDisconnected: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray400,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    marginHorizontal: Spacing.base,
  },
});

export default DashboardScreen;
