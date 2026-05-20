import { useState } from 'react';
import { wht, peso, getQuarter } from '../utils/format.js';

const STAGES = ['gig', 'po', 'receipt', 'paid'];
const STAGE_LABELS = { gig: 'Gig Done', po: 'PO Received', receipt: 'Receipt Sent', paid: 'Paid' };

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1D9E75] bg-white min-h-[44px]';
const LABEL = 'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide';

export default function GigForm({ initial = {}, onSave, onCancel, advanceFrom }) {
  const startStage = advanceFrom
    ? STAGES[Math.min(STAGES.indexOf(advanceFrom) + 1, STAGES.length - 1)]
    : (initial.stage || 'gig');

  const [activeTab, setActiveTab] = useState(startStage);
  const [form, setForm] = useState({
    stage: initial.stage || 'gig',
    client: initial.client || '',
    venue: initial.venue || '',
    date: initial.date || '',
    quarter: initial.quarter || getQuarter(initial.date) || '',
    notes: initial.notes || '',
    poNumber: initial.poNumber || '',
    gross: initial.gross || '',
    net: initial.net || '',
    receiptNumber: initial.receiptNumber || '',
    receiptDate: initial.receiptDate || '',
    paymentDate: initial.paymentDate || '',
    ref2303: initial.ref2303 || '',
    actualNet: initial.actualNet || '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function handleDateChange(e) {
    setForm((f) => ({ ...f, date: e.target.value }));
  }

  function handlePaymentDateChange(e) {
    const newDate = e.target.value;
    setForm((f) => ({
      ...f,
      paymentDate: newDate,
      quarter: getQuarter(newDate) || f.quarter,
    }));
  }

  const { amount: whtAmount, rate: whtRate } = wht(form.gross, form.net);

  function detectStage(f) {
    if (f.paymentDate || f.ref2303 || f.actualNet) return 'paid';
    if (f.receiptNumber || f.receiptDate) return 'receipt';
    if (f.poNumber || f.gross || f.net) return 'po';
    return 'gig';
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, stage: detectStage(form) });
  }

  const tabStages = advanceFrom
    ? STAGES.slice(STAGES.indexOf(advanceFrom) + 1)
    : STAGES;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Stage tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabStages.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveTab(s)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
              activeTab === s ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'
            }`}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Stage 1: Gig fields */}
      {activeTab === 'gig' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className={LABEL}>Client *</label>
            <input className={INPUT} value={form.client} onChange={set('client')} required placeholder="e.g. ABC Corporation" />
          </div>
          <div>
            <label className={LABEL}>Venue *</label>
            <input className={INPUT} value={form.venue} onChange={set('venue')} required placeholder="e.g. Makati Shangri-La" />
          </div>
          <div>
            <label className={LABEL}>Gig Date *</label>
            <input type="date" className={INPUT} value={form.date} onChange={handleDateChange} required />
          </div>
          <div>
            <label className={LABEL}>Notes</label>
            <textarea className={INPUT + ' resize-none'} rows={3} value={form.notes} onChange={set('notes')} placeholder="Set list, contact, etc." />
          </div>
        </div>
      )}

      {/* Stage 2: PO fields */}
      {activeTab === 'po' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className={LABEL}>PO Number</label>
            <input className={INPUT} value={form.poNumber} onChange={set('poNumber')} placeholder="e.g. PO-2025-001" />
          </div>
          <div>
            <label className={LABEL}>Gross Amount (₱)</label>
            <input type="text" inputMode="decimal" className={INPUT} value={form.gross} onChange={set('gross')} placeholder="e.g. 14000" />
          </div>
          <div>
            <label className={LABEL}>Net Amount on PO (₱)</label>
            <input type="text" inputMode="decimal" className={INPUT} value={form.net} onChange={set('net')} placeholder="e.g. 13465" />
          </div>
          {form.gross && form.net && (
            <div className="bg-[#1D9E75]/8 border border-[#1D9E75]/20 rounded-xl p-4 flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">WHT Withheld</p>
                <p className="text-base font-bold text-gray-800">{peso(whtAmount)}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">Effective Rate</p>
                <p className="text-base font-bold text-[#1D9E75]">{whtRate.toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage 3: Receipt fields */}
      {activeTab === 'receipt' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className={LABEL}>Receipt / OR Number</label>
            <input className={INPUT} value={form.receiptNumber} onChange={set('receiptNumber')} placeholder="e.g. OR-0001" />
          </div>
          <div>
            <label className={LABEL}>Date Sent to Finance</label>
            <input type="date" className={INPUT} value={form.receiptDate} onChange={set('receiptDate')} />
          </div>
        </div>
      )}

      {/* Stage 4: Paid fields */}
      {activeTab === 'paid' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className={LABEL}>Payment Date</label>
            <input type="date" className={INPUT} value={form.paymentDate} onChange={handlePaymentDateChange} />
          </div>
          <div>
            <label className={LABEL}>Quarter</label>
            <input className={INPUT} value={form.quarter} onChange={set('quarter')} placeholder="Auto-filled from payment date" />
          </div>
          <div>
            <label className={LABEL}>BIR 2303 Certificate Reference</label>
            <input className={INPUT} value={form.ref2303} onChange={set('ref2303')} placeholder="e.g. 2303-2025-00123" />
          </div>
          <div>
            <label className={LABEL}>Actual Net Received (₱)</label>
            <input type="text" inputMode="decimal" className={INPUT} value={form.actualNet} onChange={set('actualNet')} placeholder="Amount deposited" />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold min-h-[44px] active:opacity-90"
        >
          Save
        </button>
      </div>
    </form>
  );
}
