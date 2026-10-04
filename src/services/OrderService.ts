import { toOrderDto, type OrderDto } from '../entities/Order';
import { NotFoundError } from '../errors';
import type { OrderRepository } from '../repositories/OrderRepository';
import type { ListOrdersQuery } from '../schemas/orders';
import type { AuthUser } from '../types';
import type { Paged } from './UserService';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class OrderService {
  constructor(private readonly orders: OrderRepository) {}

  /** Admins see every order; other users only their own. */
  async list(query: ListOrdersQuery, caller: AuthUser): Promise<Paged<OrderDto>> {
    const { data, total } = await this.orders.findPage({
      userId: caller.role === 'admin' ? undefined : caller.id,
      page: query.page,
      limit: query.limit,
      statuses: query.status,
      from: query.from,
      to: query.to,
    });
    return { data: data.map(toOrderDto), page: query.page, limit: query.limit, total };
  }

  /** Another user's order is reported as not found, so its existence is not disclosed. */
  async get(id: string, caller: AuthUser): Promise<OrderDto> {
    const order = UUID.test(id) ? await this.orders.findById(id) : null;
    if (!order || (caller.role !== 'admin' && order.userId !== caller.id)) throw new NotFoundError(`Order ${id} not found`);
    return toOrderDto(order);
  }
}
