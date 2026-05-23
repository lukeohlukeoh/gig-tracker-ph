import { useState } from 'react';
import StagePill from './StagePill.jsx';
import { peso, pesoNum, wht, formatDate, getQuarter } from '../utils/format.js';

function gigQuarter(g) {
  return g.quarter || getQuarter(g.date) || 'Unknown';
}

function quarterSortKey(q) {
  const parts = q.split(' ');
  if (parts.length < 2) return 0;
  return parseInt(parts[1]) * 10 + parseInt(parts[0].replace('Q', ''));
}

function QuarterStats({ gigs }) {
  const totalGross = gigs.reduce((s, g) => s + pesoNum(g.gross), 0);
  const totalWHT = gigs.reduce((s, g) => s + wht(g.gross, g.net).amount, 0);
  const totalNet = totalGross - totalWHT;
  return (
    <div className="px-4 pb-3 grid grid-cols-3 gap-2 border-t border-gray-50">
      <div>
        <p className="text-[10px] text-gray-400 font-semibold uppercase">Gross</p>
        <p className="text-sm font-bold text-[#1D9E75]">{totalGross > 0 ? peso(totalGross) : '—'}</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-semibold uppercase">WHT</p>
        <p className="text-sm font-bold text-gray-700">{totalWHT > 0 ? peso(totalWHT) : '—'}</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-semibold uppercase">Net</p>
        <p className="text-sm font-bold text-gray-700">{totalNet > 0 ? peso(totalNet) : '—'}</p>
      </div>
    </div>
  );
}

function GigRow({ g, onSelect }) {
  return (
    <button
      onClick={() => onSelect(g.id)}
      className="w-full text-left px-4 py-3 flex items-center gap-3 border-t border-gray-50 active:bg-gray-50"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-700 truncate">{g.venue || g.client || 'Unnamed'}</p>
        <p className="text-[10px] text-gray-400 truncate">{[g.client, formatDate(g.date)].filter(Boolean).join(' · ')}</p>
      </div>
      <StagePill stage={g.stage} />
      {g.gross && (
        <span className="text-xs font-bold text-[#1D9E75] flex-shrink-0">{peso(g.gross)}</span>
      )}
    </button>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <span className="text-5xl">📅</span>
      <p className="text-gray-600 text-sm font-semibold">No gigs yet</p>
      <p className="text-gray-400 text-xs">Add gigs on the Gigs tab</p>
    </div>
  );
}

function Header({ mode, setMode }) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Quarter &amp; Year</h1>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setMode('quarter')}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
            mode === 'quarter' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'
          }`}
        >
          By Quarter
        </button>
        <button
          onClick={() => setMode('year')}
          className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
            mode === 'year' ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'
          }`}
        >
          By Year
        </button>
      </div>
    </div>
  );
}

export default function QuarterView({ gigs, onSelect }) {
  const [mode, setMode] = useState('quarter');
  const [expanded, setExpanded] = useState({});

  function toggle(key) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  }

  function sortedGigs(list) {
    return [...list].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  if (mode === 'quarter') {
    const grouped = {};
    gigs.forEach((g) => {
      const q = gigQuarter(g);
      if (!grouped[q]) grouped[q] = [];
      grouped[q].push(g);
    });
    const quarters = Object.keys(grouped).sort((a, b) => quarterSortKey(b) - quarterSortKey(a));

    return (
      <div className="flex flex-col min-h-full">
        <Header mode={mode} setMode={setMode} />
        <div className="flex-1 p-4 flex flex-col gap-3 pb-24">
          {quarters.length === 0 && <Empty />}
          {quarters.map((q) => {
            const qGigs = grouped[q];
            const isOpen = expanded[q];
            return (
              <div key={q} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggle(q)}
                  className="w-full p-4 flex items-center gap-2 text-left"
                >
                  <span className="text-sm font-bold text-gray-800 flex-1">{q}</span>
                  <span className="text-xs text-gray-400">{qGigs.length} gig{qGigs.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs text-gray-300 ml-1">{isOpen ? '▲' : '▼'}</span>
                </button>
                <QuarterStats gigs={qGigs} />
                {isOpen && sortedGigs(qGigs).map((g) => (
                  <GigRow key={g.id} g={g} onSelect={onSelect} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // By Year
  const yearMap = {};
  gigs.forEach((g) => {
    const q = gigQuarter(g);
    const year = q.split(' ')[1] || 'Unknown';
    if (!yearMap[year]) yearMap[year] = {};
    if (!yearMap[year][q]) yearMap[year][q] = [];
    yearMap[year][q].push(g);
  });
  const years = Object.keys(yearMap).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="flex flex-col min-h-full">
      <Header mode={mode} setMode={setMode} />
      <div className="flex-1 p-4 flex flex-col gap-3 pb-24">
        {years.length === 0 && <Empty />}
        {years.map((year) => {
          const yearGigs = Object.values(yearMap[year]).flat();
          const isOpen = expanded[year];
          const quarters = Object.keys(yearMap[year]).sort((a, b) => quarterSortKey(b) - quarterSortKey(a));

          return (
            <div key={year} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => toggle(year)}
                className="w-full p-4 flex items-center gap-2 text-left"
              >
                <span className="text-sm font-bold text-gray-800 flex-1">{year}</span>
                <span className="text-xs text-gray-400">{yearGigs.length} gig{yearGigs.length !== 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-300 ml-1">{isOpen ? '▲' : '▼'}</span>
              </button>
              <QuarterStats gigs={yearGigs} />

              {isOpen && quarters.map((q) => {
                const qGigs = yearMap[year][q];
                const qKey = `${year}-${q}`;
                const isQOpen = expanded[qKey];
                const qGross = qGigs.reduce((s, g) => s + pesoNum(g.gross), 0);

                return (
                  <div key={q} className="border-t border-gray-50">
                    <button
                      onClick={() => toggle(qKey)}
                      className="w-full px-4 py-3 flex items-center gap-2 text-left"
                    >
                      <span className="text-xs font-bold text-gray-600 flex-1">{q}</span>
                      <span className="text-xs text-gray-400">
                        {qGigs.length} gig{qGigs.length !== 1 ? 's' : ''}
                        {qGross > 0 ? ` · ${peso(qGross)}` : ''}
                      </span>
                      <span className="text-xs text-gray-300 ml-1">{isQOpen ? '▲' : '▼'}</span>
                    </button>
                    {isQOpen && sortedGigs(qGigs).map((g) => (
                      <GigRow key={g.id} g={g} onSelect={onSelect} />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
