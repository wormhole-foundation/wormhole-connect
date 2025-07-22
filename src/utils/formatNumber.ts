import config from 'config';

const getUserLocale = (): string => {
  return (
    config?.locale ||
    (typeof document !== 'undefined' && document.documentElement.lang) ||
    (typeof navigator !== 'undefined' && navigator.language) ||
    'en-US'
  );
};

export const formatWithCommas = (value: string): string => {
  if (!value) return '';

  const locale = getUserLocale();
  const integerFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  });

  const [integerPart, decimalPart] = value.split('.');
  let formatted = integerFormatter.format(parseInt(integerPart) || 0);

  // Add decimal part preserving all digits
  if (decimalPart !== undefined || value.endsWith('.')) {
    formatted += '.' + (decimalPart || '');
  }

  return formatted;
};

export const removeCommas = (value: string): string => {
  if (!value) return '';

  const locale = getUserLocale();
  const thousand = (1000).toLocaleString(locale).charAt(1);
  const decimal = (1.1).toLocaleString(locale).charAt(1);

  return value.split(thousand).join('').replace(decimal, '.');
};
