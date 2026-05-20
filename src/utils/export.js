import * as XLSX from 'xlsx';
import { pesoNum, wht } from './format.js';

const STAGE_LABELS = { gig: 'Gig Done', po: 'PO Received', receipt: 'Receipt Sent', paid: 'Paid' };

export function exportToExcel(gigs) {
  const rows = gigs.map((g) => {
    const { amount, rate } = wht(g.gross, g.net);
    return {
      'Client': g.client || '',
      'Venue': g.venue || '',
      'Date': g.date || '',
      'PO No.': g.poNumber || '',
      'Gross (₱)': pesoNum(g.gross),
      'Net (₱)': pesoNum(g.net),
      'WHT Amount (₱)': amount,
      'WHT %': rate ? +rate.toFixed(2) : '',
      'Receipt No.': g.receiptNumber || '',
      'Receipt Date': g.receiptDate || '',
      'Payment Date': g.paymentDate || '',
      '2303 Ref': g.ref2303 || '',
      'Actual Net (₱)': pesoNum(g.actualNet) || '',
      'Stage': STAGE_LABELS[g.stage] || g.stage,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gigs');

  // Column widths
  ws['!cols'] = [
    { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 8 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 },
  ];

  XLSX.writeFile(wb, 'gig-tracker-ph.xlsx');
}
