const CURRENCY_SYMBOLS = {
  'NGN (₦)': '₦',
  'USD ($)': '$',
  'EUR (€)': '€',
  'GBP (£)': '£',
};

export function getCurrencySymbol(currency = 'NGN (₦)') {
  return CURRENCY_SYMBOLS[currency] || '₦';
}

export function formatCurrency(amount, currency = 'NGN (₦)') {
  const value = Number(amount) || 0;
  const symbol = getCurrencySymbol(currency);
  const sign = value < 0 ? '-' : '';

  return `${sign}${symbol}${Math.abs(value).toLocaleString()}`;
}
