import { usersRepository, UsersRepository } from '../repositories/users.repository';
import { toSafeUser } from '../utils/user.projection';
import { SafeUser } from '../types/user.types';
import { NotFoundError } from '../../../common/errors';

export class UsersService {
  constructor(private readonly repo: UsersRepository = usersRepository) {}

  async getUserById(id: string): Promise<SafeUser> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toSafeUser(user);
  }

  async getUserByEmail(email: string): Promise<SafeUser | null> {
    const user = await this.repo.findByEmail(email);
    if (!user) return null;
    return toSafeUser(user);
  }

  async getUserByPhone(phone: string): Promise<SafeUser | null> {
    const user = await this.repo.findByPhone(phone);
    if (!user) return null;
    return toSafeUser(user);
  }
}

export const usersService = new UsersService();
