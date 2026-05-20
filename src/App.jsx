import { useState, useCallback } from 'react';
import { loadGigs, saveGigs, createGig } from './utils/storage.js';
import Dashboard from './components/Dashboard.jsx';
import GigDetail from './components/GigDetail.jsx';
import GigForm from './components/GigForm.jsx';

// View state: { screen: 'dashboard' | 'detail' | 'add', gigId?: string }
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
    setView({ screen: 'detail', gigId: updated.id });
  }

  function handleDelete(id) {
    persistGigs(gigs.filter((g) => g.id !== id));
    setView({ screen: 'dashboard' });
  }

  const selectedGig = view.gigId ? gigs.find((g) => g.id === view.gigId) : null;

  return (
    <div className="min-h-svh bg-gray-50 flex justify-center">
      <div className="w-full max-w-[430px] min-h-svh bg-gray-50 relative flex flex-col">
        {view.screen === 'dashboard' && (
          <Dashboard
            gigs={gigs}
            onSelect={(id) => setView({ screen: 'detail', gigId: id })}
            onAdd={() => setView({ screen: 'add' })}
          />
        )}

        {view.screen === 'detail' && selectedGig && (
          <GigDetail
            gig={selectedGig}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onBack={() => setView({ screen: 'dashboard' })}
          />
        )}

        {view.screen === 'add' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
              <button
                onClick={() => setView({ screen: 'dashboard' })}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none min-w-[44px] min-h-[44px] flex items-center"
              >
                ←
              </button>
              <h2 className="text-base font-bold text-gray-800">Add New Gig</h2>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <GigForm
                onSave={handleAdd}
                onCancel={() => setView({ screen: 'dashboard' })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
