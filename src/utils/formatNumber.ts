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
export const formatWithCommas = (value: string): string => {
  if (!value) {
    return '';
  }

  const locale = getUserLocale();
  const { decimal } = getSeparators(locale);

  const [integerPart, decimalPart] = value.split('.');
  const intNum = parseInt(integerPart, 10) || 0;

  const formattedInt = new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(intNum);

  // Append the locale decimal separator + any digits (or preserve trailing ".")
  if (decimalPart !== undefined || value.endsWith('.')) {
    return formattedInt + decimal + (decimalPart ?? '');
  }

  return formattedInt;
};

/**
 * Strip locale‑specific grouping separators and convert the decimal
 * separator to "." so Number() will parse correctly.
 */
export const removeCommas = (value: string): string => {
  if (!value) {
    return '';
  }

  const locale = getUserLocale();
  const { group, decimal } = getSeparators(locale);

  const withoutGroups = value.split(group).join('');
  return withoutGroups.replace(new RegExp(`\\${decimal}`, 'g'), '.');
};

/**
 * Validate raw input as a non‑negative decimal
 * Allows:
 *  - the empty string
 *  - just the locale’s decimal separator (for "0," or "0." beginnings)
 *  - any number of digits before/after a single separator
 * * Rejects:
 *  - multiple separators
 *  - non‑digit characters
 *  - leading/trailing non‑digit characters
 */
export const isValidDecimalInput = (value: string): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  const locale = getUserLocale();
  const { decimal } = getSeparators(locale);

  if (value === '' || value === decimal) {
    return true;
  }

  const parts = value.split(decimal);

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
