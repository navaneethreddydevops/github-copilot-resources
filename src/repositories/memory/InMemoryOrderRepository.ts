import { Order } from '../../entities/Order';
import type { OrderQuery, OrderRepository } from '../OrderRepository';
import type { Page } from '../types';

function clone(order: Order): Order {
  return Object.assign(new Order(), { ...order, createdAt: new Date(order.createdAt) });
}

/** In-memory OrderRepository used by tests; mirrors the TypeORM/Postgres semantics. */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly rows = new Map<string, Order>();

  constructor(seed: Order[] = []) {
    for (const order of seed) this.rows.set(order.id, clone(order));
  }

  async findPage(query: OrderQuery): Promise<Page<Order>> {
    let rows = [...this.rows.values()];
    if (query.userId) rows = rows.filter((o) => o.userId === query.userId);
    if (query.statuses && query.statuses.length > 0) {
      const wanted = new Set(query.statuses);
      rows = rows.filter((o) => wanted.has(o.status));
    }
    if (query.from) rows = rows.filter((o) => o.createdAt.getTime() >= query.from!.getTime());
    if (query.to) rows = rows.filter((o) => o.createdAt.getTime() <= query.to!.getTime());
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const start = (query.page - 1) * query.limit;
    return { data: rows.slice(start, start + query.limit).map(clone), total: rows.length };
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.rows.get(id);
    return order ? clone(order) : null;
  }

  async expirePendingOlderThan(cutoff: Date): Promise<number> {
    let affected = 0;
    for (const order of this.rows.values()) {
      if (order.status === 'pending' && order.createdAt.getTime() < cutoff.getTime()) {
        order.status = 'expired';
        affected++;
      }
    }
    return affected;
  }
}
