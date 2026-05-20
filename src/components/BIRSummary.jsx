import { useState } from 'react';
import { peso, pesoNum, wht, getQuarter, trainTax } from '../utils/format.js';

function gigQuarter(g) {
  return g.quarter || getQuarter(g.date) || null;
}

function getFilingDeadlines(q, year) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // 2551Q: 25th of month after quarter ends
  const nextMonthIdx = (q * 3) % 12; // Q1→3(Apr), Q2→6(Jul), Q3→9(Oct), Q4→0(Jan)
  const nextYear = q === 4 ? year + 1 : year;
  const deadline2551Q = `${MONTHS[nextMonthIdx]} 25, ${nextYear}`;

  const deadlines1701Q = {
    1: `May 30, ${year}`,
    2: `Aug 29, ${year}`,
    3: `Nov 29, ${year}`,
    4: `Apr 15, ${year + 1} (Annual 1701)`,
  };

  return { deadline2551Q, deadline1701Q: deadlines1701Q[q] };
}

function LineItem({ label, value, highlight, sub }) {
  return (
    <div className={`flex items-start justify-between py-2 border-b border-gray-50 last:border-0 gap-3 ${highlight ? 'bg-[#1D9E75]/5 rounded-lg px-2 -mx-2 mt-1' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug ${highlight ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-xs font-bold flex-shrink-0 ${highlight ? 'text-[#1D9E75] text-sm' : 'text-gray-800'}`}>{value}</p>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-3 mb-1 first:mt-0">{children}</p>
  );
}

export default function BIRSummary({ gigs }) {
  const now = new Date();
  const currentQ = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();

  const [selectedQ, setSelectedQ] = useState(currentQ);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [deductionMode, setDeductionMode] = useState('osd');
  const [itemizedAmount, setItemizedAmount] = useState('');

  const selectedQuarterStr = `Q${selectedQ} ${selectedYear}`;

  // Available years from gig data + current year
  const gigsYears = gigs
    .map((g) => { const q = gigQuarter(g); return q ? parseInt(q.split(' ')[1]) : null; })
    .filter(Boolean);
  const years = [...new Set([currentYear, ...gigsYears])].sort((a, b) => b - a);

  // Paid gigs for selected quarter
  const paidGigs = gigs.filter((g) => g.stage === 'paid' && gigQuarter(g) === selectedQuarterStr);
  const missing2303 = paidGigs.filter((g) => !g.ref2303).length;

  // 2551Q
  const grossSum = paidGigs.reduce((s, g) => s + pesoNum(g.gross), 0);
  const tax2551Q = grossSum * 0.03;

  // 1701Q — YTD cumulative
  const ytdPaidGigs = gigs.filter((g) => {
    if (g.stage !== 'paid') return false;
    const q = gigQuarter(g);
    if (!q) return false;
    const [qp, yr] = q.split(' ');
    return parseInt(yr) === selectedYear && parseInt(qp.replace('Q', '')) <= selectedQ;
  });
  const prevYtdPaidGigs = gigs.filter((g) => {
    if (g.stage !== 'paid') return false;
    const q = gigQuarter(g);
    if (!q) return false;
    const [qp, yr] = q.split(' ');
    return parseInt(yr) === selectedYear && parseInt(qp.replace('Q', '')) < selectedQ;
  });

  const ytdGross = ytdPaidGigs.reduce((s, g) => s + pesoNum(g.gross), 0);
  const prevYtdGross = prevYtdPaidGigs.reduce((s, g) => s + pesoNum(g.gross), 0);
  const quarterCWT = paidGigs.reduce((s, g) => s + wht(g.gross, g.net).amount, 0);

  // Deductions
  let ytdTaxable, prevYtdTaxable;
  if (deductionMode === 'osd') {
    ytdTaxable = ytdGross * 0.60;
    prevYtdTaxable = prevYtdGross * 0.60;
  } else {
    const itemized = pesoNum(itemizedAmount);
    ytdTaxable = Math.max(0, ytdGross - itemized);
    // Prorate prior quarters' deduction by gross ratio
    const ratio = ytdGross > 0 ? prevYtdGross / ytdGross : 0;
    prevYtdTaxable = Math.max(0, prevYtdGross - itemized * ratio);
  }

  const ytdDeductions = ytdGross - ytdTaxable;
  const ytdIncomeTax = trainTax(ytdTaxable);
  const prevYtdIncomeTax = trainTax(prevYtdTaxable);
  const quarterlyIncomeTax = Math.max(0, ytdIncomeTax - prevYtdIncomeTax);
  const taxStillDue = quarterlyIncomeTax - quarterCWT;

  const { deadline2551Q, deadline1701Q } = getFilingDeadlines(selectedQ, selectedYear);

  function copy2551Q() {
    const text = [
      `FORM 2551Q — Quarterly Percentage Tax`,
      `Quarter: ${selectedQuarterStr}`,
      ``,
      `Part II, Line 1 — Gross Taxable Sales/Receipts: ${peso(grossSum)}`,
      `Tax Rate: 3%`,
      `Line 20 — Tax Due: ${peso(tax2551Q)}`,
      ``,
      `Filing Deadline: ${deadline2551Q}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
  }

  function copy1701Q() {
    const dedLabel = deductionMode === 'osd' ? 'OSD (40%)' : 'Itemized';
    const text = [
      `FORM 1701Q — Quarterly Income Tax`,
      `Quarter: ${selectedQuarterStr}`,
      ``,
      `Schedule 1, Line 1 — Gross Sales/Receipts (YTD): ${peso(ytdGross)}`,
      `Deduction Method: ${dedLabel}`,
      `Allowable Deductions (YTD): ${peso(ytdDeductions)}`,
      `Taxable Income (YTD): ${peso(ytdTaxable)}`,
      ``,
      `Income Tax Due on YTD Income (TRAIN Law): ${peso(ytdIncomeTax)}`,
      `Less: Tax from Prior Quarters: (${peso(prevYtdIncomeTax)})`,
      `Quarterly Income Tax Due: ${peso(quarterlyIncomeTax)}`,
      ``,
      `Line 52 — Less: Creditable Withholding Tax: (${peso(quarterCWT)})`,
      `Line 55 — Tax Still Due / (Overpayment): ${taxStillDue < 0 ? `(${peso(Math.abs(taxStillDue))})` : peso(taxStillDue)}`,
      ``,
      `Filing Deadline: ${deadline1701Q}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">BIR Filing Summary</h1>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-1">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQ(q)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                  selectedQ === q ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75] min-h-[44px]"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-24">
        {/* Missing 2303 warning */}
        {missing2303 > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 font-medium">
            ⚠️ {missing2303} gig{missing2303 !== 1 ? 's' : ''} have no 2303 on file — CWT may be understated.
          </div>
        )}

        {paidGigs.length === 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-400 text-center">
            No paid gigs in {selectedQuarterStr}
          </div>
        )}

        {/* FORM 2551Q */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] text-[#1D9E75] font-bold uppercase tracking-wider">Form 2551Q</p>
              <p className="text-sm font-bold text-gray-800">Quarterly Percentage Tax</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Due: {deadline2551Q}</p>
            </div>
            <button
              onClick={copy2551Q}
              className="text-xs font-semibold text-[#1D9E75] border border-[#1D9E75] rounded-lg px-3 py-2 min-h-[40px] active:opacity-70 flex-shrink-0"
            >
              Copy
            </button>
          </div>
          <div className="px-4 py-3">
            <LineItem label="Part II, Line 1 — Gross Taxable Sales/Receipts" value={peso(grossSum)} />
            <LineItem label="Tax Rate" value="3%" />
            <LineItem label="Line 20 — Tax Due" value={peso(tax2551Q)} highlight />
          </div>
        </div>

        {/* FORM 1701Q */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] text-[#1D9E75] font-bold uppercase tracking-wider">Form 1701Q</p>
              <p className="text-sm font-bold text-gray-800">Quarterly Income Tax</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Due: {deadline1701Q}</p>
            </div>
            <button
              onClick={copy1701Q}
              className="text-xs font-semibold text-[#1D9E75] border border-[#1D9E75] rounded-lg px-3 py-2 min-h-[40px] active:opacity-70 flex-shrink-0"
            >
              Copy
            </button>
          </div>

          {/* Deduction toggle */}
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs text-gray-500 font-semibold mb-2">Deduction Method</p>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setDeductionMode('osd')}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                  deductionMode === 'osd' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'
                }`}
              >
                OSD (40%)
              </button>
              <button
                onClick={() => setDeductionMode('itemized')}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                  deductionMode === 'itemized' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'
                }`}
              >
                Itemized
              </button>
            </div>
            {deductionMode === 'itemized' && (
              <div className="mt-2">
                <p className="text-[10px] text-gray-400 mb-1">YTD total itemized deductions (Jan – end of {selectedQuarterStr})</p>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter YTD itemized deductions"
                  value={itemizedAmount}
                  onChange={(e) => setItemizedAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-white min-h-[44px]"
                />
              </div>
            )}
          </div>

          <div className="px-4 py-3">
            <SectionLabel>Income — YTD through {selectedQuarterStr}</SectionLabel>
            <LineItem
              label="Schedule 1, Line 1 — Gross Sales/Receipts (YTD)"
              value={peso(ytdGross)}
            />
            <LineItem
              label={`Allowable Deductions${deductionMode === 'osd' ? ' — OSD 40%' : ' — Itemized'}`}
              value={peso(ytdDeductions)}
            />
            <LineItem
              label="Taxable Income (YTD)"
              value={peso(ytdTaxable)}
            />

            <SectionLabel>Tax Computation</SectionLabel>
            <LineItem
              label="Income Tax Due on YTD Taxable Income (TRAIN Law)"
              value={peso(ytdIncomeTax)}
            />
            <LineItem
              label="Less: Income Tax from Prior Quarters"
              value={`(${peso(prevYtdIncomeTax)})`}
            />
            <LineItem
              label="Quarterly Income Tax Due"
              value={peso(quarterlyIncomeTax)}
            />

            <SectionLabel>CWT Credit</SectionLabel>
            <LineItem
              label="Line 52 — Less: Creditable Withholding Tax (CWT)"
              value={`(${peso(quarterCWT)})`}
              sub="WHT withheld by clients this quarter"
            />
            <LineItem
              label="Line 55 — Tax Still Due / (Overpayment)"
              value={taxStillDue < 0 ? `(${peso(Math.abs(taxStillDue))})` : peso(taxStillDue)}
              highlight
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            These are reference figures only. Verify with your accountant or the latest BIR guidelines before filing.
          </p>
        </div>
      </div>
    </div>
  );
}
