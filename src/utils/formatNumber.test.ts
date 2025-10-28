import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatWithCommas,
  removeCommas,
  isValidDecimalInput,
  formatMinAmount,
} from './formatNumber';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

// Locale configuration for separators
const localeConfigs = [
  { locale: 'en-US', group: ',', decimal: '.' },
  { locale: 'ja-JP', group: ',', decimal: '.' },
  { locale: 'tr-TR', group: '.', decimal: ',' },
];

describe('formatNumber utilities', () => {
  // Store original navigator.language
  const originalNavigator = global.navigator;

  const mockNavigatorLanguage = (locale: string) => {
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        ...originalNavigator,
        language: locale,
      },
    });
  };

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: originalNavigator,
    });
  });

  describe.each(localeConfigs)(
    'formatWithCommas - $locale',
    ({ locale, group, decimal }) => {
      beforeEach(() => {
        mockNavigatorLanguage(locale);
      });

      it('should format integers with grouping', () => {
        expect(formatWithCommas('1234')).toBe(`1${group}234`);
        expect(formatWithCommas('1234567')).toBe(`1${group}234${group}567`);
        expect(formatWithCommas('1234567890')).toBe(
          `1${group}234${group}567${group}890`,
        );
      });

      it('should format decimals with grouping', () => {
        expect(formatWithCommas('1234.56')).toBe(`1${group}234${decimal}56`);
        expect(formatWithCommas('1234567.89')).toBe(
          `1${group}234${group}567${decimal}89`,
        );
        expect(formatWithCommas('1234.123456')).toBe(
          `1${group}234${decimal}123456`,
        );
      });

      it('should preserve trailing decimal point', () => {
        expect(formatWithCommas('1234.')).toBe(`1${group}234${decimal}`);
        expect(formatWithCommas('123.')).toBe(`123${decimal}`);
      });

      it('should handle small numbers without grouping', () => {
        expect(formatWithCommas('123')).toBe('123');
        expect(formatWithCommas('12.34')).toBe(`12${decimal}34`);
        expect(formatWithCommas('0.123')).toBe(`0${decimal}123`);
      });

      it('should handle zero', () => {
        expect(formatWithCommas('0')).toBe('0');
        expect(formatWithCommas('0.0')).toBe(`0${decimal}0`);
        expect(formatWithCommas('0.00')).toBe(`0${decimal}00`);
      });

      it('should handle empty string', () => {
        expect(formatWithCommas('')).toBe('');
      });
    },
  );

  describe.each(localeConfigs)(
    'removeCommas - $locale',
    ({ locale, group, decimal }) => {
      beforeEach(() => {
        mockNavigatorLanguage(locale);
      });

      it('should remove grouping separators', () => {
        expect(removeCommas(`1${group}234`)).toBe('1234');
        expect(removeCommas(`1${group}234${group}567`)).toBe('1234567');
        expect(removeCommas(`1${group}234${group}567${group}890`)).toBe(
          '1234567890',
        );
      });

      it('should preserve/convert decimal separator to dot', () => {
        expect(removeCommas(`1${group}234${decimal}56`)).toBe('1234.56');
        expect(removeCommas(`1${group}234${group}567${decimal}89`)).toBe(
          '1234567.89',
        );
      });

      it('should handle strings without grouping', () => {
        expect(removeCommas('123')).toBe('123');
        expect(removeCommas(`123${decimal}45`)).toBe('123.45');
      });

      it('should handle empty string', () => {
        expect(removeCommas('')).toBe('');
      });
    },
  );

  describe.each(localeConfigs)(
    'isValidDecimalInput - $locale',
    ({ locale, decimal }) => {
      beforeEach(() => {
        mockNavigatorLanguage(locale);
      });

      it('should accept valid decimal numbers', () => {
        expect(isValidDecimalInput('123')).toBe(true);
        expect(isValidDecimalInput(`123${decimal}456`)).toBe(true);
        expect(isValidDecimalInput(`0${decimal}123`)).toBe(true);
        expect(isValidDecimalInput('0')).toBe(true);
      });

      it('should accept empty string', () => {
        expect(isValidDecimalInput('')).toBe(true);
      });

      it('should accept just decimal separator', () => {
        expect(isValidDecimalInput(decimal)).toBe(true);
      });

      it('should accept trailing decimal separator', () => {
        expect(isValidDecimalInput(`123${decimal}`)).toBe(true);
      });

      it('should accept leading decimal separator', () => {
        expect(isValidDecimalInput(`${decimal}123`)).toBe(true);
      });

      it('should reject negative numbers', () => {
        expect(isValidDecimalInput('-123')).toBe(false);
        expect(isValidDecimalInput(`-0${decimal}5`)).toBe(false);
      });

      it('should reject multiple decimal separators', () => {
        expect(isValidDecimalInput(`12${decimal}34${decimal}56`)).toBe(false);
        expect(isValidDecimalInput(`1${decimal}${decimal}2`)).toBe(false);
      });

      it('should reject non-numeric characters', () => {
        expect(isValidDecimalInput('12a34')).toBe(false);
        expect(isValidDecimalInput('abc')).toBe(false);
      });

      it('should reject wrong decimal separator for locale', () => {
        const wrongDecimal = decimal === '.' ? ',' : '.';
        expect(isValidDecimalInput(`12${wrongDecimal}34`)).toBe(false);
      });

      it('should reject non-string input', () => {
        expect(isValidDecimalInput(123 as any)).toBe(false);
        expect(isValidDecimalInput(null as any)).toBe(false);
        expect(isValidDecimalInput(undefined as any)).toBe(false);
      });
    },
  );

  describe.each(localeConfigs)(
    'formatWithCommas and removeCommas round-trip - $locale',
    ({ locale }) => {
      beforeEach(() => {
        mockNavigatorLanguage(locale);
      });

      it('should round-trip correctly with various inputs', () => {
        const testCases = ['123', '1234', '123456.789', '0.123', '1234567.89'];
        testCases.forEach((value) => {
          const formatted = formatWithCommas(value);
          const restored = removeCommas(formatted);
          expect(restored).toBe(value);
        });
      });
    },
  );

  describe('formatMinAmount', () => {
    it('should ceil values greater than 999', () => {
      const amount1000 = sdkAmount.fromBaseUnits(1000000000n, 6); // 1000
      expect(formatMinAmount(amount1000)).toBe('1000');

      const amount1234 = sdkAmount.fromBaseUnits(1234567890n, 6); // 1234.56789
      expect(formatMinAmount(amount1234)).toBe('1235');

      const amount999_9 = sdkAmount.fromBaseUnits(999900000n, 6); // 999.9
      expect(formatMinAmount(amount999_9)).toBe('1000');
    });

    it('should use toPrecision(3) for values <= 999', () => {
      const amount999 = sdkAmount.fromBaseUnits(999000000n, 6); // 999
      expect(formatMinAmount(amount999)).toBe('999');

      const amount123 = sdkAmount.fromBaseUnits(123456789n, 6); // 123.456789
      expect(formatMinAmount(amount123)).toBe('123');

      const amount12_3 = sdkAmount.fromBaseUnits(12345678n, 6); // 12.345678
      expect(formatMinAmount(amount12_3)).toBe('12.3');

      const amount1_23 = sdkAmount.fromBaseUnits(1234567n, 6); // 1.234567
      expect(formatMinAmount(amount1_23)).toBe('1.23');

      const amount0_123 = sdkAmount.fromBaseUnits(123456n, 6); // 0.123456
      expect(formatMinAmount(amount0_123)).toBe('0.123');

      const amount0_0123 = sdkAmount.fromBaseUnits(12345n, 6); // 0.012345
      expect(formatMinAmount(amount0_0123)).toBe('0.0123');
    });

    it('should handle zero', () => {
      const amountZero = sdkAmount.fromBaseUnits(0n, 6);
      expect(formatMinAmount(amountZero)).toBe('0.00');
    });

    it('should handle amounts with different decimals', () => {
      // 18 decimals (like ETH)
      const amountEth = sdkAmount.fromBaseUnits(1234567890123456789n, 18); // ~1.234 ETH
      expect(formatMinAmount(amountEth)).toBe('1.23');

      // 2 decimals
      const amount2Dec = sdkAmount.fromBaseUnits(12345n, 2); // 123.45
      expect(formatMinAmount(amount2Dec)).toBe('123');
    });
  });
});
