export function peso(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return '—';
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pesoNum(value) {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

export function wht(gross, net) {
  const g = pesoNum(gross);
  const n = pesoNum(net);
  if (!g) return { amount: 0, rate: 0 };
  const amount = g - n;
  const rate = g > 0 ? (amount / g) * 100 : 0;
  return { amount, rate };
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}
