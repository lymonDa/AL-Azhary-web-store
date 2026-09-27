import { ClientSession, Types } from 'mongoose';
import { SessionModel } from '../models/session.model';
import { ISessionDocument } from '../types/auth.types';

export class SessionsRepository {
  async create(
    data: {
      userId: Types.ObjectId | string;
      tokenHash: string;
      expiresAt: Date;
      userAgent?: string;
      ipHash?: string | null;
      sessionVersion?: number;
    },
    options?: { session?: ClientSession },
  ): Promise<ISessionDocument> {
    const session = new SessionModel({
      userId: new Types.ObjectId(data.userId),
      tokenHash: data.tokenHash,
      userAgent: data.userAgent ?? '',
      ipHash: data.ipHash ?? null,
      expiresAt: data.expiresAt,
      sessionVersion: data.sessionVersion ?? 1,
      lastUsedAt: new Date(),
      revokedAt: null,
      revokeReason: null,
    });

    return session.save({ session: options?.session });
  }

  async findByTokenHash(
    tokenHash: string,
    options?: { session?: ClientSession },
  ): Promise<ISessionDocument | null> {
    return SessionModel.findOne({ tokenHash })
      .session(options?.session || null)
      .exec();
  }

  async findById(
    id: string,
    options?: { session?: ClientSession },
  ): Promise<ISessionDocument | null> {
    return SessionModel.findById(id)
      .session(options?.session || null)
      .exec();
  }

  async updateTokenHash(
    id: string,
    newTokenHash: string,
    newExpiresAt: Date,
    options?: { session?: ClientSession },
  ): Promise<ISessionDocument | null> {
    return SessionModel.findByIdAndUpdate(
      id,
      {
        $set: {
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
          lastUsedAt: new Date(),
        },
      },
      { new: true, session: options?.session },
    ).exec();
  }

  async revokeById(
    id: string,
    reason: string = 'logout',
    options?: { session?: ClientSession },
  ): Promise<void> {
    await SessionModel.findByIdAndUpdate(
      id,
      {
        $set: {
          revokedAt: new Date(),
          revokeReason: reason,
        },
      },
      { session: options?.session },
    ).exec();
  }

  async revokeAllByUserId(
    userId: string,
    reason: string = 'global_logout',
    options?: { session?: ClientSession },
  ): Promise<void> {
    await SessionModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          revokeReason: reason,
        },
      },
      { session: options?.session },
    ).exec();
  }
}

export const sessionsRepository = new SessionsRepository();
