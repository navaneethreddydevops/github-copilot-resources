import { Column, Entity, PrimaryColumn } from 'typeorm';

export type OrderStatus = 'pending' | 'paid' | 'expired';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  /** BIGINT foreign key -> returned by node-postgres as a string. */
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @Column({ type: 'varchar', length: 16 })
  status!: OrderStatus;

  /** NUMERIC(10,2) -> returned by node-postgres as a string such as "19.90". Deliberate pitfall. */
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

export interface OrderDto {
  id: string;
  userId: string;
  status: OrderStatus;
  amount: string;
  createdAt: Date;
}

export function toOrderDto(order: Order): OrderDto {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    amount: order.amount,
    createdAt: order.createdAt,
  };
}
