import { usersRepository, UsersRepository } from '../repositories/users.repository';
import { toSafeUser } from '../utils/user.projection';
import { SafeUser, UpdateProfileInput } from '../types/user.types';
import { NotFoundError, BadRequestError, ConflictError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { canonicalizePhone, isValidPhone } from '../utils/phone.util';

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

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<SafeUser> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData: { name?: string; phone?: string } = {};

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (trimmedName.length < 2) {
        throw new BadRequestError('Name must be at least 2 characters');
      }
      updateData.name = trimmedName;
    }

    if (input.phone !== undefined) {
      const canonicalPhone = canonicalizePhone(input.phone);
      if (!isValidPhone(canonicalPhone)) {
        throw new BadRequestError('Invalid phone number format');
      }

      if (canonicalPhone !== user.phone) {
        const existing = await this.repo.findByPhone(canonicalPhone);
        if (existing && existing._id.toString() !== userId) {
          throw new ConflictError(
            ErrorCodes.RESOURCE_CONFLICT,
            'A user with this phone number already exists',
          );
        }
        updateData.phone = canonicalPhone;
      }
    }

    const updatedUser = await this.repo.updateProfile(userId, updateData);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    return toSafeUser(updatedUser);
  }
}

export const usersService = new UsersService();
