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
  return {
    id: crypto.randomUUID(),
    stage: 'gig',
    client: '',
    venue: '',
    date: '',
    notes: '',
    poNumber: '',
    gross: '',
    net: '',
    receiptNumber: '',
    receiptDate: '',
    paymentDate: '',
    ref2303: '',
    actualNet: '',
    ...data,
    createdAt: new Date().toISOString(),
  };
}
