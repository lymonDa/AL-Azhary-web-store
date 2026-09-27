import jwt from 'jsonwebtoken';
import { jwtService } from '../../src/modules/auth/services/jwt.service';
import { env } from '../../src/config/env';
import { UserRoles } from '../../src/common/constants/roles';
import { AppError, UnauthorizedError } from '../../src/common/errors';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('JwtService', () => {
  const claims = {
    sub: '507f1f77bcf86cd799439011',
    role: UserRoles.CUSTOMER,
    sessionId: '507f1f77bcf86cd799439022',
    tokenVersion: 0,
  };

  it('issues a valid HS256 JWT access token with required claims and standard headers', () => {
    const token = jwtService.issueAccessToken(claims);
    expect(typeof token).toBe('string');

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).toBeDefined();
    expect(decoded?.header.alg).toBe('HS256');
    expect(decoded?.payload).toMatchObject({
      sub: claims.sub,
      role: claims.role,
      sessionId: claims.sessionId,
      tokenVersion: claims.tokenVersion,
      iss: env.JWT_ISSUER,
      aud: env.JWT_AUDIENCE,
    });
  });

  it('verifies a valid token and extracts claims successfully', () => {
    const token = jwtService.issueAccessToken(claims);
    const verified = jwtService.verifyAccessToken(token);

    expect(verified.sub).toBe(claims.sub);
    expect(verified.role).toBe(claims.role);
    expect(verified.sessionId).toBe(claims.sessionId);
    expect(verified.tokenVersion).toBe(claims.tokenVersion);
  });

  it('rejects expired tokens with TOKEN_EXPIRED error code', () => {
    const expiredToken = jwt.sign(claims, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: '-10s',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    expect(() => jwtService.verifyAccessToken(expiredToken)).toThrow(UnauthorizedError);
    try {
      jwtService.verifyAccessToken(expiredToken);
    } catch (err: unknown) {
      expect((err as AppError).code).toBe(ErrorCodes.TOKEN_EXPIRED);
    }
  });

  it('rejects tokens signed with wrong secret', () => {
    const invalidSecretToken = jwt.sign(claims, 'wrong_secret_at_least_32_characters_long_123', {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    expect(() => jwtService.verifyAccessToken(invalidSecretToken)).toThrow(UnauthorizedError);
    try {
      jwtService.verifyAccessToken(invalidSecretToken);
    } catch (err: unknown) {
      expect((err as AppError).code).toBe(ErrorCodes.TOKEN_INVALID);
    }
  });

  it('rejects tokens with wrong issuer or audience', () => {
    const wrongIssuerToken = jwt.sign(claims, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: 'wrong-issuer',
      audience: env.JWT_AUDIENCE,
    });

    expect(() => jwtService.verifyAccessToken(wrongIssuerToken)).toThrow(UnauthorizedError);

    const wrongAudienceToken = jwt.sign(claims, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: env.JWT_ISSUER,
      audience: 'wrong-audience',
    });

    expect(() => jwtService.verifyAccessToken(wrongAudienceToken)).toThrow(UnauthorizedError);
  });

  it('rejects tokens with missing required claims', () => {
    const incompleteToken = jwt.sign({ sub: claims.sub }, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: '15m',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    expect(() => jwtService.verifyAccessToken(incompleteToken)).toThrow(UnauthorizedError);
  });
});
