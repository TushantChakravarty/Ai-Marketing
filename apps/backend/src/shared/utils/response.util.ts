import { ApiResponse, PaginatedResponse } from '../types';

export function success<T>(data: T, message = 'Success', statusCode = 200): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

export function error(message: string, statusCode = 400, err?: string): ApiResponse<never> {
  return {
    success: false,
    message,
    error: err ?? message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success',
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    message,
    statusCode: 200,
    timestamp: new Date().toISOString(),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export function created<T>(data: T, message = 'Created successfully'): ApiResponse<T> {
  return success(data, message, 201);
}

export function noContent(message = 'Deleted successfully'): ApiResponse<null> {
  return {
    success: true,
    data: null,
    message,
    statusCode: 204,
    timestamp: new Date().toISOString(),
  };
}
