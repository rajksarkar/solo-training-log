"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Flame,
  DollarSign,
  Trophy,
  Shield,
  ChevronDown,
  Check,
  X,
  AlertTriangle,
  Droplets,
  Wind,
  BookOpen,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────
const STORAGE_KEY = "operation-clear-mind";
const START_DATE = "2026-04-12";
const DRINKS_PER_WEEK_BASELINE = 8;
const CAL_PER_DRINK = 150;
const COST_PER_DRINK = 7;

const LEVELS = [
  { level: 1, title: "Recruit", subtitle: "The journey begins", xp: 0 },
  { level: 2, title: "Initiate", subtitle: "Building awareness", xp: 100 },
  { level: 3, title: "Fighter", subtitle: "You're in the ring", xp: 300 },
  { level: 4, title: "Warrior", subtitle: "Discipline over desire", xp: 600 },
  { level: 5, title: "Centurion", subtitle: "30 days strong", xp: 1000 },
  { level: 6, title: "Ironclad", subtitle: "Unshakeable", xp: 1500 },
  { level: 7, title: "Titan", subtitle: "60 days — new identity", xp: 2100 },
  { level: 8, title: "Champion", subtitle: "The hard middle is behind you", xp: 2800 },
  { level: 9, title: "Legend", subtitle: "90 days — you did it", xp: 3500 },
  { level: 10, title: "Clear Mind", subtitle: "This is who you are now", xp: 4500 },
];

type Badge = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  xp: number;
  condition: (s: AppState) => boolean;
};

const BADGES: Badge[] = [
  { id: "day1", icon: "🌅", name: "Day One", desc: "Started the journey", xp: 50, condition: (s) => s.streak >= 1 },
  { id: "day3", icon: "💪", name: "Three-Peat", desc: "3 days alcohol-free", xp: 75, condition: (s) => s.streak >= 3 },
  { id: "week1", icon: "🏅", name: "Week One", desc: "7 consecutive sober days", xp: 100, condition: (s) => s.streak >= 7 },
  { id: "twoweeks", icon: "⚡", name: "Fortnight", desc: "14 days — cravings weakening", xp: 150, condition: (s) => s.streak >= 14 },
  { id: "month1", icon: "🏆", name: "The First 30", desc: "Phase 1 complete", xp: 300, condition: (s) => s.streak >= 30 },
  { id: "day45", icon: "🧪", name: "Lab Rat", desc: "Bloodwork at Day 45", xp: 200, condition: (s) => s.streak >= 45 },
  { id: "month2", icon: "⭐", name: "Double Down", desc: "60 days — new neural pathways", xp: 400, condition: (s) => s.streak >= 60 },
  { id: "day75", icon: "🔥", name: "On Fire", desc: "75 days — almost there", xp: 300, condition: (s) => s.streak >= 75 },
  { id: "month3", icon: "👑", name: "Clear Mind", desc: "90 days — mission complete", xp: 500, condition: (s) => s.streak >= 90 },
  { id: "emergency5", icon: "🛡️", name: "Crisis Survivor", desc: "Used craving protocol 5 times", xp: 150, condition: (s) => s.emergencyUses >= 5 },
  { id: "social3", icon: "🎉", name: "Social Proof", desc: "3 social events without drinking", xp: 200, condition: (s) => s.socialEvents >= 3 },
  { id: "journal10", icon: "📖", name: "Chronicler", desc: "10 journal entries", xp: 100, condition: (s) => (s.journal || []).filter((j) => j.text.trim()).length >= 10 },
  { id: "calories10k", icon: "🥗", name: "Calorie Crusher", desc: "Saved 10,000+ calories", xp: 150, condition: (s) => s.calsSaved >= 10000 },
  { id: "money200", icon: "💰", name: "Money Stacker", desc: "Saved $200+", xp: 150, condition: (s) => s.moneySaved >= 200 },
  { id: "training_pr", icon: "🏋️", name: "Sober PR", desc: "Hit a training PR while sober", xp: 200, condition: (s) => s.soberPR >= 1 },
  { id: "hundred", icon: "💯", name: "The Century", desc: "100 days — you're unstoppable", xp: 500, condition: (s) => s.streak >= 100 },
];

const PHASE1_TASKS: Record<string, string[]> = {
  week1: [
    "Remove all alcohol from your home — pour it out or give it away",
    "Identify your #1 drinking trigger today and write it down",
    "Have a replacement drink every time a craving hits",
    "Rate your craving intensity (1-10) before bed",
  ],
  week2: [
    "Notice your sleep quality — are you sleeping deeper without alcohol?",
    "Walk 20 min when a craving hits — movement changes your neurochemistry",
    "Stock your fridge with 3+ replacement drinks at all times",
    "Write one sentence about how you feel vs. last week",
  ],
  week3: [
    "Attend or plan a social event without drinking — practice ordering sober",
    "5 min meditation or breathwork when craving hits",
    "Tell at least one more person you've quit — widen accountability",
    "Notice: how is your training performance changing?",
  ],
  week4: [
    'Write your personal "I don\'t drink" identity statement',
    "Calculate your 30-day savings (money, calories, hours)",
    "Get baseline bloodwork — this is your Day 30 checkpoint",
    "Celebrate 30 days with a non-alcohol reward you genuinely want",
  ],
};

const PHASE2_TASKS: Record<string, string[]> = {
  week5: [
    "You're past 30 days — the hardest part is behind you. Keep going.",
    "Log your sleep quality (1-10) — deep sleep should be noticeably better",
    "Take a craving inventory: when, where, what triggered it?",
    "Compare your training logs: are you lifting more than 30 days ago?",
  ],
  week6: [
    "Zero alcohol — most people slip around now. You won't.",
    "If craving hits: use the emergency protocol (shield button)",
    "Notice your training performance — are lifts feeling better?",
    "Check your morning energy level — compare to 30 days ago",
  ],
  week7: [
    "Schedule bloodwork this week",
    "Compare: morning weight trend, sleep data, BP readings",
    "Practice ordering sober at a restaurant or bar",
    "Journal: what's the hardest part right now?",
  ],
  week8: [
    "You're building an identity now — not quitting, just don't drink",
    "Calculate total money saved so far",
    "Set a training goal for the next 30 days",
    "Notice: do you feel sharper at work? In conversations?",
  ],
};

const PHASE3_TASKS: Record<string, string[]> = {
  week9: [
    "You don't drink. This is who you are.",
    "Help someone else who's struggling (text, call, check in)",
    "Write your 6-month vision: body comp, health, career, energy",
    "Review your bloodwork improvements — share with your doctor",
  ],
  week10: [
    "The final stretch — schedule your Day 90 DEXA scan",
    "Plan your 90-day celebration (not involving alcohol)",
    "Write a letter to Day 1 you — look how far you've come",
    "Decide: what will you do with the $500+ you saved?",
  ],
};

const WEEKS = [
  { id: "week1", label: "Week 1: Clean Break", days: [1, 7], tasks: PHASE1_TASKS.week1, phase: 1 },
  { id: "week2", label: "Week 2: Building Routines", days: [8, 14], tasks: PHASE1_TASKS.week2, phase: 1 },
  { id: "week3", label: "Week 3: Social Pressure Test", days: [15, 21], tasks: PHASE1_TASKS.week3, phase: 1 },
  { id: "week4", label: "Week 4: First Month Victory", days: [22, 30], tasks: PHASE1_TASKS.week4, phase: 1 },
  { id: "week5", label: "Week 5: Riding Momentum", days: [31, 37], tasks: PHASE2_TASKS.week5, phase: 2 },
  { id: "week6", label: "Week 6: Navigating Triggers", days: [38, 44], tasks: PHASE2_TASKS.week6, phase: 2 },
  { id: "week7", label: "Week 7: Bloodwork Check", days: [45, 51], tasks: PHASE2_TASKS.week7, phase: 2 },
  { id: "week8", label: "Week 8-9: Building Momentum", days: [52, 60], tasks: PHASE2_TASKS.week8, phase: 2 },
  { id: "week9", label: "Week 9-10: Cementing Habits", days: [61, 74], tasks: PHASE3_TASKS.week9, phase: 3 },
  { id: "week10", label: "Week 11-12: Victory Lap", days: [75, 90], tasks: PHASE3_TASKS.week10, phase: 3 },
];

const CRAVING_STEPS = [
  { text: "STOP. Set a 10-minute timer.", detail: "Most cravings peak and pass in 7-10 minutes." },
  { text: "Drink 16oz ice water immediately.", detail: "Cold water activates your vagus nerve, lowering anxiety." },
  { text: "5 deep breaths: 4s in, 7s hold, 8s out.", detail: "Box breathing. Navy SEALs use this." },
  { text: "Ask: \"How will I feel at 5 AM tomorrow?\"", detail: "Bloated. Dehydrated. Regretful. You know the answer." },
  { text: "Read your WHY.", detail: "CAD. Diabetes. Sleep apnea. Every sober hour is a vote for the 180-lb version of you." },
  { text: "Make your replacement drink.", detail: "Sparkling water + lime. Herbal tea. Protein shake. Give your hands something to do." },
  { text: "Move your body.", detail: "20 push-ups. A 10-minute walk. Physical movement changes neurochemistry immediately." },
  { text: "Text someone.", detail: "You don't have to explain. Just connect. Isolation fuels cravings." },
];

// ── Types ──────────────────────────────────────────────────
type JournalEntry = { date: string; text: string };

type AppState = {
  tasks: Record<string, boolean>;
  streak: number;
  maxStreak: number;
  xp: number;
  calsSaved: number;
  moneySaved: number;
  drinksAvoided: number;
  emergencyUses: number;
  socialEvents: number;
  soberPR: number;
  badges: string[];
  journal: JournalEntry[];
  lastCheckIn: string | null;
};

const defaultState: AppState = {
  tasks: {},
  streak: 0,
  maxStreak: 0,
  xp: 0,
  calsSaved: 0,
  moneySaved: 0,
  drinksAvoided: 0,
  emergencyUses: 0,
  socialEvents: 0,
  soberPR: 0,
  badges: [],
  journal: [],
  lastCheckIn: null,
};

// ── Helpers ────────────────────────────────────────────────
function daysSinceStart(): number {
  const start = new Date(START_DATE + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function dateForDay(day: number): string {
  const d = new Date(START_DATE + "T00:00:00");
  d.setDate(d.getDate() + day - 1);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getLevel(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }
  const progress = next === current ? 100 : ((xp - current.xp) / (next.xp - current.xp)) * 100;
  return { current, next, progress: Math.min(100, progress) };
}

function recalcStreak(tasks: Record<string, boolean>): number {
  const currentDay = daysSinceStart();
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (tasks[`day-${d}-sober`]) streak++;
    else break;
  }
  return streak;
}

function recalcSavings(streak: number) {
  const drinksPerDay = DRINKS_PER_WEEK_BASELINE / 7;
  const drinksAvoided = Math.round(streak * drinksPerDay);
  return {
    drinksAvoided,
    calsSaved: Math.round(drinksAvoided * CAL_PER_DRINK),
    moneySaved: Math.round(drinksAvoided * COST_PER_DRINK),
  };
}

// ── Main Component ─────────────────────────────────────────
export default function AlcoholPage() {
  const [state, setState] = useState<AppState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [activePhase, setActivePhase] = useState(1);
  const [openWeeks, setOpenWeeks] = useState<Record<string, boolean>>({});
  const [showEmergency, setShowEmergency] = useState(false);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setState({ ...defaultState, ...JSON.parse(raw) });
      } catch {
        setState(defaultState);
      }
    }
    setLoaded(true);
  }, []);

  // Save to localStorage
  const save = useCallback(
    (next: AppState) => {
      setState(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    []
  );

  // Auto-open current week & set phase on load
  useEffect(() => {
    if (!loaded) return;
    const currentDay = daysSinceStart();
    for (const w of WEEKS) {
      if (currentDay >= w.days[0] && currentDay <= w.days[1]) {
        setOpenWeeks((o) => ({ ...o, [w.id]: true }));
        setActivePhase(w.phase);
        break;
      }
    }
  }, [loaded]);

  // Check & award badges
  const checkBadges = useCallback(
    (s: AppState): AppState => {
      let updated = { ...s };
      let changed = false;
      for (const badge of BADGES) {
        if (!updated.badges.includes(badge.id) && badge.condition(updated)) {
          updated = { ...updated, badges: [...updated.badges, badge.id], xp: updated.xp + badge.xp };
          changed = true;
          setBadgeToast(badge);
          setTimeout(() => setBadgeToast(null), 3500);
        }
      }
      return changed ? updated : s;
    },
    []
  );

  // Toggle a task checkbox
  function toggleTask(key: string, xpValue: number) {
    const wasChecked = state.tasks[key];
    const newTasks = { ...state.tasks, [key]: !wasChecked };
    const xpDelta = wasChecked ? -xpValue : xpValue;
    const streak = recalcStreak(newTasks);
    const savings = recalcSavings(streak);
    let next: AppState = {
      ...state,
      tasks: newTasks,
      xp: Math.max(0, state.xp + xpDelta),
      streak,
      maxStreak: Math.max(state.maxStreak, streak),
      ...savings,
    };
    next = checkBadges(next);
    save(next);
  }

  // Emergency protocol used
  function useEmergencyProtocol() {
    let next: AppState = {
      ...state,
      emergencyUses: state.emergencyUses + 1,
      xp: state.xp + 10,
    };
    next = checkBadges(next);
    save(next);
    setShowEmergency(false);
  }

  // Journal
  function addJournalEntry() {
    const next: AppState = {
      ...state,
      journal: [{ date: new Date().toISOString(), text: "" }, ...state.journal],
    };
    save(next);
  }

  function updateJournal(index: number, text: string) {
    const journal = [...state.journal];
    journal[index] = { ...journal[index], text };
    let next: AppState = { ...state, journal };
    next = checkBadges(next);
    save(next);
  }

  // Reset
  function resetAll() {
    if (confirm("Are you sure? This will erase ALL your progress.")) {
      if (confirm("Really? You'll lose your streak, XP, badges, and journal entries.")) {
        localStorage.removeItem(STORAGE_KEY);
        setState(defaultState);
      }
    }
  }

  const currentDay = daysSinceStart();
  const { current: lvl, next: nextLvl, progress: xpProgress } = getLevel(state.xp);
  const phaseWeeks = WEEKS.filter((w) => w.phase === activePhase);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Badge Toast */}
      {badgeToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-surface border-2 border-primary rounded-xl px-5 py-3 shadow-elevated animate-fade-up">
          <span className="text-3xl">{badgeToast.icon}</span>
          <div>
            <p className="text-sm font-bold text-primary">Badge Earned!</p>
            <p className="text-xs text-text">{badgeToast.name} — +{badgeToast.xp} XP</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">Operation Clear Mind</h1>
        <p className="text-xs text-text-secondary">
          90-Day Alcohol Freedom &middot; Started April 12, 2026
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <StatCard label="Day Streak" value={String(state.streak)} color="text-primary" />
        <StatCard label="Calories Saved" value={state.calsSaved.toLocaleString()} color="text-success" />
        <StatCard label="Money Saved" value={`$${state.moneySaved}`} color="text-info" />
        <StatCard label="Drinks Skipped" value={String(state.drinksAvoided)} color="text-purple-400" />
        <StatCard label="Total XP" value={state.xp.toLocaleString()} color="text-cyan-400" />
      </div>

      {/* XP / Level Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-primary text-primary flex items-center justify-center text-sm font-extrabold bg-primary/10">
              {lvl.level}
            </div>
            <div>
              <p className="text-sm font-bold">{lvl.title}</p>
              <p className="text-[11px] text-text-muted">{lvl.subtitle}</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary font-semibold">
            <span className="text-primary">{state.xp}</span> / {nextLvl.xp} XP
          </p>
        </div>
        <div className="h-2 bg-surface-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-bright rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 border border-border">
        {[
          { p: 1, label: "Foundation", sub: "Days 1-30" },
          { p: 2, label: "Strengthen", sub: "Days 31-60" },
          { p: 3, label: "Lock-In", sub: "Days 61-90" },
          { p: 0, label: "Badges", sub: `${state.badges.length}/${BADGES.length}` },
        ].map((t) => (
          <button
            key={t.p}
            onClick={() => setActivePhase(t.p)}
            className={`flex-1 py-2.5 px-1 rounded-lg text-center transition-all ${
              activePhase === t.p
                ? "bg-primary text-on-primary font-bold"
                : "text-text-muted hover:text-text-secondary hover:bg-surface-high"
            }`}
          >
            <span className="text-[12px] leading-tight block">{t.label}</span>
            <span className="text-[10px] opacity-70 block">{t.sub}</span>
          </button>
        ))}
      </div>

      {/* Phase Content */}
      {activePhase > 0 && (
        <div className="space-y-3">
          {/* Phase Header */}
          <PhaseHeader phase={activePhase} />

          {/* Week Blocks */}
          {phaseWeeks.map((week) => (
            <WeekBlock
              key={week.id}
              week={week}
              currentDay={currentDay}
              tasks={state.tasks}
              open={!!openWeeks[week.id]}
              onToggle={() => setOpenWeeks((o) => ({ ...o, [week.id]: !o[week.id] }))}
              onToggleTask={toggleTask}
            />
          ))}

          {/* Projections (Phase 3 only) */}
          {activePhase === 3 && <Projections />}
        </div>
      )}

      {/* Badges Tab */}
      {activePhase === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Achievement Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BADGES.map((badge) => {
              const earned = state.badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`bg-surface border rounded-xl p-3 text-center transition-all ${
                    earned
                      ? "border-primary/40 bg-gradient-to-b from-surface to-primary/5"
                      : "border-border opacity-40"
                  }`}
                >
                  <span className="text-2xl block mb-1">{badge.icon}</span>
                  <p className="text-[11px] font-bold">{badge.name}</p>
                  <p className="text-[10px] text-text-muted leading-tight">{badge.desc}</p>
                  <p className="text-[10px] text-primary font-bold mt-1">
                    {earned ? "✓ " : ""}+{badge.xp} XP
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Replacement Drinks */}
      <ReplacementDrinks />

      {/* Journal */}
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Sobriety Journal
        </h2>
        {state.journal.map((entry, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-3">
            <textarea
              className="w-full bg-transparent text-sm text-text resize-y min-h-[50px] outline-none leading-relaxed placeholder:text-text-muted"
              placeholder="How are you feeling? What's on your mind?"
              value={entry.text}
              onChange={(e) => updateJournal(i, e.target.value)}
            />
            <p className="text-[10px] text-text-muted text-right mt-1">
              {new Date(entry.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
        <button
          onClick={addJournalEntry}
          className="w-full py-3 border border-dashed border-border rounded-xl text-text-muted text-sm hover:border-primary hover:text-primary transition-colors"
        >
          + Add Journal Entry
        </button>
      </div>

      {/* Reset */}
      <div className="text-center pt-6 border-t border-border">
        <button onClick={resetAll} className="text-[11px] text-text-muted hover:text-error transition-colors">
          Reset All Progress
        </button>
      </div>

      {/* Emergency FAB */}
      <button
        onClick={() => setShowEmergency(true)}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 sm:bottom-6 z-30 w-14 h-14 rounded-full bg-error text-white flex items-center justify-center shadow-elevated hover:scale-110 active:scale-95 transition-transform"
        title="Craving Emergency"
      >
        <Shield className="h-6 w-6" />
      </button>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-surface border border-error rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-error flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Craving Protocol
              </h2>
              <button onClick={() => setShowEmergency(false)} className="text-text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              You&apos;re feeling the pull. That&apos;s normal. Here&apos;s your 10-minute protocol:
            </p>
            <div className="space-y-3">
              {CRAVING_STEPS.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-error/20 text-error flex items-center justify-center text-xs font-bold shrink-0">
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
              onClick={useEmergencyProtocol}
              className="w-full mt-6 py-3.5 bg-primary text-on-primary font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              I survived it. +10 XP 💪
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-Components ─────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-center">
      <p className={`text-xl font-extrabold leading-none ${color}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold mt-1">{label}</p>
    </div>
  );
}

function PhaseHeader({ phase }: { phase: number }) {
  const data = {
    1: { icon: "🏆", title: "Phase 1: Foundation", desc: "Zero alcohol from day one. Build new habits. Replace every trigger." },
    2: { icon: "⚡", title: "Phase 2: Strengthen", desc: "The hardest part is behind you. Watch your body and mind transform." },
    3: { icon: "👑", title: "Phase 3: Lock-In", desc: "Identity shift. You don't drink. Period." },
  }[phase]!;
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{data.icon}</span>
      <div>
        <h2 className="text-lg font-extrabold">{data.title}</h2>
        <p className="text-xs text-text-secondary">{data.desc}</p>
      </div>
    </div>
  );
}

function WeekBlock({
  week,
  currentDay,
  tasks,
  open,
  onToggle,
  onToggleTask,
}: {
  week: (typeof WEEKS)[number];
  currentDay: number;
  tasks: Record<string, boolean>;
  open: boolean;
  onToggle: () => void;
  onToggleTask: (key: string, xp: number) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-high transition-colors"
      >
        <h3 className="text-[13px] font-bold text-left">{week.label}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-md">
            Days {week.days[0]}-{week.days[1]}
          </span>
          <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-0 divide-y divide-border">
          {Array.from({ length: week.days[1] - week.days[0] + 1 }, (_, i) => week.days[0] + i).map((day) => {
            const isToday = day === currentDay;
            const isPast = day < currentDay;
            const isFuture = day > currentDay;
            const isSober = !!tasks[`day-${day}-sober`];

            return (
              <div key={day} className={`py-3 flex gap-3 ${isFuture ? "opacity-40" : ""}`}>
                {/* Day circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    isSober
                      ? "bg-success text-black"
                      : isToday
                        ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(232,182,48,0.3)]"
                        : "bg-surface-highest text-text-secondary"
                  }`}
                >
                  {day}
                </div>

                {/* Tasks */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
                    Day {day} — {dateForDay(day)}
                  </p>

                  {/* Sober checkbox */}
                  <TaskRow
                    checked={isSober}
                    label="I stayed alcohol-free today (+20 XP)"
                    onToggle={() => onToggleTask(`day-${day}-sober`, 20)}
                  />

                  {/* Daily tasks */}
                  {week.tasks.map((task, ti) => {
                    const key = `day-${day}-task-${ti}`;
                    return (
                      <TaskRow
                        key={key}
                        checked={!!tasks[key]}
                        label={`${task} (+5 XP)`}
                        onToggle={() => onToggleTask(key, 5)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskRow({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-start gap-2 text-left w-full group ${checked ? "line-through text-text-muted" : "text-text-secondary"}`}
    >
      <div
        className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
          checked ? "bg-success border-success" : "border-border-light group-hover:border-primary"
        }`}
      >
        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
      </div>
      <span className="text-[12px] leading-relaxed">{label}</span>
    </button>
  );
}

function ReplacementDrinks() {
  const drinks = [
    { icon: <Droplets className="h-5 w-5 text-cyan-400" />, name: "Sparkling Water + Lime", when: "The Default", desc: "Topo Chico, Perrier. Carbonation + citrus. 0 cal." },
    { icon: <Flame className="h-5 w-5 text-orange-400" />, name: "Herbal Tea", when: "Evening Wind-Down", desc: "Chamomile has mild anxiolytic effects. Improves sleep." },
    { icon: <span className="text-lg">🍺</span>, name: "Athletic Brewing NA", when: "Social Events", desc: "Tastes like beer, zero alcohol. Social camouflage." },
    { icon: <span className="text-lg">🍒</span>, name: "Tart Cherry Juice", when: "Post-Training", desc: "Anti-inflammatory, improves sleep. Mix 2oz with sparkling water." },
    { icon: <Wind className="h-5 w-5 text-green-400" />, name: "Kombucha (low sugar)", when: "Weekend Treat", desc: "Slight tang, fizz, complex flavor. Pick <5g sugar." },
    { icon: <span className="text-lg">🥤</span>, name: "Protein Shake", when: "Craving Killer", desc: "30g protein + banana. Crushes cravings AND hits macros." },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-extrabold flex items-center gap-2">
        <Droplets className="h-5 w-5 text-primary" /> Replacement Arsenal
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {drinks.map((d) => (
          <div key={d.name} className="bg-surface border border-border rounded-xl p-3 hover:border-primary/40 transition-colors">
            <div className="mb-1">{d.icon}</div>
            <p className="text-[12px] font-bold">{d.name}</p>
            <p className="text-[10px] text-primary font-semibold">{d.when}</p>
            <p className="text-[10px] text-text-muted leading-snug mt-0.5">{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Projections() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-extrabold">📈 Your 90-Day Projections</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ProjCard
          title="Body Composition"
          rows={[
            ["Calories saved", "~27,000+"],
            ["Fat loss accelerated", "~3-4 extra lbs"],
            ["MPS recovery", "+37% overnight"],
            ["Target weight", "178-180 lbs"],
          ]}
        />
        <ProjCard
          title="Bloodwork (Expected)"
          rows={[
            ["GGT", "79 → ~35-45"],
            ["A1C", "5.8% → ~5.5%"],
            ["Blood Pressure", "-5 to -10 mmHg"],
            ["Platelets", "119 → 130+"],
          ]}
        />
        <ProjCard
          title="Training Performance"
          rows={[
            ["Sleep quality", "+25-40% deep sleep"],
            ["Recovery", "Significantly faster"],
            ["RPE accuracy", "More consistent"],
            ["Motivation", "Markedly higher"],
          ]}
        />
        <ProjCard
          title="Money & Time"
          rows={[
            ["Money saved", "$500-800+"],
            ["Hours back", "~50-80"],
            ["Hangovers saved", "All of them"],
            ["Better decisions", "Incalculable"],
          ]}
        />
      </div>
    </div>
  );
}

function ProjCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <h3 className="text-[13px] font-bold mb-2">{title}</h3>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between py-1 text-[12px]">
          <span className="text-text-secondary">{label}</span>
          <span className="font-bold text-success">{value}</span>
        </div>
      ))}
    </div>
  );
}
