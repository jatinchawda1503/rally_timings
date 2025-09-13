"use client";

import { useEffect, useRef, useState } from 'react';
import { useRallyStore } from '@/store/rallyStore';
import { speak, isSpeechSupported, listVoices } from '@/lib/speech';
import { Rocket, Play, Pause, Square, Settings, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

export default function CountdownPage() {
  const [countdown, setCountdown] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputSeconds, setInputSeconds] = useState(30);
  const [announcedNumbers, setAnnouncedNumbers] = useState<Set<number>>(new Set());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speech = useRallyStore((s) => s.speech);
  const setSpeech = useRallyStore((s) => s.setSpeech);
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

  // Voice announcements for countdown
  useEffect(() => {
    if (!isSpeechSupported() || !speech.enabled || !isRunning || isPaused) return;
    
    // Announce every second
    if (countdown > 0 && !announcedNumbers.has(countdown)) {
      // Just announce the number of seconds remaining
      speak(String(countdown), { 
        voiceName: speech.voiceName, 
        volume: speech.volume, 
        rate: speech.rate, 
        pitch: speech.pitch 
      });
      
      setAnnouncedNumbers(prev => new Set([...prev, countdown]));
    }
  }, [countdown, isRunning, isPaused, speech.enabled, speech.voiceName, speech.volume, speech.rate, speech.pitch, announcedNumbers]);

  // Final announcement
  useEffect(() => {
    if (countdown === 0 && isRunning && !isPaused) {
      speak('Time\'s up!', { 
        voiceName: speech.voiceName, 
        volume: speech.volume, 
        rate: speech.rate, 
        pitch: speech.pitch,
        interrupt: false
      });
      setIsRunning(false);
    }
  }, [countdown, isRunning, isPaused, speech.voiceName, speech.volume, speech.rate, speech.pitch]);

  const startCountdown = () => {
    if (countdown === 0) {
      setCountdown(inputSeconds);
    }
    setIsRunning(true);
    setIsPaused(false);
    setAnnouncedNumbers(new Set());
    
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPaused(true);
  };

  const resumeCountdown = () => {
    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setCountdown(0);
    setAnnouncedNumbers(new Set());
  };

  const resetCountdown = () => {
    stopCountdown();
    setCountdown(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return inputSeconds > 0 ? ((inputSeconds - countdown) / inputSeconds) * 100 : 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Back Button */}
      <header className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Link href="/" className="text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <Rocket className="text-white drop-shadow" size={28} />
          <h1 className="text-2xl font-bold text-white drop-shadow">Rally Countdown</h1>
        </div>
        <p className="text-white/90 text-sm">Simple countdown timer with voice announcements</p>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          {/* Main Countdown Display */}
          <section className="card text-center flex flex-col justify-center">
            <div className="mb-4">
              <div className="text-6xl font-bold text-primary drop-shadow mb-3">
                {formatTime(countdown)}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              
              <div className="text-lg text-gray-600">
                {isRunning && !isPaused ? 'Running' : isPaused ? 'Paused' : countdown > 0 ? 'Ready' : 'Stopped'}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-3 mb-4">
              {!isRunning ? (
                <button 
                  className="btn btn-success px-6 py-2"
                  onClick={startCountdown}
                  disabled={inputSeconds === 0}
                >
                  <Play size={18} />
                  {countdown === 0 ? 'Start' : 'Resume'}
                </button>
              ) : isPaused ? (
                <button className="btn btn-warning px-6 py-2" onClick={resumeCountdown}>
                  <Play size={18} />
                  Resume
                </button>
              ) : (
                <button className="btn btn-secondary px-6 py-2" onClick={pauseCountdown}>
                  <Pause size={18} />
                  Pause
                </button>
              )}
              
              <button className="btn btn-danger px-6 py-2" onClick={stopCountdown}>
                <Square size={18} />
                Stop
              </button>
            </div>

            {/* Time Input */}
            {!isRunning && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-700">Set Countdown Time (Seconds)</h3>
                <div className="flex justify-center">
                  <div className="text-center">
                    <input
                      type="number"
                      min="1"
                      max="3600"
                      value={inputSeconds}
                      onChange={(e) => setInputSeconds(Math.max(1, Math.min(3600, parseInt(e.target.value) || 1)))}
                      className="w-32 text-center text-3xl font-bold border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-primary outline-none"
                      disabled={isRunning}
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {Math.floor(inputSeconds / 60)}m {inputSeconds % 60}s
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Voice Settings & Instructions */}
          <div className="flex flex-col space-y-4">
            {/* Voice Settings */}
            <section className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Volume2 className="text-primary" size={18} />
                  Voice Settings
                </h2>
                <button 
                  className="btn btn-icon" 
                  onClick={() => setShowSettings(!showSettings)}
                  title="Toggle voice settings"
                >
                  <Settings size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <button
                  className={`btn ${speech.enabled ? 'btn-success' : 'btn-secondary'} text-sm px-4 py-2`}
                  onClick={() => setSpeech({ enabled: !speech.enabled })}
                >
                  {speech.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  {speech.enabled ? 'Voice On' : 'Voice Off'}
                </button>
                <span className="text-xs text-gray-600">
                  {speech.enabled ? 'Voice announcements enabled' : 'Voice announcements disabled'}
                </span>
              </div>

              {showSettings && (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Voice</label>
                      <select
                        className="w-full rounded-md border-2 border-gray-200 bg-gray-50 px-2 py-1 text-sm focus:border-primary outline-none"
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Volume: {speech.volume.toFixed(1)}</label>
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Rate: {speech.rate.toFixed(1)}</label>
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pitch: {speech.pitch.toFixed(1)}</label>
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
              )}
            </section>

            {/* Instructions */}
            <section className="card">
              <h3 className="text-base font-semibold text-gray-700 mb-2">How to Use</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p>• Set countdown time using seconds input</p>
                <p>• Click <strong>Start</strong> to begin countdown</p>
                <p>• Use <strong>Pause</strong> to temporarily stop</p>
                <p>• Use <strong>Stop</strong> to reset timer</p>
                <p>• Voice announces every second</p>
                <p>• Hear "Time's up!" when finished</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
