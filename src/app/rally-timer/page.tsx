"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRallyStore } from '@/store/rallyStore';
import { formatSeconds } from '@/lib/time';
import { speak, isSpeechSupported, listVoices } from '@/lib/speech';
import { Rocket, PlusCircle, List, Users, Clock, Hourglass, Calculator, Edit, Trash2, Info, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RallyTimerPage() {
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
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const [name, march, offset] = useRallyStore((s) => [s.form.name, s.form.march, s.form.offset]);
  const setForm = useRallyStore((s) => s.setForm);

  const launchSequence = useMemo(() => {
    if (leaders.length === 0) return [];
    // Interpret arrivalOffset as "hits castle after the first hit by X seconds".
    // Compute base = max(marchTime - arrivalOffset) to ensure all startOffsets are >= 0 and
    // the earliest start is 0. Each leader i then starts at:
    //   startOffset_i = base - (marchTime_i - arrivalOffset_i)
    // and hits at:
    //   arrivalTime_i = startOffset_i + marchTime_i = base + arrivalOffset_i
    const base = Math.max(...leaders.map((l) => l.marchTime - l.arrivalOffset));
    const seq = leaders
      .map((l) => {
        const startOffset = base - (l.marchTime - l.arrivalOffset);
        const arrivalTime = startOffset + l.marchTime; // equals base + arrivalOffset
        return { ...l, startOffset, arrivalTime };
      })
      .sort((a, b) => a.startOffset - b.startOffset);
    return seq;
  }, [leaders]);

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

  const goToOverview = () => {
    overviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <header className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Link href="/" className="text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <Rocket className="text-white drop-shadow" size={36} />
          <h1 className="text-3xl font-bold text-white drop-shadow">Rally Timer</h1>
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
            <button className="btn btn-success" onClick={goToOverview} disabled={leaders.length === 0}><Info size={18} /> Go to Overview</button>
          </div>
        </section>


        {/* Overview */}
        <section className="card lg:col-span-2" ref={overviewRef}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Info className="text-primary" /> Launch Overview</h2>
            <div className="flex items-center gap-2">
              <button className="btn btn-icon" title="Voice settings" aria-label="Voice settings" onClick={() => setShowVoiceSettings((v) => !v)}>
                <Settings size={18} />
              </button>
              <span className="badge bg-secondary">{leaders.length} leaders ready</span>
            </div>
          </div>
          {showVoiceSettings && (
            <div className="mb-3 rounded-md border-2 border-gray-100 bg-gray-50 p-3">
              <SpeechSettings />
            </div>
          )}
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
  const [marchTime, setMarchTime] = useState(leader.marchTime);
  const [arrivalOffset, setArrivalOffset] = useState(leader.arrivalOffset);

  const handleSave = () => {
    updateLeader(id, {
      marchTime,
      arrivalOffset,
      editing: false
    });
  };

  const handleCancel = () => {
    setMarchTime(leader.marchTime);
    setArrivalOffset(leader.arrivalOffset);
    updateLeader(id, { editing: false, reset: true });
  };

  return (
    <div className="mt-3 rounded-md border-2 border-gray-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">March Time (s)</label>
          <input
            type="number"
            min={1}
            step={1}
            value={marchTime}
            onChange={(e) => setMarchTime(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Arrival Offset (s)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={arrivalOffset}
            onChange={(e) => setArrivalOffset(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
        <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
}

function SpeechSettings() {
  const [speech, setSpeech] = useRallyStore((s) => [s.speech, s.setSpeech]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    let mounted = true;
    listVoices().then((v) => {
      if (mounted) setVoices(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h2 className="mb-3 text-xl font-semibold">Voice Settings</h2>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={speech.enabled} onChange={(e) => setSpeech({ enabled: e.target.checked })} />
          Enable voice prompts
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
            <select
              className="w-full rounded-md border-2 border-gray-200 bg-gray-50 px-3 py-2 focus:border-primary outline-none"
              value={speech.voiceName || ''}
              onChange={(e) => setSpeech({ voiceName: e.target.value || undefined })}
              disabled={!speech.enabled}
            >
              <option value="">System default</option>
              {voices.map((v) => (
                <option key={`${v.name}-${v.lang}`} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volume: {speech.volume.toFixed(1)}</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={speech.volume}
              onChange={(e) => setSpeech({ volume: Number(e.target.value) })}
              className="w-full"
              disabled={!speech.enabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate: {speech.rate.toFixed(1)}</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speech.rate}
              onChange={(e) => setSpeech({ rate: Number(e.target.value) })}
              className="w-full"
              disabled={!speech.enabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pitch: {speech.pitch.toFixed(1)}</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={speech.pitch}
              onChange={(e) => setSpeech({ pitch: Number(e.target.value) })}
              className="w-full"
              disabled={!speech.enabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CoordinationPanel() {
  const { isActive, countdown, sequenceStatuses, stop } = useRallyStore();
  const speech = useRallyStore((s) => s.speech);

  const announcedGoRef = useRef<Set<string>>(new Set());
  const lastCountdownRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      announcedGoRef.current.clear();
      lastCountdownRef.current = null;
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  // Speak countdown ticks and "Start" when countdown reaches zero
  useEffect(() => {
    if (!isSpeechSupported()) return;
    if (!isActive) {
      announcedGoRef.current.clear();
      lastCountdownRef.current = null;
      try { window.speechSynthesis?.cancel(); } catch {}
      return;
    }
    if (!speech.enabled) return;
    if (countdown > 0 && countdown !== lastCountdownRef.current) {
      speak(String(countdown), { voiceName: speech.voiceName, volume: speech.volume, rate: speech.rate, pitch: speech.pitch });
      lastCountdownRef.current = countdown;
    } else if (countdown === 0 && lastCountdownRef.current !== 0) {
      speak('Start', { voiceName: speech.voiceName, volume: speech.volume, rate: speech.rate, pitch: speech.pitch, interrupt: false });
      lastCountdownRef.current = 0;
    }
  }, [isActive, countdown, speech.enabled, speech.voiceName, speech.volume, speech.rate, speech.pitch]);

  // Announce leader names when they switch to GO
  useEffect(() => {
    if (!isSpeechSupported()) return;
    if (!isActive || countdown > 0 || !speech.enabled) return;
    for (const s of sequenceStatuses) {
      if (s.state === 'go' && !announcedGoRef.current.has(s.id)) {
        announcedGoRef.current.add(s.id);
        speak(`${s.name}`, { voiceName: speech.voiceName, volume: speech.volume, rate: speech.rate, pitch: speech.pitch, interrupt: false });
      }
    }
  }, [isActive, countdown, sequenceStatuses, speech.enabled, speech.voiceName, speech.volume, speech.rate, speech.pitch]);

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
