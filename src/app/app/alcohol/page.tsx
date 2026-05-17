"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Minus,
  Shield,
  AlertTriangle,
  X,
  Droplets,
  BookOpen,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────
const STORAGE_KEY = "alcohol-tracker";
const API_KEY = "alcohol-tracker";
const CAL_PER_DRINK = 130;
const BASELINE_DRINKS_PER_WEEK = 8;

const CRAVING_STEPS = [
  { text: "STOP. Set a 10-minute timer.", detail: "Most cravings peak and pass in 7-10 minutes." },
  { text: "Drink 16oz ice water immediately.", detail: "Cold water activates the vagus nerve, lowering anxiety." },
  { text: "5 deep breaths: 4s in, 7s hold, 8s out.", detail: "Box breathing. Used by Navy SEALs." },
  { text: "Ask: \"How will I feel at 5 AM tomorrow?\"", detail: "Bloated. Dehydrated. Regretful. You know the answer." },
  { text: "Read your WHY.", detail: "CAD. Diabetes. Sleep apnea. Every skipped drink votes for the 180-lb version." },
  { text: "Make a replacement drink.", detail: "Sparkling water + lime. Herbal tea. Protein shake. Give your hands a job." },
  { text: "Move your body.", detail: "20 push-ups. A 10-minute walk. Movement changes neurochemistry fast." },
  { text: "Text someone.", detail: "Don't have to explain. Just connect. Isolation fuels cravings." },
];

const ALTERNATIVES = [
  { emoji: "💧", name: "Sparkling Water + Lime", when: "Default" },
  { emoji: "🍵", name: "Herbal Tea", when: "Evening" },
  { emoji: "🍺", name: "Athletic Brewing NA", when: "Social" },
  { emoji: "🍒", name: "Tart Cherry Juice", when: "Post-Training" },
  { emoji: "🌿", name: "Low-sugar Kombucha", when: "Weekend" },
  { emoji: "🥤", name: "Protein Shake", when: "Craving Killer" },
];

const QUICK_DRINKS = [
  { emoji: "🍷", name: "Wine", meta: "5 oz · 120 cal" },
  { emoji: "🍺", name: "Beer", meta: "12 oz · 150 cal" },
  { emoji: "🥃", name: "Spirit", meta: "1.5 oz · 100 cal" },
];

// ── Types ──────────────────────────────────────────────────
type State = {
  drinks: Record<string, number>;
  notes: Record<string, string>;
  weeklyTarget: number;
  skipUses: number;
};

const defaultState: State = {
  drinks: {},
  notes: {},
  weeklyTarget: 7,
  skipUses: 0,
};

// ── Helpers ────────────────────────────────────────────────
function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function isoDate(daysBack: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function lastNDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => isoDate(n - 1 - i));
}
function dayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
function fullDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function isOldShape(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return "tasks" in d || "streak" in d || "xp" in d || "badges" in d;
}

// ── Main Component ─────────────────────────────────────────
export default function AlcoholPage() {
  const [state, setState] = useState<State>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const hydratedFromServerRef = useRef(false);

  // Load from server with localStorage fallback. Detect old-shape data
  // (90-day no-alcohol schema) and reset to defaults.
  useEffect(() => {
    async function load() {
      // Clear legacy localStorage key from previous design
      try {
        localStorage.removeItem("operation-clear-mind");
      } catch {}

      let serverReachable = false;
      let serverData: State | null = null;
      try {
        const res = await fetch(`/api/user-state/${API_KEY}`);
        if (res.ok) {
          serverReachable = true;
          const json = await res.json();
          if (json?.data && typeof json.data === "object" && !isOldShape(json.data)) {
            serverData = { ...defaultState, ...(json.data as Partial<State>) };
          }
        }
      } catch {
        // Network failure
      }

      if (serverData) {
        setState(serverData);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
        } catch {}
        hydratedFromServerRef.current = true;
        setLoaded(true);
        return;
      }

      // No (valid) server data — fall back to local cache
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!isOldShape(parsed)) {
            const merged: State = { ...defaultState, ...parsed };
            setState(merged);
            if (serverReachable) {
              hydratedFromServerRef.current = true;
              fetch(`/api/user-state/${API_KEY}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: merged }),
              }).catch(() => {});
            } else {
              setLoadError("Offline — showing cached data. Changes sync when reconnected.");
            }
            setLoaded(true);
            return;
          }
        }
      } catch {}

      // Truly empty — fresh start with defaults
      if (serverReachable) {
        hydratedFromServerRef.current = true;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
        } catch {}
        setLoaded(true);
      } else {
        setLoadError("Couldn't load your data. Check your connection and refresh.");
      }
    }
    load();
  }, []);

  // Debounced save (server + localStorage write-through)
  const save = useCallback((next: State) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    if (!hydratedFromServerRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/user-state/${API_KEY}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: stateRef.current }),
        });
      } catch {
        // Local cache still has the latest data
      }
      saveTimeoutRef.current = null;
    }, 800);
  }, []);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        const data = JSON.stringify({ data: stateRef.current });
        navigator.sendBeacon?.(`/api/user-state/${API_KEY}`, new Blob([data], { type: "application/json" }));
      }
    };
  }, []);

  // Derived values
  const today = todayISO();
  const todayDrinks = state.drinks[today] || 0;
  const last7 = lastNDates(7);
  const week7Values = last7.map((d) => state.drinks[d] || 0);
  const weekTotal = week7Values.reduce((a, b) => a + b, 0);
  const dryDays7 = week7Values.filter((v) => v === 0).length;
  const last30 = lastNDates(30);
  const total30 = last30.reduce((sum, d) => sum + (state.drinks[d] || 0), 0);
  const avgPerWeek30 = (total30 / 30) * 7;
  const targetRatio = state.weeklyTarget > 0 ? weekTotal / state.weeklyTarget : 0;
  const targetStatus: "good" | "warn" | "bad" =
    targetRatio > 1 ? "bad" : targetRatio > 0.8 ? "warn" : "good";
  const remaining = Math.max(0, state.weeklyTarget - weekTotal);
  const cals30 = total30 * CAL_PER_DRINK;
  const maxBar = Math.max(...week7Values, 1);

  // Mutators
  function setDrinks(date: string, count: number) {
    const safeCount = Math.max(0, Math.min(20, count));
    const nextDrinks = { ...state.drinks };
    if (safeCount === 0) {
      delete nextDrinks[date];
    } else {
      nextDrinks[date] = safeCount;
    }
    save({ ...state, drinks: nextDrinks });
  }

  function bumpToday(delta: number) {
    setDrinks(today, todayDrinks + delta);
  }

  function commitTarget() {
    const n = parseInt(targetDraft, 10);
    if (!Number.isNaN(n)) {
      save({ ...state, weeklyTarget: Math.max(0, Math.min(50, n)) });
    }
    setEditingTarget(false);
  }

  function startEditTarget() {
    setTargetDraft(String(state.weeklyTarget));
    setEditingTarget(true);
  }

  function addNote() {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;
    const existing = state.notes[today];
    const combined = existing ? `${existing}\n${trimmed}` : trimmed;
    save({ ...state, notes: { ...state.notes, [today]: combined } });
    setNoteDraft("");
  }

  function logSkip() {
    save({ ...state, skipUses: state.skipUses + 1 });
    setShowSkip(false);
  }

  // Loading state
  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-6 text-center">
        {loadError ? (
          <>
            <AlertTriangle className="h-8 w-8 text-warning" />
            <p className="text-sm text-text-secondary max-w-xs">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </>
        ) : (
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Offline banner */}
      {loadError && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">Alcohol Tracker</h1>
        <p className="text-xs text-text-secondary">Mindful intake — log honestly, hit your target</p>
      </div>

      {/* Today's logger */}
      <div className="bg-surface border border-border border-l-4 border-l-primary rounded-xl p-4">
        <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
          Today · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => bumpToday(-1)}
            disabled={todayDrinks === 0}
            className="w-12 h-12 rounded-full bg-surface-highest border border-border text-primary flex items-center justify-center disabled:opacity-30 hover:bg-surface-high transition-colors"
            aria-label="Decrement drinks"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-primary leading-none tabular-nums">{todayDrinks}</div>
            <div className="text-xs text-text-muted mt-1">{todayDrinks === 1 ? "drink" : "drinks"}</div>
          </div>
          <button
            onClick={() => bumpToday(1)}
            className="w-12 h-12 rounded-full bg-surface-highest border border-border text-primary flex items-center justify-center hover:bg-surface-high transition-colors"
            aria-label="Increment drinks"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {QUICK_DRINKS.map((d) => (
            <button
              key={d.name}
              onClick={() => bumpToday(1)}
              className="bg-surface-highest border border-border rounded-lg p-2 text-center hover:border-primary/40 transition-colors"
            >
              <span className="text-xl block">{d.emoji}</span>
              <p className="text-[11px] font-bold mt-0.5">{d.name}</p>
              <p className="text-[9px] text-text-muted">{d.meta}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly target */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">This Week</span>
          {editingTarget ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={50}
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTarget();
                  if (e.key === "Escape") setEditingTarget(false);
                }}
                onBlur={commitTarget}
                autoFocus
                className="w-14 px-2 py-0.5 text-xs bg-surface-highest border border-primary rounded text-text font-bold"
              />
              <span className="text-[11px] text-text-muted">/wk</span>
            </div>
          ) : (
            <button
              onClick={startEditTarget}
              className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide
                ${targetStatus === "good"
                  ? "bg-success/15 text-success"
                  : targetStatus === "warn"
                    ? "bg-warning/15 text-warning"
                    : "bg-error/15 text-error"
                }`}
            >
              {weekTotal} / {state.weeklyTarget} target
            </button>
          )}
        </div>
        <div className="h-2 bg-surface-highest rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500
              ${targetStatus === "bad"
                ? "bg-error"
                : "bg-gradient-to-r from-success to-primary"
              }`}
            style={{ width: `${Math.min(100, targetRatio * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-text-muted mt-2">
          {targetStatus === "bad"
            ? `${weekTotal - state.weeklyTarget} over target — reset Sunday`
            : `${remaining} ${remaining === 1 ? "drink" : "drinks"} left this week`}
          <span className="text-[10px] ml-2 opacity-70">· tap to edit</span>
        </p>
      </div>

      {/* Week bar chart */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <span className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
          Last 7 Days
        </span>
        <div className="flex items-end gap-1.5 h-24 mt-3">
          {last7.map((d, i) => {
            const v = week7Values[i];
            const heightPct = v === 0 ? 6 : Math.max(15, (v / maxBar) * 100);
            const isToday = d === today;
            const isOver = state.weeklyTarget > 0 && v > state.weeklyTarget / 7 + 1;
            const colorClass = v === 0
              ? "bg-success/30"
              : isOver
                ? "bg-error/40"
                : "bg-primary/30";
            return (
              <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] text-text-muted mb-0.5 tabular-nums">{v}</span>
                <div
                  className={`w-full rounded-t transition-all
                    ${colorClass}
                    ${isToday ? "ring-1 ring-primary" : ""}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1.5 mt-2">
          {last7.map((d) => (
            <span key={d} className="flex-1 text-center text-[10px] text-text-muted">
              {dayLabel(d)}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Avg/wk (30d)" value={avgPerWeek30.toFixed(1)} />
        <StatCard label="Dry days (7d)" value={`${dryDays7}/7`} />
        <StatCard
          label="Cal (30d)"
          value={cals30 > 1000 ? `${(cals30 / 1000).toFixed(1)}k` : String(cals30)}
        />
      </div>

      {/* Insight */}
      <Insight
        weekTotal={weekTotal}
        target={state.weeklyTarget}
        avgPerWeek={avgPerWeek30}
        dryDays={dryDays7}
      />

      {/* Alternatives */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Droplets className="h-4 w-4 text-primary" /> Alternatives
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALTERNATIVES.map((a) => (
            <div
              key={a.name}
              className="bg-surface-highest border border-border rounded-lg p-2 text-center"
            >
              <span className="text-lg block">{a.emoji}</span>
              <p className="text-[11px] font-bold mt-0.5 leading-tight">{a.name}</p>
              <p className="text-[10px] text-text-muted">{a.when}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Notes — today */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-primary" /> Notes — Today
        </h2>
        {state.notes[today] && (
          <div className="bg-surface-highest border border-border rounded-lg p-3 mb-3 whitespace-pre-wrap text-[12px] text-text-secondary">
            {state.notes[today]}
          </div>
        )}
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Craving, social context, how you felt the morning after…"
          className="w-full bg-surface-highest border border-border rounded-lg p-2 text-[12px] text-text resize-y min-h-[60px] outline-none focus:border-primary"
        />
        <button
          onClick={addNote}
          disabled={!noteDraft.trim()}
          className="mt-2 w-full py-2 bg-primary text-on-primary text-[12px] font-bold rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Save Note
        </button>
      </div>

      {/* Recent notes */}
      {Object.keys(state.notes).filter((d) => d !== today).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[10px] uppercase tracking-wide text-text-muted font-semibold px-1">
            Recent Notes
          </h2>
          {Object.entries(state.notes)
            .filter(([d]) => d !== today)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 5)
            .map(([date, text]) => (
              <div key={date} className="bg-surface border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase text-text-muted tracking-wide font-semibold">
                  {fullDateLabel(date)}
                </p>
                <p className="text-[12px] text-text-secondary mt-1 whitespace-pre-wrap">{text}</p>
              </div>
            ))}
        </div>
      )}

      {/* Skip Tonight FAB */}
      <button
        onClick={() => setShowSkip(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 sm:bottom-6 z-30 w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-elevated hover:scale-110 active:scale-95 transition-transform"
        title="Skip Tonight Protocol"
      >
        <Shield className="h-6 w-6" />
      </button>

      {/* Skip Tonight Modal */}
      {showSkip && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-surface border border-primary rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
                <Shield className="h-5 w-5" /> Skip Tonight Protocol
              </h2>
              <button
                onClick={() => setShowSkip(false)}
                className="text-text-muted hover:text-text"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              You&apos;re considering a drink. That&apos;s normal. Here&apos;s the 10-minute protocol:
            </p>
            <div className="space-y-3">
              {CRAVING_STEPS.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{step.text}</p>
                    <p className="text-xs text-text-secondary">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={logSkip}
              className="w-full mt-6 py-3.5 bg-primary text-on-primary font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              I skipped it. 💪 {state.skipUses > 0 ? `(${state.skipUses} total skips)` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-Components ─────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-center">
      <p className="text-xl font-extrabold text-primary leading-none tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mt-1">
        {label}
      </p>
    </div>
  );
}

function Insight({
  weekTotal,
  target,
  avgPerWeek,
  dryDays,
}: {
  weekTotal: number;
  target: number;
  avgPerWeek: number;
  dryDays: number;
}) {
  let msg: string;
  if (target > 0 && weekTotal > target) {
    msg = `You're ${weekTotal - target} ${weekTotal - target === 1 ? "drink" : "drinks"} over target this week. Reset Sunday. Alcohol within 6h of training suppresses overnight MPS ~24% (Parr 2014) — keep training days (Mon/Wed/Fri/Sat) dry.`;
  } else if (dryDays >= 5) {
    const baselineLine = avgPerWeek < BASELINE_DRINKS_PER_WEEK
      ? ` 30-day avg (${avgPerWeek.toFixed(1)}/wk) is below your pre-program baseline (${BASELINE_DRINKS_PER_WEEK}/wk).`
      : "";
    msg = `Strong week — ${dryDays}/7 dry days.${baselineLine} Keep dry days clustered around training.`;
  } else if (avgPerWeek > 0 && avgPerWeek < BASELINE_DRINKS_PER_WEEK) {
    const reduction = Math.round((1 - avgPerWeek / BASELINE_DRINKS_PER_WEEK) * 100);
    msg = `Down ${reduction}% from baseline (${BASELINE_DRINKS_PER_WEEK} drinks/wk pre-program → ${avgPerWeek.toFixed(1)}/wk now). Keep dry days around training (Mon/Wed/Fri/Sat) — alcohol blunts overnight MPS ~24%.`;
  } else if (avgPerWeek === 0 && weekTotal === 0) {
    msg = `No drinks logged yet. Tap +1 above when you have one — honesty is what makes the trend meaningful. Target editable above.`;
  } else {
    msg = `30-day avg: ${avgPerWeek.toFixed(1)} drinks/week. Keep training days (Mon/Wed/Fri/Sat) dry — alcohol within 6h of lifting blunts adaptation (Parr 2014).`;
  }
  return (
    <div className="bg-info/5 border-l-4 border-info rounded-lg p-3 text-[12px] text-text-secondary leading-relaxed">
      {msg}
    </div>
  );
}
