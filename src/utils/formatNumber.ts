import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import Decimal from 'decimal.js';

interface Separators {
  group: string;
  decimal: string;
}

const separatorsCache = new Map<string, Separators>();

const getSeparators = (locale: string): Separators => {
  const cached = separatorsCache.get(locale);
  if (cached) return cached;

  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const separators = {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  };

  separatorsCache.set(locale, separators);
  return separators;
};

/**
 * Get the user's locale from config or DOM, falling back to en-US if not available.
 */
const getUserLocale = (): string =>
  navigator?.language ?? // e.g. "en-US"
  document?.documentElement?.lang ?? // e.g. "en"
  'en-US';

/**
 * Format a numeric string with locale‑aware grouping, preserving any
 * fractional part (including a trailing dot).
 */
export const formatNumberIntl = (value: string): string => {
  if (!value) {
    return '';
  }

  let normalizedValue = value;

  if (value.includes('e') || value.includes('E')) {
    // Handle scientific notation (e.g., '2e-7') by converting to decimal string
    try {
      const decimal = new Decimal(value);
      normalizedValue = decimal.toFixed();
    } catch {
      // noop
    }
  }

  const [integerPart, decimalPart] = normalizedValue.split('.');

  // Use BigInt to handle large numbers without precision loss
  const intNum = integerPart ? BigInt(integerPart) : 0n;

  const locale = getUserLocale();
  const { decimal } = getSeparators(locale);

  // Format the integer part using BigInt
  // Intl.NumberFormat supports BigInt and preserves full precision
  const formattedInt = new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(intNum);

  // Append the locale decimal separator + any digits (or preserve trailing decimal separator)
  // Input is non-localized format, so check for '.' not locale decimal
  if (decimalPart !== undefined || value.endsWith('.')) {
    return formattedInt + decimal + (decimalPart ?? '');
  }

  return formattedInt;
};

/**
 * Strip locale‑specific grouping separators and replace the decimal separator with "."
 * Important: This is required for Number() to parse correctly
 */
export const removeFormatting = (value: string): string => {
  if (!value) {
    return '';
  }

  const locale = getUserLocale();
  const { group, decimal } = getSeparators(locale);

  // Remove grouping separators
  const withoutGroups = value.split(group).join('');
  // Replace locale decimal separator with standard "."
  return withoutGroups.replace(new RegExp(`\\${decimal}`, 'g'), '.');
};

/**
 * Validate raw input as a non‑negative decimal
 * Allows:
 *  - the empty string
 *  - just the locale's decimal separator (for "0," or "0." beginnings)
 *  - any number of digits before/after a single separator
 * * Rejects:
 *  - multiple separators
 *  - non‑digit characters
 *  - leading/trailing non‑digit characters
 */
export const isValidFormattedNumber = (value: string): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  // Remove any locale formatting for validation
  // This includes removing grouping and replacing locale decimal separators
  const nonIntlValue = removeFormatting(value);

  if (nonIntlValue === '' || nonIntlValue === '.') {
    return true;
  }

  const parts = nonIntlValue.split('.');

  // Reject more than one decimal separator
  if (parts.length > 2) {
    return false;
  }

  const [intPart, decPart = ''] = parts;
  // Both sides must be digits only (empty allowed for leading/trailing)
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(decPart)) {
    return false;
  }

  const normalized = parts.join('.');
  const numValue = Number(normalized);
  return Number.isFinite(numValue) && numValue >= 0;
};

// Minimum amounts are approximations anyway so we don't need to display ultra-precise figures here.
// For amounts >  999, we simply round up.
// For amounts <= 999, we use toPrecision(3) which only shows the first 3 non-zero digits.
// This way we're not showing excessive precision for any value
export const formatMinAmount = (minAmount: sdkAmount.Amount): string => {
  const formatted = sdkAmount.display(minAmount);
  // Minimum amounts are approximations so we do a little floating point fudging
  const asNumber = parseFloat(formatted);
  if (asNumber > 999) {
    return Math.ceil(asNumber).toString();
  } else {
    return asNumber.toPrecision(3);
  }
};

/**
 * Format a number with smart precision based on total digits and max decimal digits.
 * If the integer part is less than totalDigits, show decimals up to maxDecimals
 * (limited by remaining space from totalDigits).
 *
 * @param value - The numeric value to format (string or number)
 * @param totalDigits - Maximum total significant digits to display
 * @param maxDecimals - Maximum number of decimal places to show
 * @returns Formatted number string (decimals truncated)
 *
 * @example
 * formatMaxDigits('123.456789', 6, 4)     // '123.456' (3 int + 3 dec = 6 total)
 * formatMaxDigits('123.456789', 8, 4)     // '123.4567' (3 int + 4 dec, limited by maxDecimals)
 * formatMaxDigits('123456.789', 6, 4)     // '123456' (6 int, no space for decimals)
 * formatMaxDigits('1234567.89', 6, 4)     // '1234567' (int exceeds totalDigits, show full int)
 */
export const formatMaxDigits = (
  value: string,
  totalDigits: number,
  maxDecimals: number,
): string => {
  // Parse only for validation (zero/NaN/Infinity check)
  const numValue = parseFloat(value);
  // Handle zero, NaN, and Infinity cases
  if (!Number.isFinite(numValue) || numValue === 0) {
    return '0';
  }

  // Note: We don't use toPrecision() because:
  // 1. It rounds instead of truncates
  // 2. It doesn't respect maxDecimals constraint properly
  // 3. It can return scientific notation for large/small numbers

  // Work with original string to preserve precision (avoid parseFloat precision loss)
  const [intPart, decimalPart] = value.split('.');

  // Get the integer part length (count digits, not including decimal)
  const integerDigits = intPart === '0' ? 1 : intPart.length;

  // If integer part already exceeds or equals totalDigits, return just the integer
  if (integerDigits >= totalDigits) {
    return intPart;
  }

  // Calculate how many decimal places we can show
  const remainingDigits = totalDigits - integerDigits;
  const decimalsToShow = Math.min(remainingDigits, maxDecimals);

  // No decimal part or no space for decimals
  if (!decimalPart || decimalsToShow === 0) {
    return intPart;
  }

  return `${intPart}.${decimalPart.substring(0, decimalsToShow)}`;
};
