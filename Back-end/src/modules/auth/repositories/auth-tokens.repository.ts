import { ClientSession, Types } from 'mongoose';
import { AuthTokenModel } from '../models/auth-token.model';
import { IAuthTokenDocument, AuthTokenType } from '../types/auth.types';

export class AuthTokensRepository {
  async create(
    data: {
      userId: Types.ObjectId | string;
      type: AuthTokenType;
      tokenHash: string;
      expiresAt: Date;
    },
    options?: { session?: ClientSession },
  ): Promise<IAuthTokenDocument> {
    const token = new AuthTokenModel({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      consumedAt: null,
    });

    return token.save({ session: options?.session });
  }

  async findByTokenHash(
    tokenHash: string,
    type: AuthTokenType,
    options?: { session?: ClientSession },
  ): Promise<IAuthTokenDocument | null> {
    return AuthTokenModel.findOne({ tokenHash, type })
      .session(options?.session || null)
      .exec();
  }

  async consumeToken(
    id: string,
    options?: { session?: ClientSession },
  ): Promise<IAuthTokenDocument | null> {
    return AuthTokenModel.findByIdAndUpdate(
      id,
      { $set: { consumedAt: new Date() } },
      { new: true, session: options?.session },
    ).exec();
  }
}

export const authTokensRepository = new AuthTokensRepository();
