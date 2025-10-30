import { amount as sdkAmount } from '@wormhole-foundation/sdk';

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

  const [integerPart, decimalPart] = value.split('.');
  const intNum = parseInt(integerPart, 10) || 0;

  const locale = getUserLocale();
  const { decimal } = getSeparators(locale);

  // Format the integer part
  // Intl.NumberFormat could be used to format the whole number,
  // but we need to preserve trailing decimal points as user types.
  // That's why we split and format only the integer part here.
  const formattedInt = new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(intNum);

  // Append the locale decimal separator + any digits (or preserve trailing decimal separator)
  if (decimalPart !== undefined || value.endsWith(decimal)) {
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
