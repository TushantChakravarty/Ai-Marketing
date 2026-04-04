import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PostsStackParamList } from './types';
import PostsListScreen from '../screens/posts/PostsListScreen';
import CreatePostScreen from '../screens/posts/CreatePostScreen';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import { Colors } from '../theme';

const Stack = createStackNavigator<PostsStackParamList>();

const PostsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.primary,
        headerTitleStyle: {
          fontWeight: '600',
          color: Colors.textPrimary,
        },
      }}>
      <Stack.Screen
        name="PostsList"
        component={PostsListScreen}
        options={{ title: 'My Posts' }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: 'Create Post' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post Details' }}
      />
    </Stack.Navigator>
  );
};

export default PostsNavigator;
