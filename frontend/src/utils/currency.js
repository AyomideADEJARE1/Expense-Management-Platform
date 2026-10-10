const CURRENCY_SYMBOLS = {
  'NGN (₦)': '₦',
  'USD ($)': '$',
  'EUR (€)': '€',
  'GBP (£)': '£',
};

export function formatCurrency(amount, currency = 'NGN (₦)') {
  const value = Number(amount) || 0;
  const symbol = CURRENCY_SYMBOLS[currency] || '₦';
  const sign = value < 0 ? '-' : '';

  return `${sign}${symbol}${Math.abs(value).toLocaleString()}`;
}
