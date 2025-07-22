import { useMemo } from 'react';
import config from 'config';

const getUserLocale = (): string => {
  return (
    config?.locale ||
    (typeof document !== 'undefined' && document.documentElement.lang) ||
    (typeof navigator !== 'undefined' && navigator.language) ||
    'en-US'
  );
};

export const useNumberFormatter = (): {
  locale: string;
  formatWithCommas: (value: string) => string;
  removeCommas: (value: string) => string;
} => {
  return useMemo(() => {
    const locale = getUserLocale();

    // Get locale-specific separators
    const thousand = (1000).toLocaleString(locale).charAt(1);
    const decimal = (1.1).toLocaleString(locale).charAt(1);

    const integerFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    });

    const formatWithCommas = (value: string): string => {
      if (!value) return '';

      const [integerPart, decimalPart] = value.split('.');
      let formatted = integerFormatter.format(parseInt(integerPart) || 0);

      // Add decimal part preserving all digits
      if (decimalPart !== undefined || value.endsWith('.')) {
        formatted += decimal + (decimalPart || '');
      }

      return formatted;
    };

    const removeCommas = (value: string): string => {
      if (!value) return '';

      return value.split(thousand).join('').replace(decimal, '.');
    };

    return {
      locale,
      formatWithCommas,
      removeCommas,
    };
  }, []);
};
