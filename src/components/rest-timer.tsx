"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Pause, Plus, Minus, X } from "lucide-react";

type RestTimerProps = {
  initialSeconds: number;
  exerciseName: string;
  onComplete?: () => void;
  onDismiss: () => void;
};

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio not available
  }
}

function vibrate() {
  try {
    navigator.vibrate?.(200);
  } catch {
    // vibrate not available
  }
}

export function RestTimer({ initialSeconds, exerciseName, onComplete, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isRunning, remaining, clearTimer]);

  useEffect(() => {
    if (remaining === 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      playBeep();
      vibrate();
      onComplete?.();
    }
  }, [remaining, onComplete]);

  const progress = initialSeconds > 0 ? remaining / initialSeconds : 0;

  return (
    <div className="mt-3 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        {/* Timer display */}
        <span className="text-2xl font-bold text-primary tabular-nums min-w-[5rem]">
          {formatTime(remaining)}
        </span>

        {/* Progress bar */}
        <div className="flex-1 h-2 rounded-full bg-surface-high overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setRemaining((prev) => Math.max(0, prev - 30))}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-high hover:text-text transition-colors"
            title="-30s"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsRunning((prev) => !prev)}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setRemaining((prev) => prev + 30)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-high hover:text-text transition-colors"
            title="+30s"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-text-muted mt-1.5 truncate">
        Rest &mdash; {exerciseName}
      </p>
    </div>
  );
}

/* ─── Floating Timer ─── */

type FloatingTimerProps = {
  seconds: number;
  exerciseName: string;
  onTap: () => void;
  onDismiss: () => void;
};

export function FloatingTimer({ seconds, exerciseName, onTap, onDismiss }: FloatingTimerProps) {
  return (
    <div className="fixed bottom-16 sm:bottom-4 inset-x-4 z-30 glass-dark rounded-xl border border-border px-4 py-3 flex items-center gap-3">
      <button
        onClick={onTap}
        className="flex-1 min-w-0 flex items-center gap-3 text-left"
      >
        <span className="text-lg font-bold text-primary tabular-nums">
          {formatTime(seconds)}
        </span>
        <span className="text-sm text-text-secondary truncate">
          {exerciseName}
        </span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
