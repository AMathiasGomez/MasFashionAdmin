export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: ApiErrorDetail[];
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

