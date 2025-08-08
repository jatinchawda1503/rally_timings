"use client";

import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRallyStore } from '@/store/rallyStore';
import { formatSeconds } from '@/lib/time';
import { Rocket, PlusCircle, List, Users, Clock, Hourglass, Calculator, Edit, Trash2, Info } from 'lucide-react';

export default function HomePage() {
  const {
    leaders,
    isActive,
    addLeader,
    removeLeader,
    updateLeader,
    calculateLaunch,
    start,
    stop,
  } = useRallyStore();

  const coordinationRef = useRef<HTMLDivElement | null>(null);

  const [name, march, offset] = useRallyStore((s) => [s.form.name, s.form.march, s.form.offset]);
  const setForm = useRallyStore((s) => s.setForm);

  const launchSequence = useMemo(() => calculateLaunch(), [leaders, calculateLaunch]);

  useEffect(() => {
    // focus name on mount
    const el = document.getElementById('leaderName') as HTMLInputElement | null;
    el?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || march <= 0 || offset < 0) return;
    addLeader({ name, marchTime: march, arrivalOffset: offset });
    setForm({ name: '', march: 0, offset: 0 });
  };

  const handleStart = () => {
    start();
    setTimeout(() => coordinationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Rocket className="text-white drop-shadow" size={36} />
          <h1 className="text-3xl font-bold text-white drop-shadow">Rally Coordinator</h1>
        </div>
        <p className="text-white/90">Synchronize or stagger your rallies to hit at perfect times</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Add Leader */}
        <section className="card">
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-4"><PlusCircle className="text-primary" /> Add Rally Leader</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="leaderName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Users size={16} /> Leader Name
              </label>
              <input id="leaderName" className="w-full rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2 focus:border-primary outline-none" placeholder="Enter leader name" value={name} onChange={(e) => setForm({ name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Clock size={16} /> March Time (s)
                </label>
                <input type="number" min={1} step={1} className="w-full rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2 focus:border-primary outline-none" placeholder="e.g. 300" value={march || ''} onChange={(e) => setForm({ march: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Hourglass size={16} /> Arrival Offset (s)
                </label>
                <input type="number" min={0} step={1} className="w-full rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2 focus:border-primary outline-none" placeholder="e.g. 5" value={offset || 0} onChange={(e) => setForm({ offset: Number(e.target.value) })} />
                <p className="mt-1 text-xs text-gray-500">How many seconds after the <span className="font-medium">first hit</span> this rally should arrive.</p>
              </div>
            </div>
            <button className="btn btn-primary" type="submit"><PlusCircle size={18} /> Add Leader</button>
          </form>
        </section>

        {/* List */}
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><List className="text-primary" /> Rally Leaders</h2>
            <span className="badge">{leaders.length} ready</span>
          </div>

          <div className="space-y-3 min-h-[160px]">
            <AnimatePresence initial={false}>
              {leaders.length === 0 ? (
                <p className="text-center text-gray-500">No rally leaders added yet</p>
              ) : (
                leaders.map((l) => (
                  <motion.div key={l.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="rounded-md border-2 border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">{l.name}</span>
                      <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-primary" onClick={() => updateLeader(l.id, { editing: true })} disabled={isActive}><Edit size={18} /></button>
                        <button className="text-gray-400 hover:text-danger" onClick={() => removeLeader(l.id)} disabled={isActive}><Trash2 size={18} /></button>
                      </div>
                    </div>
                    {l.editing ? (
                      <EditLeader id={l.id} />
                    ) : (
                      <div className="mt-2 grid grid-cols-3 gap-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1"><Clock size={14} /> March: <span className="font-medium text-gray-900 ml-1">{l.marchTime}s</span></div>
                        <div className="flex items-center gap-1"><Hourglass size={14} /> Offset: <span className="font-medium text-gray-900 ml-1">{l.arrivalOffset}s</span></div>
                        <div className="flex items-center gap-1"><Calculator size={14} /> Arrival: <span className="font-medium text-gray-900 ml-1">{l.marchTime + l.arrivalOffset}s</span></div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <button className="btn btn-secondary" onClick={() => useRallyStore.getState().clear()} disabled={leaders.length === 0 || isActive}>Clear All</button>
            <button className="btn btn-success" onClick={handleStart} disabled={leaders.length === 0 || isActive}><Rocket size={18} /> Start Coordination</button>
          </div>
        </section>

        {/* Overview */}
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Info className="text-primary" /> Launch Overview</h2>
            <span className="badge bg-secondary">{leaders.length} leaders ready</span>
          </div>
          <p className="mb-4 rounded-md border-l-4 border-primary bg-primary/10 p-3 text-gray-700">
            <Info className="inline mr-2 text-primary" size={16} />
            Arrival Offset = how many seconds after the <span className="font-semibold">first hit</span> this rally should arrive. We compute start times so each leader hits at its offset.
          </p>
          <div className="space-y-2">
            {launchSequence.length === 0 ? (
              <p className="text-center text-gray-500">Nothing to preview yet</p>
            ) : (
              launchSequence.map((l, idx) => (
                <div key={l.id} className="grid grid-cols-1 sm:grid-cols-[64px_1fr_auto] items-center gap-4 rounded-md border-2 border-gray-100 bg-gray-50 p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{idx + 1}</div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">{idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{l.name}</div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-700">
                      <span className="flex items-center gap-1"><Clock size={14} /> March: {l.marchTime}s</span>
                      <span className="flex items-center gap-1"><Hourglass size={14} /> Offset: {l.arrivalOffset}s</span>
                      <span className="flex items-center gap-1"><Calculator size={14} /> Arrival: {l.marchTime + l.arrivalOffset}s</span>
                    </div>
                  </div>
                  <div className="justify-self-end text-right">
                    <div className="text-sm font-medium text-gray-800">{l.startOffset === 0 ? 'Starts immediately' : `Starts in ${formatSeconds(l.startOffset)}`}</div>
                    <div className="text-xs text-gray-600 italic">Hits castle at {formatSeconds(l.arrivalTime)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <button className="btn btn-success" onClick={handleStart} disabled={leaders.length === 0 || isActive}><Rocket size={18} /> Start Coordination</button>
            <p className="text-sm text-gray-600 italic">Ready to execute this strategy? Click to begin the 5-second countdown.</p>
          </div>
        </section>

        {/* Coordination */}
        <section className="card lg:col-span-2" ref={coordinationRef}>
          <CoordinationPanel />
        </section>
      </main>
    </div>
  );
}

function EditLeader({ id }: { id: string }) {
  const leader = useRallyStore((s) => s.leaders.find((l) => l.id === id)!);
  const updateLeader = useRallyStore((s) => s.updateLeader);

  return (
    <div className="mt-3 rounded-md border-2 border-gray-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">March Time (s)</label>
          <input type="number" min={1} step={1} defaultValue={leader.marchTime} onChange={(e) => updateLeader(id, { marchTime: Number(e.target.value) })} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Arrival Offset (s)</label>
          <input type="number" min={0} step={1} defaultValue={leader.arrivalOffset} onChange={(e) => updateLeader(id, { arrivalOffset: Number(e.target.value) })} className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary outline-none" />
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button className="btn btn-primary" onClick={() => updateLeader(id, { editing: false })}>Save</button>
        <button className="btn btn-secondary" onClick={() => updateLeader(id, { editing: false, reset: true })}>Cancel</button>
      </div>
    </div>
  );
}

function CoordinationPanel() {
  const { isActive, countdown, sequenceStatuses, stop } = useRallyStore();
  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold">Coordination</h2>
      {!isActive ? (
        <p className="text-gray-500">Not active. Use Start buttons to begin.</p>
      ) : (
        <div className="text-center space-y-3">
          <div className="text-5xl font-extrabold text-primary drop-shadow">{countdown > 0 ? countdown : 'ACTIVE'}</div>
          <p className="text-gray-600">{countdown > 0 ? 'seconds until first launch' : 'Follow the launch sequence!'}</p>
          <div className="mt-4 space-y-2">
            {sequenceStatuses.map((s) => (
              <div key={s.id} className={`flex items-center justify-between rounded-md border-2 p-3 ${s.state === 'go' ? 'border-success bg-success/10' : s.state === 'ready' ? 'border-warning bg-warning/10' : s.state === 'completed' ? 'border-success/60 bg-success/5 opacity-70' : 'border-gray-200 bg-gray-50'}`}>
                <div className="font-semibold">{s.name}</div>
                <div className={`rounded-full px-3 py-1 text-sm font-medium ${s.state === 'go' ? 'bg-success text-white' : s.state === 'ready' ? 'bg-warning text-white' : s.state === 'completed' ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-700'}`}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-danger mt-3" onClick={stop}>Stop Coordination</button>
        </div>
      )}
    </div>
  );
}


