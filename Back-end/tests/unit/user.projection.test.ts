import { toSafeUser } from '../../src/modules/users/utils/user.projection';
import { UserRoles } from '../../src/common/constants/roles';

describe('User Safe Projection', () => {
  it('projects safe fields and strips sensitive credentials and internal metadata', () => {
    const rawUserDoc = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Ahmed Mohamed',
      email: 'ahmed@example.com',
      phone: '+201012345678',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$secretHashValue',
      refreshTokenVersion: 2,
      role: UserRoles.CUSTOMER,
      status: 'active',
      emailVerifiedAt: new Date('2026-09-20T10:00:00.000Z'),
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-20T10:00:00.000Z'),
      internalSecretField: 'should_never_leak',
    };

    const safe = toSafeUser(rawUserDoc);

    expect(safe).toEqual({
      id: '507f1f77bcf86cd799439011',
      name: 'Ahmed Mohamed',
      email: 'ahmed@example.com',
      phone: '+201012345678',
      role: UserRoles.CUSTOMER,
      status: 'active',
      emailVerifiedAt: new Date('2026-09-20T10:00:00.000Z'),
      createdAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-20T10:00:00.000Z'),
    });

    const stringified = JSON.stringify(safe);
    expect(stringified).not.toContain('secretHashValue');
    expect(stringified).not.toContain('passwordHash');
    expect(stringified).not.toContain('refreshTokenVersion');
    expect(stringified).not.toContain('internalSecretField');
  });
});
