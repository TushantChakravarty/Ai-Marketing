import { baseApi } from './base.api';
import { ApiResponse, PaginatedResponse, Post, Platform, PostStatus } from '../../types';

interface CreatePostData {
  businessId: string;
  text: string;
  hashtags?: string[];
  mediaUrls?: string[];
  platforms?: Platform[];
  mode?: 'manual' | 'ai';
  aiPrompt?: string;
}

interface GetPostsParams {
  businessId: string;
  status?: PostStatus;
  platform?: Platform;
  page?: number;
  limit?: number;
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    createPost: builder.mutation<ApiResponse<Post>, CreatePostData>({
      query: data => ({
        url: '/posts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Post'],
    }),

    getPosts: builder.query<PaginatedResponse<Post>, GetPostsParams>({
      query: params => ({ url: '/posts', params }),
      providesTags: ['Post'],
    }),

    getPost: builder.query<ApiResponse<Post>, string>({
      query: id => `/posts/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Post', id }],
    }),

    updatePost: builder.mutation<
      ApiResponse<Post>,
      { id: string; data: Partial<CreatePostData> }
    >({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Post', id },
        'Post',
      ],
    }),

    deletePost: builder.mutation<ApiResponse<null>, string>({
      query: id => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Post'],
    }),

    publishPost: builder.mutation<ApiResponse<Post>, string>({
      query: id => ({ url: `/posts/${id}/publish`, method: 'POST' }),
      invalidatesTags: (_result, _err, id) => [{ type: 'Post', id }, 'Post'],
    }),

    schedulePost: builder.mutation<
      ApiResponse<Post>,
      { id: string; scheduledAt: string }
    >({
      query: ({ id, scheduledAt }) => ({
        url: `/posts/${id}/schedule`,
        method: 'POST',
        body: { scheduledAt },
      }),
      invalidatesTags: ['Post'],
    }),
  }),
});

export const {
  useCreatePostMutation,
  useGetPostsQuery,
  useGetPostQuery,
  useUpdatePostMutation,
  useDeletePostMutation,
  usePublishPostMutation,
  useSchedulePostMutation,
} = postsApi;
