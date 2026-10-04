import type { User, UserRole, UserStatus } from '../entities/User';
import type { Page, PageRequest } from './types';

export type UserSort = 'name' | '-createdAt';

export interface UserQuery extends PageRequest {
  statuses?: UserStatus[];
  sort?: UserSort;
}

export interface NewUser {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
}

export type UserPatch = Partial<NewUser>;

export interface UserRepository {
  /** Lists non-deleted users. Default order is id ascending. */
  findPage(query: UserQuery): Promise<Page<User>>;
  /** Returns a non-deleted user or null. */
  findById(id: string): Promise<User | null>;
  /** Looks up by email INCLUDING soft-deleted rows (email is unique across all rows). */
  findByEmail(email: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  /** Applies the patch to a non-deleted user; returns null when not found. */
  update(id: string, patch: UserPatch): Promise<User | null>;
  /** Soft-deletes a user; returns false when not found / already deleted. */
  softDelete(id: string): Promise<boolean>;
}
