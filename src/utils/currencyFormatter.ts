/**
 * Currency formatting utilities for Tunisian Dinar (TND)
 */

export interface CurrencyInfo {
  symbol: string;
  name: string;
  code: string;
  position: 'before' | 'after';
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
}

export const TND_CURRENCY: CurrencyInfo = {
  symbol: 'د.ت',
  name: 'Tunisian Dinar',
  code: 'TND',
  position: 'after',
  decimals: 3, // Tunisian Dinar uses 3 decimal places (millimes)
  thousandsSeparator: ' ',
  decimalSeparator: ','
};

/**
 * Format a number as Tunisian Dinar currency
 */
export const formatCurrency = (amount: number): string => {
  const currency = TND_CURRENCY;

  // Format the number with appropriate decimal places
  const formattedNumber = amount.toFixed(currency.decimals);

  // Split into integer and decimal parts
  const [integerPart, decimalPart] = formattedNumber.split('.');

  // Add thousands separator
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);

  // Combine with decimal separator
  const fullNumber = decimalPart
    ? `${formattedInteger}${currency.decimalSeparator}${decimalPart}`
    : formattedInteger;

  // Position symbol after the amount (Tunisian format)
  return `${fullNumber} ${currency.symbol}`;
};

/**
 * Get Tunisian Dinar currency symbol
 */
export const getCurrencySymbol = (): string => {
  return TND_CURRENCY.symbol;
};

/**
 * Get Tunisian Dinar currency info
 */
export const getCurrencyInfo = (): CurrencyInfo => {
  return TND_CURRENCY;
};
