import { decrypt, encrypt } from './crypto';

describe('Crypto', () => {
  it('should do normal encoding fine', () => {
    const secretText = 'hello';
    const encrypted = encrypt(secretText);
    expect(decrypt(encrypted)).toEqual(secretText);
  });

  it('should encode special characters fine', () => {
    const secretText = 'ÅÄÖåäö!"#€%&/()=? 😅';
    const encrypted = encrypt(secretText);
    expect(decrypt(encrypted)).toEqual(secretText);
  });

  it('should handle empty values', () => {
    const encrypted = encrypt(null);
    expect(encrypted).toEqual(null);
    expect(decrypt(encrypted)).toEqual(null);
  });
});
