"use client";

import { Rocket, Timer, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="text-white drop-shadow" size={48} />
            <h1 className="text-4xl font-bold text-white drop-shadow">Rally Coordinator</h1>
          </div>
          <p className="text-white/90 text-lg">Choose your rally coordination tool</p>
        </header>

        {/* Main Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Rally Timer Button */}
          <Link href="/rally-timer" className="group">
            <div className="card hover:scale-105 transition-all duration-300 cursor-pointer min-h-[280px] flex flex-col items-center justify-between p-8">
              <div className="flex flex-col items-center space-y-6 flex-1 justify-center">
                <div className="p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Timer className="text-primary" size={56} />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800">Rally Timer</h2>
                  <p className="text-gray-600 text-center leading-relaxed max-w-sm">
                    Coordinate multiple rally leaders with staggered timing and voice announcements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all mt-6">
                <span>Open Timer</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>

          {/* Rally Countdown Button */}
          <Link href="/countdown" className="group">
            <div className="card hover:scale-105 transition-all duration-300 cursor-pointer min-h-[280px] flex flex-col items-center justify-between p-8">
              <div className="flex flex-col items-center space-y-6 flex-1 justify-center">
                <div className="p-6 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <Rocket className="text-secondary" size={56} />
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800">Rally Countdown</h2>
                  <p className="text-gray-600 text-center leading-relaxed max-w-sm">
                    Simple countdown timer with voice announcements for rally coordination
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-secondary font-medium group-hover:gap-3 transition-all mt-6">
                <span>Open Countdown</span>
                <ArrowRight size={18} />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-white/70 text-sm">
            Synchronize or stagger your rallies to hit at perfect times
          </p>
        </div>
      </div>
    </div>
  );
}