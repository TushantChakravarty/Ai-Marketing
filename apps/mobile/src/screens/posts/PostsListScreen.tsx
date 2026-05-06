import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text, FAB, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector } from '../../store';
import { useGetPostsQuery, useDeletePostMutation, usePublishPostMutation } from '../../store/api/posts.api';
import type { PostStatus, PostsStackParamList } from '../../types';
import PostCard from '../../components/posts/PostCard';
import EmptyState from '../../components/common/EmptyState';
import { Colors, Spacing, Radius } from '../../theme';

type PostsNav = StackNavigationProp<PostsStackParamList>;

const FILTERS: { label: string; value: PostStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
  { label: 'Failed', value: 'failed' },
];

const PostsListScreen: React.FC = () => {
  const navigation = useNavigation<PostsNav>();
  const business = useAppSelector(s => s.business.currentBusiness);
  const [activeFilter, setActiveFilter] =
    useState<PostStatus | 'all'>('all');

  const { data, isLoading, refetch } = useGetPostsQuery(
    {
      businessId: business?.id ?? '',
      ...(activeFilter !== 'all' ? { status: activeFilter } : {}),
    },
    { skip: !business?.id },
  );

  const [deletePost] = useDeletePostMutation();
  const [publishPost] = usePublishPostMutation();

  const posts = data?.data ?? [];

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
  };

  const handlePublish = async (postId: string) => {
    await publishPost(postId);
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <Chip
              selected={activeFilter === item.value}
              onPress={() => setActiveFilter(item.value)}
              style={[
                styles.filterChip,
                activeFilter === item.value && styles.filterChipActive,
              ]}
              textStyle={
                activeFilter === item.value
                  ? styles.filterChipTextActive
                  : styles.filterChipText
              }>
              {item.label}
            </Chip>
          )}
        />
      </View>

      {/* Post list */}
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <EmptyState
          iconName="file-document-outline"
          title="No posts found"
          description={
            activeFilter === 'all'
              ? 'Create your first post to get started'
              : `You have no ${activeFilter} posts`
          }
          actionLabel="Create Post"
          onAction={() => navigation.navigate('CreatePost', {})}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          renderItem={({ item: post }) => (
            <PostCard
              post={post}
              onPress={() =>
                navigation.navigate('PostDetail', { postId: post.id })
              }
              onEdit={() =>
                navigation.navigate('CreatePost', { mode: 'manual' })
              }
              onDelete={() => handleDelete(post.id)}
              onPublish={
                (post.platforms[0]?.status ?? post.status) === 'draft'
                  ? () => handlePublish(post.id)
                  : undefined
              }
            />
          )}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.white}
        onPress={() => navigation.navigate('CreatePost', {})}
        label="New Post"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filtersContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  filters: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: { color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
  },
});

export default PostsListScreen;
