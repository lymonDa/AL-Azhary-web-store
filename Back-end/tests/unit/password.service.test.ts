import { passwordService } from '../../src/modules/auth/services/password.service';

describe('PasswordService (Argon2id)', () => {
  it('hashes password with Argon2id and verifies successfully', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).toMatch(/^\$argon2id\$/);

    const isValid = await passwordService.verifyPassword(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect password verification', async () => {
    const rawPassword = 'CorrectPassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    const isWrongValid = await passwordService.verifyPassword(hash, 'WrongPassword123!');
    expect(isWrongValid).toBe(false);
  });

  it('returns false safely when hash format is malformed', async () => {
    const isMalformedValid = await passwordService.verifyPassword('invalid_hash_string', 'password');
    expect(isMalformedValid).toBe(false);
  });
});
