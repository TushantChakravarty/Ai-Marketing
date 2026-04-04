import apiClient from './api.service';
import { ApiResponse, PaginatedResponse, Post, Platform, PostStatus } from '../types';

export interface CreatePostData {
  businessId: string;
  content: string;
  hashtags?: string[];
  mediaUrls?: string[];
  platforms: Platform[];
  scheduledAt?: string;
  isAiGenerated?: boolean;
  prompt?: string;
  tone?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {}

export interface GetPostsParams {
  businessId: string;
  status?: PostStatus;
  platform?: Platform;
  page?: number;
  limit?: number;
}

export const PostService = {
  async createPost(data: CreatePostData): Promise<ApiResponse<Post>> {
    const response = await apiClient.post<ApiResponse<Post>>('/posts', data);
    return response.data;
  },

  async getPosts(params: GetPostsParams): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<PaginatedResponse<Post>>('/posts', {
      params,
    });
    return response.data;
  },

  async getPost(postId: string): Promise<ApiResponse<Post>> {
    const response = await apiClient.get<ApiResponse<Post>>(`/posts/${postId}`);
    return response.data;
  },

  async updatePost(
    postId: string,
    data: UpdatePostData,
  ): Promise<ApiResponse<Post>> {
    const response = await apiClient.patch<ApiResponse<Post>>(
      `/posts/${postId}`,
      data,
    );
    return response.data;
  },

  async deletePost(postId: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/posts/${postId}`,
    );
    return response.data;
  },

  async publishPost(postId: string): Promise<ApiResponse<Post>> {
    const response = await apiClient.post<ApiResponse<Post>>(
      `/posts/${postId}/publish`,
    );
    return response.data;
  },

  async schedulePost(
    postId: string,
    scheduledAt: string,
  ): Promise<ApiResponse<Post>> {
    const response = await apiClient.post<ApiResponse<Post>>(
      `/posts/${postId}/schedule`,
      { scheduledAt },
    );
    return response.data;
  },

  async republishPost(postId: string): Promise<ApiResponse<Post>> {
    const response = await apiClient.post<ApiResponse<Post>>(
      `/posts/${postId}/republish`,
    );
    return response.data;
  },
};
