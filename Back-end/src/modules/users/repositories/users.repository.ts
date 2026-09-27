import { ClientSession } from 'mongoose';
import { UserModel } from '../models/user.model';
import { IUserDocument, CreateUserInput } from '../types/user.types';
import { UserRoles } from '../../../common/constants/roles';

export class UsersRepository {
  async findById(
    id: string,
    options?: { session?: ClientSession; selectPassword?: boolean },
  ): Promise<IUserDocument | null> {
    const query = UserModel.findById(id).session(options?.session || null);
    if (options?.selectPassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findByEmail(
    email: string,
    options?: { session?: ClientSession; selectPassword?: boolean },
  ): Promise<IUserDocument | null> {
    const query = UserModel.findOne({ email }).session(options?.session || null);
    if (options?.selectPassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findByPhone(
    phone: string,
    options?: { session?: ClientSession; selectPassword?: boolean },
  ): Promise<IUserDocument | null> {
    const query = UserModel.findOne({ phone }).session(options?.session || null);
    if (options?.selectPassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findByIdentifier(
    identifier: string,
    options?: { session?: ClientSession; selectPassword?: boolean },
  ): Promise<IUserDocument | null> {
    const query = UserModel.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).session(options?.session || null);
    if (options?.selectPassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async create(
    data: CreateUserInput,
    options?: { session?: ClientSession },
  ): Promise<IUserDocument> {
    // Explicit construction to prevent mass-assignment
    const user = new UserModel({
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role ?? UserRoles.CUSTOMER,
      status: data.status ?? 'active',
      emailVerifiedAt: data.emailVerifiedAt ?? null,
      refreshTokenVersion: 0,
      lastLoginAt: null,
    });

    return user.save({ session: options?.session });
  }

  async updateLastLogin(id: string, options?: { session?: ClientSession }): Promise<void> {
    await UserModel.findByIdAndUpdate(
      id,
      { $set: { lastLoginAt: new Date() } },
      { session: options?.session },
    ).exec();
  }

  async incrementRefreshTokenVersion(
    id: string,
    options?: { session?: ClientSession },
  ): Promise<number | null> {
    const updated = await UserModel.findByIdAndUpdate(
      id,
      { $inc: { refreshTokenVersion: 1 } },
      { new: true, session: options?.session },
    ).exec();
    return updated ? updated.refreshTokenVersion : null;
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    options?: { session?: ClientSession },
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(
      id,
      { $set: { passwordHash } },
      { session: options?.session },
    ).exec();
  }

  async updateEmailVerified(
    id: string,
    emailVerifiedAt: Date = new Date(),
    options?: { session?: ClientSession },
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(
      id,
      { $set: { emailVerifiedAt } },
      { new: true, session: options?.session },
    ).exec();
  }
}

export const usersRepository = new UsersRepository();
