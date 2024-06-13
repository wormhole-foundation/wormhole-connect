import { describe, expect, test } from 'vitest';
import { abiVersionMatches } from 'routes/ntt/utils';

describe('NTT ABI version matching', () => {
  test('should return true if major versions match and target minor version is greater, ignoring patch version', () => {
    expect(abiVersionMatches('1.1.0', '1.0.0')).toBeTruthy();
  });

  test('should return true if major, minor, and patch versions match exactly', () => {
    expect(abiVersionMatches('1.0.0', '1.0.0')).toBeTruthy();
  });

  test('should return false if major versions do not match, ignoring minor and patch versions', () => {
    expect(abiVersionMatches('1.0.0', '2.0.0')).toBeFalsy();
  });

  test('should return false if major versions match but target minor version is less, ignoring patch version', () => {
    expect(abiVersionMatches('1.0.0', '1.1.0')).toBeFalsy();
  });

  test('should handle versions with more than one digit correctly, ignoring patch version', () => {
    expect(abiVersionMatches('10.20.0', '10.15.5')).toBeTruthy();
  });

  test('should return false if any version is not in correct format', () => {
    expect(abiVersionMatches('1..0.0', '2.0.0')).toBeFalsy();
    expect(abiVersionMatches('1.0.0', '2..0.0')).toBeFalsy();
  });
});
