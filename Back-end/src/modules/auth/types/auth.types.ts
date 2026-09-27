import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/constants/roles';

export interface AccessClaims {
  sub: string;
  role: UserRole;
  sessionId: string;
  tokenVersion: number;
}

export interface AuthenticatedPrincipal {
  userId: string;
  role: UserRole;
  sessionId: string;
  tokenVersion: number;
}

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent: string;
  ipHash: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
  sessionVersion: number;
  updatedAt: Date;
}

export type ISessionDocument = ISession & Document<Types.ObjectId>;

export type AuthTokenType = 'email_verification' | 'password_reset';

export interface IAuthToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: AuthTokenType;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IAuthTokenDocument = IAuthToken & Document<Types.ObjectId>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedPrincipal;
      auth?: AuthenticatedPrincipal;
    }
  }
}
