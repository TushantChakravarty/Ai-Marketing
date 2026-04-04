import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useGetPostQuery, useDeletePostMutation, usePublishPostMutation } from '../../store/api/posts.api';
import type { PostsStackParamList } from '../../types';
import StatusBadge from '../../components/posts/StatusBadge';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import { PLATFORMS } from '../../config/constants';
import { formatDate, formatNumber } from '../../utils/format.util';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

type RouteProps = RouteProp<PostsStackParamList, 'PostDetail'>;
type NavProps = StackNavigationProp<PostsStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { postId } = route.params;

  const { data, isLoading, error } = useGetPostQuery(postId);
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [publishPost, { isLoading: isPublishing }] = usePublishPostMutation();

  const post = data?.data;

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId).unwrap();
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete post.');
          }
        },
      },
    ]);
  }, [postId, deletePost, navigation]);

  const handleRepublish = useCallback(async () => {
    try {
      await publishPost(postId).unwrap();
      Alert.alert('Success', 'Post republished successfully!');
    } catch {
      Alert.alert('Error', 'Failed to republish post.');
    }
  }, [postId, publishPost]);

  if (isLoading) return <LoadingOverlay visible />;
  if (error || !post)
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="Post Not Found"
        description="This post could not be loaded."
        actionLabel="Go Back"
        onAction={() => navigation.goBack()}
      />
    );

  const totalLikes = post.platformStatuses?.reduce(
    (sum, p) => sum + (p.engagement?.likes ?? 0),
    0,
  ) ?? 0;
  const totalComments = post.platformStatuses?.reduce(
    (sum, p) => sum + (p.engagement?.comments ?? 0),
    0,
  ) ?? 0;
  const totalShares = post.platformStatuses?.reduce(
    (sum, p) => sum + (p.engagement?.shares ?? 0),
    0,
  ) ?? 0;
  const totalReach = post.platformStatuses?.reduce(
    (sum, p) => sum + (p.engagement?.reach ?? 0),
    0,
  ) ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <StatusBadge status={post.status} />
          {post.isAiGenerated && (
            <View style={styles.aiBadge}>
              <Icon name="robot" size={12} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI Generated</Text>
            </View>
          )}
        </View>

        <Text style={styles.contentText}>{post.content}</Text>

        {post.hashtags?.length > 0 && (
          <Text style={styles.hashtags}>
            {post.hashtags.map((h: string) => `#${h}`).join(' ')}
          </Text>
        )}

        {post.scheduledAt && (
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {post.status === 'scheduled' ? 'Scheduled for ' : 'Published '}
              {formatDate(post.scheduledAt)}
            </Text>
          </View>
        )}
      </View>

      {/* Platform Status */}
      <Text style={styles.sectionTitle}>Platforms</Text>
      {post.platformStatuses?.map((ps: any) => {
        const platformConfig = PLATFORMS.find(p => p.id === ps.platform);
        return (
          <View key={ps.platform} style={styles.platformCard}>
            <View style={styles.platformHeader}>
              <View style={[styles.platformIcon, { backgroundColor: platformConfig?.color + '20' }]}>
                <Icon name={platformConfig?.icon ?? 'circle'} size={20} color={platformConfig?.color} />
              </View>
              <Text style={styles.platformName}>{platformConfig?.name}</Text>
              <StatusBadge status={ps.status} />
            </View>
            {ps.status === 'failed' && ps.error && (
              <Text style={styles.errorText}>{ps.error}</Text>
            )}
            {ps.engagement && (
              <View style={styles.engagementRow}>
                <EngagementStat icon="heart-outline" value={ps.engagement.likes} label="Likes" />
                <EngagementStat icon="comment-outline" value={ps.engagement.comments} label="Comments" />
                <EngagementStat icon="share-outline" value={ps.engagement.shares} label="Shares" />
                <EngagementStat icon="eye-outline" value={ps.engagement.reach} label="Reach" />
              </View>
            )}
          </View>
        );
      })}

      {/* Aggregate Stats */}
      {(totalLikes + totalComments + totalShares + totalReach) > 0 && (
        <>
          <Text style={styles.sectionTitle}>Total Engagement</Text>
          <View style={styles.statsGrid}>
            <StatGridItem icon="heart" value={totalLikes} label="Likes" color={Colors.error} />
            <StatGridItem icon="comment" value={totalComments} label="Comments" color={Colors.info} />
            <StatGridItem icon="share" value={totalShares} label="Shares" color={Colors.success} />
            <StatGridItem icon="eye" value={totalReach} label="Reach" color={Colors.primary} />
          </View>
        </>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {(post.status === 'failed' || post.status === 'draft') && (
          <Button
            label="Publish Now"
            onPress={handleRepublish}
            variant="primary"
            icon="send"
            isLoading={isPublishing}
            fullWidth
            style={styles.actionBtn}
          />
        )}
        <Button
          label="Delete Post"
          onPress={handleDelete}
          variant="outline"
          icon="trash-can-outline"
          isLoading={isDeleting}
          fullWidth
          style={[styles.actionBtn, styles.deleteBtn]}
        />
      </View>
    </ScrollView>
  );
};

const EngagementStat: React.FC<{ icon: string; value: number; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <View style={styles.engagementStat}>
    <Icon name={icon} size={14} color={Colors.textSecondary} />
    <Text style={styles.engagementValue}>{formatNumber(value)}</Text>
    <Text style={styles.engagementLabel}>{label}</Text>
  </View>
);

const StatGridItem: React.FC<{
  icon: string;
  value: number;
  label: string;
  color: string;
}> = ({ icon, value, label, color }) => (
  <View style={styles.statGridItem}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{formatNumber(value)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadows.sm,
    marginBottom: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  aiBadgeText: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontWeight: '600' },
  contentText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  hashtags: { fontSize: Typography.fontSize.sm, color: Colors.primary, marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  infoText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  platformCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  platformHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  platformIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  platformName: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: '600', color: Colors.textPrimary },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.error, marginBottom: Spacing.sm },
  engagementRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  engagementStat: { alignItems: 'center', gap: 2 },
  engagementValue: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  engagementLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statGridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  statIcon: { width: 44, height: 44, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  actions: { gap: Spacing.sm, marginTop: Spacing.base },
  actionBtn: {},
  deleteBtn: { borderColor: Colors.error },
});

export default PostDetailScreen;
