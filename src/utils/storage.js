import { getQuarter } from './format.js';

const KEY = 'gig-tracker-ph-gigs';

export function loadGigs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
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
    ref2303: '',
    actualNet: '',
    ...data,
    quarter,
    createdAt: new Date().toISOString(),
  };
}
