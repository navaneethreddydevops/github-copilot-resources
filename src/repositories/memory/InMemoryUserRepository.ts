import { User } from '../../entities/User';
import { ConflictError } from '../../errors';
import type { Page } from '../types';
import type { NewUser, UserPatch, UserQuery, UserRepository } from '../UserRepository';

function clone(user: User): User {
  return Object.assign(new User(), {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
    deletedAt: user.deletedAt ? new Date(user.deletedAt) : null,
  });
}

function compare(a: string | number, b: string | number): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** In-memory UserRepository used by tests; mirrors the TypeORM/Postgres semantics. */
export class InMemoryUserRepository implements UserRepository {
  private readonly rows = new Map<string, User>();
  private nextId = 1;

  constructor(seed: User[] = [], private readonly clock: () => Date = () => new Date()) {
    for (const user of seed) {
      this.rows.set(user.id, clone(user));
      this.nextId = Math.max(this.nextId, Number(user.id) + 1);
    }
  }

  private live(): User[] {
    return [...this.rows.values()].filter((u) => u.deletedAt === null);
  }

  async findPage(query: UserQuery): Promise<Page<User>> {
    let rows = this.live();
    if (query.statuses && query.statuses.length > 0) {
      const wanted = new Set(query.statuses);
      rows = rows.filter((u) => wanted.has(u.status));
    }
    rows.sort((a, b) => {
      if (query.sort === 'name') return compare(a.name, b.name) || compare(Number(a.id), Number(b.id));
      if (query.sort === '-createdAt') {
        return compare(b.createdAt.getTime(), a.createdAt.getTime()) || compare(Number(b.id), Number(a.id));
      }
      return compare(Number(a.id), Number(b.id));
    });
    const start = (query.page - 1) * query.limit;
    return { data: rows.slice(start, start + query.limit).map(clone), total: rows.length };
  }

  async findById(id: string): Promise<User | null> {
    const user = this.rows.get(id);
    return user && user.deletedAt === null ? clone(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = [...this.rows.values()].find((u) => u.email === email);
    return user ? clone(user) : null;
  }

  async create(data: NewUser): Promise<User> {
    if ([...this.rows.values()].some((u) => u.email === data.email)) {
      throw new ConflictError('Email already in use');
    }
    const now = this.clock();
    const user = Object.assign(new User(), {
      ...data,
      id: String(this.nextId++),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    this.rows.set(user.id, user);
    return clone(user);
  }

  async update(id: string, patch: UserPatch): Promise<User | null> {
    const user = this.rows.get(id);
    if (!user || user.deletedAt !== null) return null;
    if (patch.email !== undefined && [...this.rows.values()].some((u) => u.email === patch.email && u.id !== id)) {
      throw new ConflictError('Email already in use');
    }
    if (Object.keys(patch).length > 0) {
      Object.assign(user, patch, { updatedAt: this.clock() });
    }
    return clone(user);
  }

  async softDelete(id: string): Promise<boolean> {
    const user = this.rows.get(id);
    if (!user || user.deletedAt !== null) return false;
    user.deletedAt = this.clock();
    return true;
  }
}
