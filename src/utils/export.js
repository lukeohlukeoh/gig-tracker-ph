import * as XLSX from 'xlsx';
import { pesoNum, wht, getQuarter, trainTax } from './format.js';

const STAGE_LABELS = { gig: 'Gig Done', po: 'PO Received', receipt: 'Receipt Sent', paid: 'Paid' };

function gigQuarter(g) {
  return g.quarter || getQuarter(g.date) || 'Unknown';
}

function quarterSortKey(q) {
  const [qp, y] = q.split(' ');
  return parseInt(y) * 10 + parseInt(qp.replace('Q', ''));
}

export function exportToExcel(gigs) {
  // Sheet 1: Gig Ledger
  const ledgerRows = gigs.map((g) => {
    const { amount, rate } = wht(g.gross, g.net);
    return {
      'Client': g.client || '',
      'Venue': g.venue || '',
      'Date': g.date || '',
      'Quarter': gigQuarter(g),
      'PO No.': g.poNumber || '',
      'Gross (₱)': pesoNum(g.gross),
      'Net (₱)': pesoNum(g.net),
      'WHT Amount (₱)': amount,
      'WHT %': rate ? +rate.toFixed(2) : '',
      'Receipt No.': g.receiptNumber || '',
      'Receipt Date': g.receiptDate || '',
      'Payment Date': g.paymentDate || '',
      '2307 Ref': g.ref2307 || '',
      'Actual Net (₱)': pesoNum(g.actualNet) || '',
      'Stage': STAGE_LABELS[g.stage] || g.stage,
    };
  });

  const ws1 = XLSX.utils.json_to_sheet(ledgerRows);
  ws1['!cols'] = [
    { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 8 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 },
  ];

  // Sheet 2: BIR Summary — quarterly totals (paid gigs only)
  const paidGigs = gigs.filter((g) => g.stage === 'paid');
  const quarterMap = {};
  paidGigs.forEach((g) => {
    const q = gigQuarter(g);
    if (!quarterMap[q]) quarterMap[q] = [];
    quarterMap[q].push(g);
  });

  const birRows = Object.entries(quarterMap)
    .sort(([a], [b]) => quarterSortKey(a) - quarterSortKey(b))
    .map(([quarter, qGigs]) => {
      const gross = qGigs.reduce((s, g) => s + pesoNum(g.gross), 0);
      const totalWHT = qGigs.reduce((s, g) => s + wht(g.gross, g.net).amount, 0);
      const tax2551Q = gross * 0.03;
      const taxableIncome = Math.max(0, gross * 0.60); // OSD 40%
      const estIncomeTax = trainTax(taxableIncome);
      const taxStillDue = Math.max(0, estIncomeTax - totalWHT);
      return {
        'Quarter': quarter,
        'Gross (₱)': gross,
        'Total WHT (₱)': totalWHT,
        '2551Q Tax Due (₱)': tax2551Q,
        'Est. 1701Q Tax Due (₱)': estIncomeTax,
        'CWT Credit (₱)': totalWHT,
        'Tax Still Due (₱)': taxStillDue,
      };
    });

  const ws2 = birRows.length > 0
    ? XLSX.utils.json_to_sheet(birRows)
    : XLSX.utils.json_to_sheet([{ 'Quarter': 'No paid gigs yet' }]);

  ws2['!cols'] = [
    { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
    { wch: 20 }, { wch: 14 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Gig Ledger');
  XLSX.utils.book_append_sheet(wb, ws2, 'BIR Summary');

  XLSX.writeFile(wb, 'gig-tracker-ph.xlsx');
}
