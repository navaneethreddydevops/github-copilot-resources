import { DataSource, Repository } from 'typeorm';
import { Order } from '../../entities/Order';
import type { OrderQuery, OrderRepository } from '../OrderRepository';
import type { Page } from '../types';

export class TypeOrmOrderRepository implements OrderRepository {
  private readonly repo: Repository<Order>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Order);
  }

  async findPage(query: OrderQuery): Promise<Page<Order>> {
    const qb = this.repo.createQueryBuilder('o');
    if (query.userId) qb.andWhere('o.userId = :userId', { userId: query.userId });
    if (query.statuses && query.statuses.length > 0) {
      qb.andWhere('o.status IN (:...statuses)', { statuses: query.statuses });
    }
    if (query.from) qb.andWhere('o.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('o.createdAt <= :to', { to: query.to });
    qb.orderBy('o.createdAt', 'ASC')
      .addOrderBy('o.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  findById(id: string): Promise<Order | null> {
    return this.repo.findOne({ where: { id } });
  }

  async expirePendingOlderThan(cutoff: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Order)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'pending' })
      .andWhere('created_at < :cutoff', { cutoff })
      .execute();
    return result.affected ?? 0;
  }
}
