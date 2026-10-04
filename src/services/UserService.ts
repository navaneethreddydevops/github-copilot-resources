import bcrypt from 'bcryptjs';
import { toUserDto, type UserDto } from '../entities/User';
import { ConflictError, NotFoundError } from '../errors';
import type { UserPatch, UserRepository } from '../repositories/UserRepository';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from '../schemas/users';

export interface Paged<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

const BIGINT_ID = /^[1-9]\d{0,18}$/;

export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly bcryptRounds = 10,
  ) {}

  async list(query: ListUsersQuery): Promise<Paged<UserDto>> {
    const { data, total } = await this.users.findPage({
      page: query.page,
      limit: query.limit,
      statuses: query.status,
      sort: query.sort,
    });
    return { data: data.map(toUserDto), page: query.page, limit: query.limit, total };
  }

  async get(id: string): Promise<UserDto> {
    // Non-numeric ids would make Postgres throw 22P02 -> treat them as "not found".
    const user = BIGINT_ID.test(id) ? await this.users.findById(id) : null;
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return toUserDto(user);
  }

  async create(input: CreateUserInput): Promise<UserDto> {
    if (await this.users.findByEmail(input.email)) {
      throw new ConflictError('Email already in use');
    }
    const user = await this.users.create({
      email: input.email,
      name: input.name,
      role: input.role,
      status: input.status,
      passwordHash: await bcrypt.hash(input.password, this.bcryptRounds),
    });
    return toUserDto(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserDto> {
    if (!BIGINT_ID.test(id)) throw new NotFoundError(`User ${id} not found`);
    const patch: UserPatch = {};
    if (input.email !== undefined) patch.email = input.email;
    if (input.name !== undefined) patch.name = input.name;
    if (input.role !== undefined) patch.role = input.role;
    if (input.status !== undefined) patch.status = input.status;
    if (input.password !== undefined) patch.passwordHash = await bcrypt.hash(input.password, this.bcryptRounds);

    if (patch.email !== undefined) {
      const other = await this.users.findByEmail(patch.email);
      if (other && other.id !== id) throw new ConflictError('Email already in use');
    }
    const user = await this.users.update(id, patch);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return toUserDto(user);
  }

  async remove(id: string): Promise<void> {
    const deleted = BIGINT_ID.test(id) && (await this.users.softDelete(id));
    if (!deleted) throw new NotFoundError(`User ${id} not found`);
  }
}
