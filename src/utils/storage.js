import { getQuarter } from './format.js';

const KEY = 'gig-tracker-ph-gigs';

export function loadGigs() {
  try {
    const raw = localStorage.getItem(KEY);
    const gigs = raw ? JSON.parse(raw) : [];
    // migrate ref2303 → ref2307
    return gigs.map((g) => {
      if ('ref2303' in g && !('ref2307' in g)) {
        const { ref2303, ...rest } = g;
        return { ...rest, ref2307: ref2303 };
      }
      return g;
    });
  } catch {
    return [];
  }
}

export function saveGigs(gigs) {
  localStorage.setItem(KEY, JSON.stringify(gigs));
}

export function createGig(data) {
  const quarter = data.quarter || getQuarter(data.date) || '';
  return {
    id: crypto.randomUUID(),
    stage: 'gig',
    client: '',
    venue: '',
    date: '',
    notes: '',
    quarter: '',
    poNumber: '',
    gross: '',
    net: '',
    receiptNumber: '',
    receiptDate: '',
    paymentDate: '',
    ref2307: '',
    actualNet: '',
    ...data,
    quarter,
    createdAt: new Date().toISOString(),
  };
}
