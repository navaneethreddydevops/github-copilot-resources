import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { User } from '../../entities/User';
import { ConflictError } from '../../errors';
import type { Page } from '../types';
import type { NewUser, UserPatch, UserQuery, UserRepository } from '../UserRepository';

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return err instanceof QueryFailedError && (err.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION;
}

export class TypeOrmUserRepository implements UserRepository {
  private readonly repo: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(User);
  }

  async findPage(query: UserQuery): Promise<Page<User>> {
    // createQueryBuilder excludes soft-deleted rows (deleted_at IS NULL) automatically.
    const qb = this.repo.createQueryBuilder('u');
    if (query.statuses && query.statuses.length > 0) {
      qb.andWhere('u.status IN (:...statuses)', { statuses: query.statuses });
    }
    if (query.sort === 'name') {
      qb.orderBy('u.name', 'ASC').addOrderBy('u.id', 'ASC');
    } else if (query.sort === '-createdAt') {
      qb.orderBy('u.createdAt', 'DESC').addOrderBy('u.id', 'DESC');
    } else {
      qb.orderBy('u.id', 'ASC');
    }
    qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email }, withDeleted: true });
  }

  async create(data: NewUser): Promise<User> {
    try {
      const saved = await this.repo.save(this.repo.create(data));
      // Re-read so DB defaults (created_at/updated_at) are populated consistently.
      return (await this.findById(saved.id)) as User;
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError('Email already in use');
      throw err;
    }
  }

  async update(id: string, patch: UserPatch): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    if (Object.keys(patch).length > 0) {
      try {
        // QueryBuilder/Repository.update also bumps the @UpdateDateColumn.
        await this.repo.update({ id }, patch);
      } catch (err) {
        if (isUniqueViolation(err)) throw new ConflictError('Email already in use');
        throw err;
      }
    }
    return this.findById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.softDelete({ id });
    return (result.affected ?? 0) > 0;
  }
}
