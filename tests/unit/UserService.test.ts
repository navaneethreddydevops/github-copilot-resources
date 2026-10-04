import bcrypt from 'bcryptjs';
import { ConflictError, NotFoundError } from '../../src/errors';
import { InMemoryUserRepository } from '../../src/repositories/memory/InMemoryUserRepository';
import { UserService } from '../../src/services/UserService';
import { seedUsers } from '../helpers';

describe('UserService', () => {
  let repo: InMemoryUserRepository;
  let service: UserService;

  beforeEach(() => {
    repo = new InMemoryUserRepository(seedUsers());
    service = new UserService(repo, 4);
  });

  it('hashes the password on create and never exposes it', async () => {
    const dto = await service.create({ email: 'n@example.com', name: 'N', password: 'password1', role: 'user', status: 'active' });
    expect(dto).not.toHaveProperty('passwordHash');
    const stored = await repo.findById(dto.id);
    expect(stored!.passwordHash).not.toBe('password1');
    expect(await bcrypt.compare('password1', stored!.passwordHash)).toBe(true);
  });

  it('throws ConflictError for a duplicate email', async () => {
    await expect(
      service.create({ email: 'alice@example.com', name: 'A', password: 'password1', role: 'user', status: 'active' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws NotFoundError for unknown or malformed ids', async () => {
    await expect(service.get('42')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.get('1; DROP TABLE users')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.remove('0')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('list returns the paging envelope', async () => {
    const page = await service.list({ page: 1, limit: 2, status: ['active'] });
    expect(page).toMatchObject({ page: 1, limit: 2, total: 4 });
    expect(page.data.map((u) => u.id)).toEqual(['1', '2']);
  });
});
