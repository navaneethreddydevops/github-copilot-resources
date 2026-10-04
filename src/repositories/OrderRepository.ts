import type { Order, OrderStatus } from '../entities/Order';
import type { Page, PageRequest } from './types';

export interface OrderQuery extends PageRequest {
  statuses?: OrderStatus[];
  /** Restricts results to one owner (non-admin callers). */
  userId?: string;
  /** Inclusive lower bound on createdAt. */
  from?: Date;
  /** Inclusive upper bound on createdAt. */
  to?: Date;
}

export interface OrderRepository {
  /** Lists orders ordered by createdAt ascending, then id. */
  findPage(query: OrderQuery): Promise<Page<Order>>;
  findById(id: string): Promise<Order | null>;
  /** Marks every pending order created strictly before `cutoff` as expired. Returns affected count. */
  expirePendingOlderThan(cutoff: Date): Promise<number>;
}
