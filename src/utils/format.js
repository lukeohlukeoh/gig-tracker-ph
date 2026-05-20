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

export function getQuarter(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return '';
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

// TRAIN Law graduated annual income tax table
export function trainTax(annualIncome) {
  const income = pesoNum(annualIncome);
  if (income <= 250000) return 0;
  if (income <= 400000) return (income - 250000) * 0.20;
  if (income <= 800000) return 30000 + (income - 400000) * 0.25;
  if (income <= 2000000) return 130000 + (income - 800000) * 0.30;
  if (income <= 8000000) return 490000 + (income - 2000000) * 0.32;
  return 2410000 + (income - 8000000) * 0.35;
}
