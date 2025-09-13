import { create } from 'zustand';
import * as XLSX from 'xlsx';

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
  exportToExcel: () => void;
  importFromExcel: (file: File) => Promise<{ success: boolean; error?: string }>;
  downloadSampleExcel: () => void;
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
  exportToExcel: () => {
    const leaders = get().leaders;
    if (leaders.length === 0) return;

    // Prepare data for Excel
    const excelData = leaders.map((leader, index) => ({
      'Leader #': index + 1,
      'Leader Name': leader.name,
      'March Time (seconds)': leader.marchTime,
      'Arrival Offset (seconds)': leader.arrivalOffset,
      'Total Arrival Time (seconds)': leader.marchTime + leader.arrivalOffset,
      'Notes': ''
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // Leader #
      { wch: 20 }, // Leader Name
      { wch: 18 }, // March Time
      { wch: 20 }, // Arrival Offset
      { wch: 22 }, // Total Arrival Time
      { wch: 30 }  // Notes
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Rally Leaders');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `rally-leaders-${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  },
  importFromExcel: async (file: File): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and validate data
      const rows = jsonData.slice(1) as any[][];
      const validLeaders = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue; // Skip empty rows

        const name = row[1]?.toString()?.trim();
        const marchTime = Number(row[2]);
        const arrivalOffset = Number(row[3]);

        // Validate required fields
        if (!name) {
          return { success: false, error: `Row ${i + 2}: Leader name is required` };
        }

        if (isNaN(marchTime) || marchTime <= 0) {
          return { success: false, error: `Row ${i + 2}: March time must be a positive number` };
        }

        if (isNaN(arrivalOffset) || arrivalOffset < 0) {
          return { success: false, error: `Row ${i + 2}: Arrival offset must be a non-negative number` };
        }

        validLeaders.push({
          id: crypto.randomUUID(),
          name,
          marchTime,
          arrivalOffset
        });
      }

      if (validLeaders.length === 0) {
        return { success: false, error: 'No valid leaders found in the Excel file' };
      }

      // Clear existing leaders and add imported ones
      set({ leaders: validLeaders });
      return { success: true };

    } catch (error) {
      return { success: false, error: 'Failed to read Excel file. Please ensure it\'s a valid Excel file.' };
    }
  },
  downloadSampleExcel: () => {
    // Create sample data
    const sampleData = [
      {
        'Leader #': 1,
        'Leader Name': 'Leader 1',
        'March Time (seconds)': 300,
        'Arrival Offset (seconds)': 0,
        'Total Arrival Time (seconds)': 300,
        'Notes': 'First to arrive'
      },
      {
        'Leader #': 2,
        'Leader Name': 'Leader 2',
        'March Time (seconds)': 280,
        'Arrival Offset (seconds)': 30,
        'Total Arrival Time (seconds)': 310,
        'Notes': 'Arrives 30 seconds after first'
      },
      {
        'Leader #': 3,
        'Leader Name': 'Leader 3',
        'March Time (seconds)': 320,
        'Arrival Offset (seconds)': 60,
        'Total Arrival Time (seconds)': 380,
        'Notes': 'Arrives 60 seconds after first'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // Leader #
      { wch: 20 }, // Leader Name
      { wch: 18 }, // March Time
      { wch: 20 }, // Arrival Offset
      { wch: 22 }, // Total Arrival Time
      { wch: 30 }  // Notes
    ];

    // Add instructions in a separate sheet
    const instructionsData = [
      ['Rally Timer Excel Import Instructions'],
      [''],
      ['1. Fill in the data in the "Rally Leaders" sheet'],
      ['2. Leader Name: Enter the name of each rally leader'],
      ['3. March Time (seconds): How long it takes for this leader to reach the target'],
      ['4. Arrival Offset (seconds): How many seconds after the FIRST leader this one should arrive'],
      ['5. Notes: Optional notes for each leader'],
      [''],
      ['Example:'],
      ['- Leader 1: March Time 300s, Offset 0s → Arrives at 300s'],
      ['- Leader 2: March Time 280s, Offset 30s → Starts at 20s, Arrives at 300s'],
      ['- Leader 3: March Time 320s, Offset 60s → Starts at 20s, Arrives at 340s'],
      [''],
      ['Save this file and import it back into the Rally Timer to load your configuration.']
    ];

    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsWs['!cols'] = [{ wch: 80 }]; // Wide column for instructions

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Rally Leaders');
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

    // Save file
    XLSX.writeFile(wb, 'rally-timer-sample.xlsx');
  },
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


