import bcrypt from 'bcryptjs';
import pino from 'pino';
import request from 'supertest';
import { createApp } from '../src/app';
import { Order } from '../src/entities/Order';
import { User } from '../src/entities/User';
import { InMemoryOrderRepository } from '../src/repositories/memory/InMemoryOrderRepository';
import { InMemoryUserRepository } from '../src/repositories/memory/InMemoryUserRepository';

export const TEST_CONFIG = {
  jwtSecret: 'test-secret',
  jwtExpiresIn: 3600,
  corsOrigin: '*',
  logLevel: 'silent',
};

const ADMIN_HASH = bcrypt.hashSync('admin123', 4);
const USER_HASH = bcrypt.hashSync('user123', 4);

function user(id: string, email: string, name: string, role: User['role'], status: User['status'], createdAt: string, deletedAt: string | null = null): User {
  return Object.assign(new User(), {
    id,
    email,
    name,
    role,
    status,
    passwordHash: role === 'admin' ? ADMIN_HASH : USER_HASH,
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    deletedAt: deletedAt ? new Date(deletedAt) : null,
  });
}

function order(id: string, userId: string, status: Order['status'], amount: string, createdAt: string): Order {
  return Object.assign(new Order(), { id, userId, status, amount, createdAt: new Date(createdAt) });
}

/** Mirrors db/init/002-seed.sql. */
export function seedUsers(): User[] {
  return [
    user('1', 'admin@example.com', 'Admin User', 'admin', 'active', '2024-01-01T09:00:00.000Z'),
    user('2', 'alice@example.com', 'Alice Anderson', 'user', 'active', '2024-01-02T10:15:30.123Z'),
    user('3', 'bob@example.com', 'Bob Brown', 'user', 'blocked', '2024-01-03T11:00:00.500Z'),
    user('4', 'carol@example.com', 'Carol Clark', 'user', 'active', '2024-01-04T12:30:00.000Z'),
    user('5', 'dave@example.com', 'dave davis', 'user', 'active', '2024-01-05T13:45:00.000Z'),
    user('6', 'eve@example.com', 'Eve Evans', 'user', 'active', '2024-01-06T14:00:00.000Z', '2024-03-01T00:00:00.000Z'),
  ];
}

export function seedOrders(): Order[] {
  return [
    order('a1b2c3d4-0001-4000-8000-000000000001', '2', 'paid', '19.90', '2024-02-01T10:00:00.000Z'),
    order('a1b2c3d4-0002-4000-8000-000000000002', '2', 'pending', '5.00', '2024-02-02T11:30:00.250Z'),
    order('a1b2c3d4-0003-4000-8000-000000000003', '3', 'expired', '100.00', '2024-02-03T09:15:00.000Z'),
    order('a1b2c3d4-0004-4000-8000-000000000004', '4', 'paid', '1234.50', '2024-02-10T16:45:12.345Z'),
    order('a1b2c3d4-0005-4000-8000-000000000005', '4', 'pending', '0.99', '2024-03-01T08:00:00.000Z'),
    order('a1b2c3d4-0006-4000-8000-000000000006', '1', 'paid', '250.00', '2024-03-15T12:00:00.000Z'),
    order('a1b2c3d4-0007-4000-8000-000000000007', '5', 'expired', '42.10', '2024-04-01T00:00:00.000Z'),
    order('a1b2c3d4-0008-4000-8000-000000000008', '2', 'paid', '7.25', '2024-04-20T18:30:00.999Z'),
  ];
}

export function buildTestApp() {
  const userRepository = new InMemoryUserRepository(seedUsers());
  const orderRepository = new InMemoryOrderRepository(seedOrders());
  const app = createApp({
    userRepository,
    orderRepository,
    config: TEST_CONFIG,
    bcryptRounds: 4,
    logger: pino({ level: 'silent' }),
  });
  return { app, userRepository, orderRepository };
}

export async function login(app: ReturnType<typeof createApp>, email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return res.body.token as string;
}

export const adminToken = (app: ReturnType<typeof createApp>) => login(app, 'admin@example.com', 'admin123');
export const userToken = (app: ReturnType<typeof createApp>) => login(app, 'alice@example.com', 'user123');
