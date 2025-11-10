export const formatCurrency = (
  amount: number | string,
  options?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string => {
  const {
    currency = 'LKR',
    locale = 'en-LK',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options || {};

  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericValue)) return `${currency} 0.00`;

  return `${currency} ${numericValue.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  })}`;
};

/**
 * Formats large numbers into human-readable compact form:
 * 1.2k, 5M, 7.8B, 2.3T, etc.
 */
export const formatCompactNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '')}T`;
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}k`;

  return `${sign}${abs.toFixed(0)}`;
};