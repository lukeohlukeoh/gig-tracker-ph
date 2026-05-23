import { useState, useCallback } from 'react';
import { loadGigs, saveGigs, createGig } from './utils/storage.js';
import Dashboard from './components/Dashboard.jsx';
import GigDetail from './components/GigDetail.jsx';
import GigForm from './components/GigForm.jsx';
import QuarterView from './components/QuarterView.jsx';
import BIRSummary from './components/BIRSummary.jsx';

const NAV = [
  { id: 'dashboard', label: 'Gigs', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )},
  { id: 'quarters', label: 'Quarters', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { id: 'bir', label: 'BIR', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
    </svg>
  )},
];

const MAIN_SCREENS = new Set(['dashboard', 'quarters', 'bir']);

export default function App() {
  const [gigs, setGigs] = useState(() => loadGigs());
  const [view, setView] = useState({ screen: 'dashboard' });

  const persistGigs = useCallback((updated) => {
    setGigs(updated);
    saveGigs(updated);
  }, []);

  function handleAdd(data) {
    const gig = createGig(data);
    persistGigs([gig, ...gigs]);
    setView({ screen: 'dashboard' });
  }

  function handleUpdate(updated) {
    persistGigs(gigs.map((g) => (g.id === updated.id ? updated : g)));
    setView({ screen: 'detail', gigId: updated.id, from: view.from });
  }

  function handleDelete(id) {
    persistGigs(gigs.filter((g) => g.id !== id));
    setView({ screen: view.from || 'dashboard' });
  }

  const selectedGig = view.gigId ? gigs.find((g) => g.id === view.gigId) : null;
  const isMain = MAIN_SCREENS.has(view.screen);

  return (
    <div className="min-h-svh bg-white flex justify-center">
      {/* White cover behind status bar / Dynamic Island */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white z-50" style={{ height: 'env(safe-area-inset-top)' }} />
      <div className="w-full max-w-[430px] min-h-svh bg-white relative flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>

        {view.screen === 'dashboard' && (
          <Dashboard
            gigs={gigs}
            onSelect={(id) => setView({ screen: 'detail', gigId: id, from: 'dashboard' })}
            onAdd={() => setView({ screen: 'add' })}
          />
        )}

        {view.screen === 'quarters' && (
          <QuarterView
            gigs={gigs}
            onSelect={(id) => setView({ screen: 'detail', gigId: id, from: 'quarters' })}
          />
        )}

        {view.screen === 'bir' && (
          <BIRSummary gigs={gigs} />
        )}

        {view.screen === 'detail' && selectedGig && (
          <GigDetail
            gig={selectedGig}
            allGigs={gigs}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onBack={() => setView({ screen: view.from || 'dashboard' })}
          />
        )}

        {view.screen === 'add' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
              <button
                onClick={() => setView({ screen: 'dashboard' })}
                className="text-gray-400 text-xl leading-none min-w-[44px] min-h-[44px] flex items-center"
              >
                ←
              </button>
              <h2 className="text-base font-bold text-gray-800">Add New Gig</h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1 pb-6">
              <GigForm
                onSave={handleAdd}
                onCancel={() => setView({ screen: 'dashboard' })}
                allGigs={gigs}
              />
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        {isMain && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex z-30" style={{ paddingBottom: '0px' }}>
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setView({ screen: n.id })}
                className={`flex-1 flex flex-col items-center gap-1 pt-2 pb-0 transition-colors ${
                  view.screen === n.id ? 'text-[#1D9E75]' : 'text-gray-400'
                }`}
              >
                {n.icon}
                <span className="text-xs font-semibold">{n.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
