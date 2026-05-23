import { useState } from 'react';
import StatCard from './StatCard.jsx';
import StagePill from './StagePill.jsx';
import { peso, pesoNum, wht, formatDate, isFollowUpDue, daysInReceipt } from '../utils/format.js';
import { exportToExcel } from '../utils/export.js';

const STAGES = ['gig', 'po', 'receipt', 'paid'];
const STAGE_LABELS = { all: 'All', gig: 'Gig Done', po: 'PO', receipt: 'Receipt', paid: 'Paid' };
const NEXT_ACTION = {
  gig: 'Awaiting PO',
  po: 'Send receipt',
  receipt: 'Awaiting payment',
  paid: 'Complete',
};

export default function Dashboard({ gigs, onSelect, onAdd }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded');

  const totalGross = gigs.reduce((s, g) => s + pesoNum(g.gross), 0);
  const totalWHT = gigs.reduce((s, g) => s + wht(g.gross, g.net).amount, 0);
  const activeGigs = gigs.filter((g) => g.stage !== 'paid').length;
  const missing2307 = gigs.filter((g) => g.stage === 'paid' && !g.ref2307).length;
  const followUpDue = gigs.filter(isFollowUpDue).length;

  const filtered = activeFilter === 'all' ? gigs : gigs.filter((g) => g.stage === activeFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dateAdded') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'poDate') return new Date(b.receiptDate || 0) - new Date(a.receiptDate || 0);
    if (sortBy === 'paidDate') return new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0);
    return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Gig Tracker PH</h1>
            <p className="text-xs text-gray-400 mt-0.5">{gigs.length} gig{gigs.length !== 1 ? 's' : ''} total</p>
          </div>
          <button
            onClick={() => exportToExcel(gigs)}
            disabled={gigs.length === 0}
            className="text-xs font-semibold text-[#1D9E75] border border-[#1D9E75] rounded-lg px-3 py-2 min-h-[44px] active:opacity-70 disabled:opacity-30"
          >
            Export XLS
          </button>
        </div>

        {/* Stat cards 2×2 grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard label="Total Gross" value={gigs.some(g => g.gross) ? peso(totalGross) : '—'} accent />
          <StatCard label="WHT Withheld" value={totalWHT > 0 ? peso(totalWHT) : '—'} />
          <StatCard label="Active Gigs" value={activeGigs} sub="not yet paid" />
          <StatCard
            label="Follow Up"
            value={followUpDue}
            sub={followUpDue > 0 ? 'overdue 30+ days' : 'all clear'}
          />
        </div>

        {/* Sort toggle */}
        <div className="flex gap-1 mb-3">
          {[
            { key: 'gigDate', label: 'Gig Date' },
            { key: 'dateAdded', label: 'Date Added' },
            { key: 'poDate', label: 'PO Sent' },
            { key: 'paidDate', label: 'Paid Date' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                sortBy === s.key ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Stage filter tabs */}
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {['all', ...STAGES].map((s) => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-2 rounded-lg min-h-[36px] transition-colors ${
                activeFilter === s
                  ? 'bg-[#1D9E75] text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Gig list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-4"
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
        {sorted.length === 0 && (
          <div className="flex flex-col items-center pt-6 pb-2 gap-3 text-center">
            <span className="text-5xl">🎵</span>
            <p className="text-gray-600 text-sm font-semibold">No gigs yet</p>
            <p className="text-gray-400 text-xs">Tap + to add your first gig</p>
          </div>
        )}
        {sorted.map((g) => {
          const missing = g.stage === 'paid' && !g.ref2307;
          const followUp = isFollowUpDue(g);
          const days = daysInReceipt(g);
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={`w-full text-left rounded-2xl border p-4 shadow-sm active:opacity-75 flex flex-col gap-2 ${
                g.stage === 'paid'
                  ? 'bg-[#1D9E75]/8 border-[#1D9E75]/30'
                  : followUp
                  ? 'bg-white border-orange-300'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{g.venue || 'Unnamed Gig'}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {[g.client, g.date ? formatDate(g.date) : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StagePill stage={g.stage} />
                  {missing && <span className="text-[10px] text-red-500 font-semibold">⚠ No 2307</span>}
                  {followUp && <span className="text-[10px] text-orange-500 font-semibold">⚠ Follow up</span>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {g.actualNet || g.net
                    ? <span className="text-base font-bold text-[#1D9E75]">{peso(g.actualNet || g.net)}</span>
                    : <span className="text-sm text-gray-300 font-medium">No PO yet</span>
                  }
                  {g.gross && (
                    <span className="text-xs text-gray-400 font-medium">{peso(g.gross)} gross</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${followUp ? 'text-orange-500' : 'text-gray-400'}`}>
                  {followUp ? `${days}d since receipt` : NEXT_ACTION[g.stage]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* FAB — positioned relative to the max-width container */}
      <button
        onClick={onAdd}
        className="fixed right-6 w-14 h-14 rounded-full bg-[#1D9E75] text-white text-2xl shadow-xl flex items-center justify-center active:scale-95 transition-transform z-20"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
        aria-label="Add gig"
      >
        +
      </button>
    </div>
  );
}
