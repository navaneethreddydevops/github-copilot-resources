export interface Page<T> {
  data: T[];
  total: number;
}

export interface PageRequest {
  /** 1-based page number. */
  page: number;
  limit: number;
}
