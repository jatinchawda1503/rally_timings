// Minimal browser speech synthesis helper

export type SpeakOptions = {
	voiceName?: string;
	rate?: number; // 0.1 - 10, default 1
	pitch?: number; // 0 - 2, default 1
	volume?: number; // 0 - 1, default 1
    interrupt?: boolean; // if true cancels current speech; default true
};

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
	return new Promise((resolve) => {
		const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
		if (!synth) return resolve([]);
		const existing = synth.getVoices();
		if (existing && existing.length > 0) {
			cachedVoices = existing;
			return resolve(existing);
		}
		synth.onvoiceschanged = () => {
			const v = synth.getVoices();
			cachedVoices = v;
			resolve(v);
		};
	});
}

export async function listVoices(): Promise<SpeechSynthesisVoice[]> {
	const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
	if (!synth) return [];
	if (cachedVoices && cachedVoices.length > 0) return cachedVoices;
	return loadVoices();
}

export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
	const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
	if (!synth || !text) return;

	// Optionally cancel ongoing speech to avoid overlaps
	const shouldInterrupt = options.interrupt !== undefined ? options.interrupt : true;
	if (shouldInterrupt) {
		try { synth.cancel(); } catch {}
	}

	const utter = new SpeechSynthesisUtterance(text);
	utter.rate = options.rate ?? 1;
	utter.pitch = options.pitch ?? 1;
	utter.volume = options.volume ?? 1;

	const voices = cachedVoices ?? (await loadVoices());
	if (options.voiceName && voices.length > 0) {
		const match = voices.find((v) => v.name.toLowerCase().includes(options.voiceName!.toLowerCase()));
		if (match) utter.voice = match;
	}

	return new Promise((resolve) => {
		utter.onend = () => resolve();
		try { synth.speak(utter); } catch { resolve(); }
	});
}

export function isSpeechSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}


