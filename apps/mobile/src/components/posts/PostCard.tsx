import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Menu, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Post } from '../../types';
import { PLATFORMS } from '../../config/constants';
import { Colors, Spacing, Radius, Shadows, Typography } from '../../theme';
import StatusBadge from './StatusBadge';
import { truncateText, formatScheduled, formatRelativeDate } from '../../utils/format.util';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onEdit,
  onDelete,
  onPublish,
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const timeLabel = post.scheduledAt
    ? formatScheduled(post.scheduledAt)
    : post.publishedAt
    ? formatRelativeDate(post.publishedAt)
    : formatRelativeDate(post.createdAt);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header row */}
      <View style={styles.header}>
        <StatusBadge status={post.platforms[0]?.status ?? post.status ?? 'draft'} />
        <View style={styles.headerRight}>
          {post.mode === 'ai' && (
            <View style={styles.aiBadge}>
              <Icon name="robot" size={12} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={18}
                iconColor={Colors.textSecondary}
                onPress={() => setMenuVisible(true)}
                style={styles.menuBtn}
              />
            }>
            {onEdit && (
              <Menu.Item
                onPress={() => { setMenuVisible(false); onEdit(); }}
                title="Edit"
                leadingIcon="pencil"
              />
            )}
            {onPublish && (post.platforms[0]?.status ?? post.status) === 'draft' && (
              <Menu.Item
                onPress={() => { setMenuVisible(false); onPublish(); }}
                title="Publish Now"
                leadingIcon="send"
              />
            )}
            {onDelete && (
              <Menu.Item
                onPress={() => { setMenuVisible(false); onDelete(); }}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: Colors.error }}
              />
            )}
          </Menu>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>
        {truncateText(post.content.text, 140)}
      </Text>

      {/* Hashtags */}
      {post.content.hashtags.length > 0 && (
        <Text style={styles.hashtags} numberOfLines={1}>
          {post.content.hashtags.map(h => `#${h}`).join(' ')}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {/* Platform icons */}
        <View style={styles.platforms}>
          {post.platforms.map(p => {
            const cfg = PLATFORMS.find(pl => pl.id === p.platform);
            return cfg ? (
              <Icon
                key={p.platform}
                name={cfg.icon}
                size={16}
                color={cfg.color}
                style={styles.platformIcon}
              />
            ) : null;
          })}
        </View>

        {/* Time */}
        <Text style={styles.time}>{timeLabel}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  menuBtn: {
    margin: 0,
  },
  content: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.fontSize.sm * 1.5,
    marginBottom: Spacing.xs,
  },
  hashtags: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  platforms: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  platformIcon: {
    marginRight: 2,
  },
  time: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});

export default PostCard;
