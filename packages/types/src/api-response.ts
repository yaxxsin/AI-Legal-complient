/** Standard success response from API */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/** Standard error response from API */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Union type for all API responses */
export type ApiResult<T> = ApiResponse<T> | ApiError;
