import { create } from 'zustand';

type Leader = {
  id: string;
  name: string;
  marchTime: number; // seconds
  arrivalOffset: number; // seconds after the first hit this leader should arrive
  editing?: boolean;
};

type SequenceItem = Leader & {
  startOffset: number; // seconds from coordination start
  arrivalTime: number; // absolute arrival time baseline (seconds from start baseline)
};

type SequenceStatus = { id: string; name: string; state: 'waiting' | 'ready' | 'go' | 'completed'; label: string };

// Form state used by the UI
type FormStateV2 = { name: string; march: number; offset: number };

type SpeechSettings = {
  enabled: boolean;
  voiceName?: string;
  volume: number; // 0..1
  rate: number; // 0.1..10
  pitch: number; // 0..2
};

type Store = {
  leaders: Leader[];
  isActive: boolean;
  countdown: number;
  startedAt: number | null;
  sequenceStatuses: SequenceStatus[];
  form: FormStateV2;
  setForm: (p: Partial<FormStateV2>) => void;
  speech: SpeechSettings;
  setSpeech: (p: Partial<SpeechSettings>) => void;
  addLeader: (l: { name: string; marchTime: number; arrivalOffset: number }) => void;
  removeLeader: (id: string) => void;
  updateLeader: (id: string, update: Partial<Leader> & { reset?: boolean }) => void;
  clear: () => void;
  calculateLaunch: () => SequenceItem[];
  start: () => void;
  stop: () => void;
};

export const useRallyStore = create<Store>((set, get) => ({
  leaders: [],
  isActive: false,
  countdown: 0,
  startedAt: null,
  sequenceStatuses: [],
  form: { name: '', march: 0, offset: 0 },
  setForm: (p) => set((s) => ({ form: { ...s.form, ...p } })),
  speech: { enabled: true, voiceName: undefined, volume: 1, rate: 1, pitch: 1 },
  setSpeech: (p) => set((s) => ({ speech: { ...s.speech, ...p } })),
  addLeader: ({ name, marchTime, arrivalOffset }) =>
    set((s) => {
      const exists = s.leaders.some((l) => l.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (exists) return s; // ignore duplicates
      const leader: Leader = { id: crypto.randomUUID(), name, marchTime, arrivalOffset };
      const next = [...s.leaders, leader];
      // sort by earliest start based on stagger logic
      const sorted = sortByStart(next);
      return { leaders: sorted };
    }),
  removeLeader: (id) => set((s) => ({ leaders: s.leaders.filter((l) => l.id !== id) })),
  updateLeader: (id, update) =>
    set((s) => {
      const leaders = s.leaders.map((l) => (l.id === id ? { ...l, ...('reset' in update && update.reset ? { editing: false } : update) } : l));
      return { leaders: sortByStart(leaders) };
    }),
  clear: () => set({ leaders: [] }),
  calculateLaunch: () => {
    const leaders = get().leaders;
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
  },
  start: () => {
    const seq = get().calculateLaunch();
    if (seq.length === 0) return;
    const now = Date.now();
    set({ isActive: true, countdown: 5, startedAt: null });

    // countdown interval 1s
    const countdownInterval = setInterval(() => {
      const { countdown } = get();
      if (countdown <= 1) {
        clearInterval(countdownInterval);
        set({ countdown: 0, startedAt: Date.now(), sequenceStatuses: seq.map((x) => ({ id: x.id, name: x.name, state: 'waiting', label: 'Waiting' })) });
        // launch ticker every 250ms
        const ticker = setInterval(() => {
          const { startedAt, isActive } = get();
          if (!startedAt || !isActive) {
            clearInterval(ticker);
            return;
          }
          const elapsed = (Date.now() - startedAt) / 1000; // seconds
          const statuses: SequenceStatus[] = seq.map((l) => {
            const launchS = l.startOffset;
            let state: SequenceStatus['state'] = 'waiting';
            let label = 'Waiting';
            if (elapsed >= launchS - 30 && elapsed < launchS) {
              state = 'ready';
              label = `Ready in ${Math.ceil(launchS - elapsed)}s`;
            } else if (elapsed >= launchS && elapsed < launchS + 30) {
              state = 'go';
              label = 'LAUNCH NOW!';
            } else if (elapsed >= launchS + 30) {
              state = 'completed';
              label = 'Launched';
            }
            return { id: l.id, name: l.name, state, label };
          });
          set({ sequenceStatuses: statuses });

          const allDone = statuses.every((s) => s.state === 'completed');
          if (allDone) {
            clearInterval(ticker);
            // Auto-stop coordination when all leaders are completed
            set({ isActive: false, countdown: 0, startedAt: null, sequenceStatuses: [] });
          }
        }, 250);
      } else {
        set({ countdown: countdown - 1 });
      }
    }, 1000);
  },
  stop: () => set({ isActive: false, countdown: 0, startedAt: null, sequenceStatuses: [] }),
}));

function sortByStart(leaders: Leader[]): Leader[] {
  if (leaders.length === 0) return leaders;
  // Keep ordering consistent with calculateLaunch: base = max(march - arrivalOffset)
  const base = Math.max(...leaders.map((l) => l.marchTime - l.arrivalOffset));
  return leaders
    .map((l) => ({
      id: l.id,
      name: l.name,
      marchTime: l.marchTime,
      arrivalOffset: l.arrivalOffset,
      editing: l.editing,
      startOffset: base - (l.marchTime - l.arrivalOffset),
    }))
    .sort((a, b) => a.startOffset - b.startOffset)
    .map(({ startOffset, ...rest }) => rest);
}


