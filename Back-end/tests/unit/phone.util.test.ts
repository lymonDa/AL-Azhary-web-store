import { canonicalizePhone, isValidPhone } from '../../src/modules/users/utils/phone.util';

describe('Phone Utility (Egyptian & International Formats)', () => {
  it('canonicalizes 11-digit Egyptian mobile numbers starting with 010, 011, 012, 015', () => {
    expect(canonicalizePhone('01012345678')).toBe('+201012345678');
    expect(canonicalizePhone('01112345678')).toBe('+201112345678');
    expect(canonicalizePhone('01212345678')).toBe('+201212345678');
    expect(canonicalizePhone('01512345678')).toBe('+201512345678');
  });

  it('canonicalizes formatted Egyptian numbers with spaces and dashes', () => {
    expect(canonicalizePhone('010-1234-5678')).toBe('+201012345678');
    expect(canonicalizePhone('010 1234 5678')).toBe('+201012345678');
    expect(canonicalizePhone('(010) 1234-5678')).toBe('+201012345678');
  });

  it('handles Egyptian numbers with 0020 or 20 prefix', () => {
    expect(canonicalizePhone('00201012345678')).toBe('+201012345678');
    expect(canonicalizePhone('201012345678')).toBe('+201012345678');
    expect(canonicalizePhone('+201012345678')).toBe('+201012345678');
  });

  it('validates canonical Egyptian and international phone numbers', () => {
    expect(isValidPhone('01012345678')).toBe(true);
    expect(isValidPhone('+201012345678')).toBe(true);
    expect(isValidPhone('+12025550123')).toBe(true);

    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('not-a-number')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});
