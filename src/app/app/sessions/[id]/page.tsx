"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Save,
  Check,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Circle,
  CheckCircle2,
  Play,
  Square,
  Trophy,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
import { RestTimer, FloatingTimer, playBeep, vibrate } from "@/components/rest-timer";
import { getInsertionOrder } from "@/lib/exercise-ordering";

type SetLog = {
  id?: string;
  sessionExerciseId: string;
  setIndex: number;
  reps: number | null;
  weight: number | null;
  unit: "lb" | "kg";
  durationSec: number | null;
  distanceMeters: number | null;
  avgHeartRate: number | null;
  rpe: number | null;
  completed: boolean;
};

type SessionExercise = {
  id: string;
  exerciseId: string;
  order: number;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    category: string;
    instructions?: string;
    equipment?: string[] | unknown;
    muscles?: string[] | unknown;
    youtubeId?: string | null;
  };
  setLogs: SetLog[];
};

type Session = {
  id: string;
  title: string;
  category: string;
  date: string;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  exercises: SessionExercise[];
};

type Exercise = { id: string; name: string; category: string };

type PRMap = Record<string, {
  repMaxes: Record<number, { weight: number; unit: string }>;
  bestSet: { weight: number; reps: number; unit: string } | null;
}>;

// Parse UTC date string without timezone shift
function formatSessionDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatWeight(w: number): string {
  if (w >= 1000000) return `${(w / 1000000).toFixed(1)}M`;
  if (w >= 1000) return `${(w / 1000).toFixed(w >= 10000 ? 0 : 1)}k`;
  return w.toLocaleString();
}

// Determine the best input layout for an exercise based on its name and actual data
function getExerciseInputType(
  exerciseName: string,
  _category: string,
  logs: SetLog[]
): "strength" | "cardio" | "metric" | "bodyweight" {
  const name = exerciseName.toLowerCase();

  if (
    name.includes("heart rate") ||
    name.includes("average speed") ||
    name.includes("watt") ||
    name.includes("rower audit")
  ) {
    return "metric";
  }

  if (
    name === "run" ||
    name === "running" ||
    name === "walk" ||
    name.includes("zone 2") ||
    name.includes("stationary bike") ||
    name.includes("rowing") ||
    name.includes("cycling") ||
    name.includes("elliptical") ||
    name.includes("stair climber") ||
    name.includes("assault bike") ||
    name.includes("ski erg") ||
    name.includes("hiking") ||
    name.includes("swimming") ||
    name.includes("cardio")
  ) {
    return "cardio";
  }

  const hasWeight = logs.some((l) => l.weight != null && l.weight > 0);
  if (hasWeight) return "strength";

  const hasDuration = logs.some((l) => l.durationSec != null && l.durationSec > 0);
  if (hasDuration) return "cardio";

  if (
    name.includes("plank") ||
    name.includes("push-up") ||
    name.includes("pushup") ||
    name.includes("bear crawl") ||
    name.includes("bird dog") ||
    name.includes("beast") ||
    name.includes("stretch") ||
    name.includes("nerve gliding") ||
    name.includes("foam roller") ||
    name.includes("wall slide") ||
    name.includes("crunches") ||
    name.includes("yoga")
  ) {
    return "bodyweight";
  }

  return "strength";
}

function getMetricLabel(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("heart rate")) return "Heart Rate (bpm)";
  if (n.includes("speed")) return "Speed (mph)";
  if (n.includes("watt") || n.includes("power")) return "Watts";
  if (n.includes("rower audit")) return "Meters";
  return "Value";
}

type Prescription = {
  sets: number;
  reps: number;
  weight: number | null;
  unit: "lb" | "kg";
  rpe: number | null;
  restSeconds: number | null;
};

function parsePrescription(notes: string | null): Prescription | null {
  if (!notes) return null;
  const setsRepsMatch = notes.match(/(\d+)\s*[x×]\s*(\d+)/);
  if (!setsRepsMatch) return null;

  const sets = parseInt(setsRepsMatch[1], 10);
  const reps = parseInt(setsRepsMatch[2], 10);

  let weight: number | null = null;
  let unit: "lb" | "kg" = "lb";
  const weightMatch = notes.match(/@\s*([\d.]+)\s*(lb|kg)/i);
  if (weightMatch) {
    weight = parseFloat(weightMatch[1]);
    unit = weightMatch[2].toLowerCase() as "lb" | "kg";
  }

  let rpe: number | null = null;
  const rpeMatch = notes.match(/RPE\s*(\d+)(?:-\d+)?/i);
  if (rpeMatch) {
    rpe = parseInt(rpeMatch[1], 10);
  }

  let restSeconds: number | null = null;
  const restMatch = notes.match(/Rest\s+(\d+)\s*(min|sec|s)?/i);
  if (restMatch) {
    const restVal = parseInt(restMatch[1], 10);
    const restUnit = restMatch[2]?.toLowerCase();
    restSeconds = restUnit === "sec" || restUnit === "s" ? restVal : restVal * 60;
  }

  return { sets, reps, weight, unit, rpe, restSeconds };
}

function parseRestSeconds(notes: string | null): number | null {
  if (!notes) return null;
  const match = notes.match(/Rest\s+(\d+)\s*(min|sec|s|m)?/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "sec" || unit === "s") return val;
  return val * 60;
}

// Evidence-based rest periods by exercise type (Schoenfeld 2016, Galpin)
// Heavy compound: 180s (3 min) — strength preservation, BP-safe for CAD
// Moderate compound: 120s (2 min) — hypertrophy range
// Isolation: 90s — pump/volume work
// Core: 60s — endurance-focused
function getDefaultRestSeconds(exerciseName: string): number {
  const name = exerciseName.toLowerCase();

  // Core / abs: 60s
  if (
    /\b(plank|crunch|ab\s|abs|sit.?up|leg.?raise|russian.?twist|pallof|dead.?bug|bird.?dog|hollow|woodchop|ab.?wheel|anti.?rotation)\b/.test(name) ||
    name.includes("hanging leg raise")
  ) {
    return 60;
  }

  // Heavy compounds: 180s (3 min)
  if (
    /\b(bench press|back squat|front squat|deadlift|sumo deadlift|overhead press|military press|zercher squat|hack squat)\b/.test(name) ||
    /\b(close.?grip bench|incline bench press|decline bench press)\b/.test(name)
  ) {
    return 180;
  }

  // Isolation exercises: 90s
  if (
    /\b(curl|extension|raise|fly|flye|crossover|kickback|pushdown|pull.?over|shrug|calf|wrist|face.?pull|reverse fly|lateral|skull.?crush|tricep|bicep|concentration|preacher|hammer)\b/.test(name)
  ) {
    return 90;
  }

  // Moderate compounds (rows, lunges, presses, pulls): 120s
  return 120;
}

// Check if a set is a PR (personal record)
function isPR(
  exerciseId: string,
  reps: number | null,
  weight: number | null,
  prMap: PRMap
): boolean {
  if (!reps || !weight || weight <= 0) return false;
  const exercisePRs = prMap[exerciseId];
  if (!exercisePRs) return true; // No history = first time = PR
  const currentBest = exercisePRs.repMaxes[reps];
  if (!currentBest) return true; // No history at this rep count = PR
  return weight > currentBest.weight;
}

export default function SessionLogPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [exSearch, setExSearch] = useState("");
  const [localLogs, setLocalLogs] = useState<Record<string, SetLog[]>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<SessionExercise["exercise"] | null>(null);
  const [reorderMode, setReorderMode] = useState(false);

  // Timer state (lifted up so both RestTimer and FloatingTimer share one source of truth).
  // endAt is a wall-clock timestamp (ms since epoch) so the timer stays accurate even
  // when the browser backgrounds setInterval on mobile.
  const [activeTimer, setActiveTimer] = useState<{
    seId: string;
    endAt: number;
    pausedRemainingMs: number | null;
    totalSeconds: number;
    exerciseName: string;
  } | null>(null);
  const [, setTimerTick] = useState(0);
  const timerCompletedRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localLogsRef = useRef(localLogs);
  localLogsRef.current = localLogs;

  // Session timer state
  const [sessionTimerRunning, setSessionTimerRunning] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Summary dialog
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    duration: number;
    totalWeight: number;
    totalReps: number;
    totalSets: number;
    exerciseCount: number;
  } | null>(null);

  // PR data
  const [prMap, setPrMap] = useState<PRMap>({});

  // Move session date
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDate, setMoveDate] = useState("");

  // Swap exercise
  const [swapTargetSeId, setSwapTargetSeId] = useState<string | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<
    Array<{ id: string; name: string; category: string; score: number; reasons: string[] }>
  >([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapSubmitting, setSwapSubmitting] = useState(false);

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) {
      router.push("/app");
      return;
    }
    const data = await res.json();
    // Server returns exercises ordered by their stored `order` field. Respect
    // that directly so manual reorders persist.
    setSession(data);

    // Restore timer state if session was started but not ended
    if (data.startedAt && !data.endedAt) {
      const started = new Date(data.startedAt);
      setSessionStartedAt(started);
      setSessionTimerRunning(true);
      setSessionElapsed(Math.floor((Date.now() - started.getTime()) / 1000));
    } else if (data.startedAt && data.endedAt) {
      const started = new Date(data.startedAt);
      const ended = new Date(data.endedAt);
      setSessionStartedAt(started);
      setSessionElapsed(Math.floor((ended.getTime() - started.getTime()) / 1000));
    }

    const logs: Record<string, SetLog[]> = {};
    data.exercises.forEach((se: SessionExercise) => {
      const existing = (se.setLogs || []).map(
        (l: SetLog & { id?: string }) => ({
          sessionExerciseId: se.id,
          setIndex: l.setIndex,
          reps: l.reps,
          weight: l.weight,
          unit: (l.unit ?? "lb") as "lb" | "kg",
          durationSec: l.durationSec,
          distanceMeters: l.distanceMeters ?? null,
          avgHeartRate: l.avgHeartRate ?? null,
          rpe: l.rpe,
          completed: l.completed ?? true,
        })
      );
      if (existing.length > 0) {
        logs[se.id] = existing;
      } else {
        const rx = parsePrescription(se.notes);
        if (rx) {
          logs[se.id] = Array.from({ length: rx.sets }, (_, i) => ({
            sessionExerciseId: se.id,
            setIndex: i,
            reps: rx.reps,
            weight: rx.weight,
            unit: rx.unit,
            durationSec: null,
            distanceMeters: null,
            avgHeartRate: null,
            rpe: null,
            completed: false,
          }));
        } else {
          logs[se.id] = [
            {
              sessionExerciseId: se.id,
              setIndex: 0,
              reps: null,
              weight: null,
              unit: "lb" as const,
              durationSec: null,
              distanceMeters: null,
              avgHeartRate: null,
              rpe: null,
              completed: false,
            },
          ];
        }
      }
    });
    setLocalLogs(logs);
    setExpandedExercises(new Set(data.exercises.map((e: SessionExercise) => e.id)));

    // Fetch PRs for exercises in this session
    const exerciseIds = data.exercises.map((e: SessionExercise) => e.exerciseId);
    if (exerciseIds.length > 0) {
      fetch(`/api/exercises/prs?exerciseIds=${exerciseIds.join(",")}`)
        .then((r) => r.json())
        .then(setPrMap)
        .catch(() => {});
    }
  }, [id, router]);

  useEffect(() => {
    fetchSession();
    fetch("/api/exercises")
      .then((r) => r.json())
      .then(setExercises);
  }, [fetchSession]);

  // Session timer tick
  useEffect(() => {
    if (sessionTimerRunning && sessionStartedAt) {
      sessionTimerRef.current = setInterval(() => {
        setSessionElapsed(Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [sessionTimerRunning, sessionStartedAt]);

  async function startSession() {
    const now = new Date();
    setSessionStartedAt(now);
    setSessionTimerRunning(true);
    setSessionElapsed(0);
    // Persist to server
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startedAt: now.toISOString(), endedAt: null }),
    });
  }

  async function endSession() {
    const now = new Date();
    setSessionTimerRunning(false);
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    // Persist to server
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endedAt: now.toISOString() }),
    });

    // Compute summary
    const allLogs = Object.values(localLogsRef.current).flat();
    const completedLogs = allLogs.filter((l) => l.completed);
    let totalWeight = 0;
    let totalReps = 0;
    for (const log of completedLogs) {
      if (log.reps != null) totalReps += log.reps;
      if (log.reps != null && log.weight != null) {
        totalWeight += log.reps * log.weight;
      }
    }

    const duration = sessionStartedAt
      ? Math.floor((now.getTime() - sessionStartedAt.getTime()) / 1000)
      : sessionElapsed;

    setSummaryData({
      duration,
      totalWeight: Math.round(totalWeight),
      totalReps,
      totalSets: completedLogs.length,
      exerciseCount: session?.exercises.length ?? 0,
    });
    setSummaryOpen(true);
  }

  const scheduleAutosave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const logs = localLogsRef.current;
      const allLogs = Object.values(logs).flat();
      const res = await fetch(`/api/sessions/${id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: allLogs }),
      });
      if (res.ok) setSavedAt(new Date());
      saveTimeoutRef.current = null;
    }, 1500);
  }, [id]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Drive a re-render every 500ms while a timer is active. The actual remaining
  // time is computed from Date.now() vs activeTimer.endAt, so backgrounded tabs
  // (where setInterval is throttled to ~1/minute on iOS Safari) still render the
  // correct value the instant the user returns to the page.
  useEffect(() => {
    if (!activeTimer) return;
    const iv = setInterval(() => setTimerTick((t) => t + 1), 500);
    const onVis = () => setTimerTick((t) => t + 1);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [activeTimer]);

  // Compute current remaining time from the wall clock. Paused timers hold
  // their remaining ms in state until resumed.
  const timerRemainingSec = activeTimer
    ? activeTimer.pausedRemainingMs != null
      ? Math.max(0, Math.ceil(activeTimer.pausedRemainingMs / 1000))
      : Math.max(0, Math.ceil((activeTimer.endAt - Date.now()) / 1000))
    : 0;
  const timerIsPaused = !!activeTimer && activeTimer.pausedRemainingMs != null;

  // Fire completion side-effects exactly once per timer instance. Keyed by the
  // (seId + endAt) tuple so a new timer for the same exercise re-arms properly.
  useEffect(() => {
    if (!activeTimer) {
      timerCompletedRef.current = null;
      return;
    }
    const key = `${activeTimer.seId}:${activeTimer.endAt}`;
    if (!timerIsPaused && timerRemainingSec === 0 && timerCompletedRef.current !== key) {
      timerCompletedRef.current = key;
      playBeep();
      vibrate();
      setActiveTimer(null);
    }
  }, [activeTimer, timerIsPaused, timerRemainingSec]);

  function toggleTimerPause() {
    setActiveTimer((t) => {
      if (!t) return t;
      if (t.pausedRemainingMs != null) {
        // Resume: push endAt forward by the paused amount
        return { ...t, endAt: Date.now() + t.pausedRemainingMs, pausedRemainingMs: null };
      }
      // Pause: capture remaining ms
      return { ...t, pausedRemainingMs: Math.max(0, t.endAt - Date.now()) };
    });
  }

  function adjustTimer(deltaSeconds: number) {
    const deltaMs = deltaSeconds * 1000;
    setActiveTimer((t) => {
      if (!t) return t;
      if (t.pausedRemainingMs != null) {
        return { ...t, pausedRemainingMs: Math.max(0, t.pausedRemainingMs + deltaMs) };
      }
      return { ...t, endAt: Math.max(Date.now(), t.endAt + deltaMs) };
    });
  }

  async function deleteSession() {
    if (!confirm("Delete this workout and all logged sets?")) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/app");
  }

  async function addExercise(exerciseId: string) {
    if (!exerciseId || !session) return;
    const newEx = exercises.find((e) => e.id === exerciseId);
    const order = newEx
      ? getInsertionOrder(session.exercises, newEx.name)
      : session.exercises.length;
    const res = await fetch(`/api/sessions/${id}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, order }),
    });
    if (res.ok) {
      setExSearch("");
      setAddOpen(false);
      fetchSession();
    }
  }

  async function removeExercise(seId: string) {
    if (!confirm("Remove this exercise?")) return;
    await fetch(`/api/sessions/${id}/exercises/${seId}`, { method: "DELETE" });
    fetchSession();
  }

  async function openSwap(seId: string) {
    setSwapTargetSeId(seId);
    setSwapCandidates([]);
    setSwapLoading(true);
    try {
      const res = await fetch(`/api/sessions/${id}/exercises/${seId}/swap-candidates`);
      if (res.ok) {
        const data = await res.json();
        setSwapCandidates(data.candidates ?? []);
      }
    } finally {
      setSwapLoading(false);
    }
  }

  async function performSwap(newExerciseId: string) {
    if (!swapTargetSeId) return;
    setSwapSubmitting(true);
    const seId = swapTargetSeId;
    try {
      const res = await fetch(`/api/sessions/${id}/exercises/${seId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: newExerciseId }),
      });
      if (res.ok) {
        setLocalLogs((prev) => {
          const next = { ...prev };
          delete next[seId];
          return next;
        });
        setSwapTargetSeId(null);
        await fetchSession();
      }
    } finally {
      setSwapSubmitting(false);
    }
  }

  async function moveExercise(seId: string, direction: "up" | "down") {
    if (!session) return;
    const idx = session.exercises.findIndex((e) => e.id === seId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= session.exercises.length) return;

    const next = [...session.exercises];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    const reordered = next.map((e, i) => ({ ...e, order: i }));
    setSession({ ...session, exercises: reordered });

    await Promise.all([
      fetch(`/api/sessions/${id}/exercises/${reordered[idx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: idx }),
      }),
      fetch(`/api/sessions/${id}/exercises/${reordered[swapIdx].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapIdx }),
      }),
    ]);
  }

  function addSet(seId: string) {
    const logs = localLogs[seId] ?? [];
    setLocalLogs((prev) => ({
      ...prev,
      [seId]: [
        ...logs,
        {
          sessionExerciseId: seId,
          setIndex: logs.length,
          reps: null,
          weight: null,
          unit: "lb",
          durationSec: null,
          distanceMeters: null,
          avgHeartRate: null,
          rpe: null,
          completed: false,
        },
      ],
    }));
  }

  function removeSet(seId: string, setIndex: number) {
    setLocalLogs((prev) => {
      const logs = (prev[seId] ?? [])
        .filter((l) => l.setIndex !== setIndex)
        .map((l, i) => ({ ...l, setIndex: i }));
      return { ...prev, [seId]: logs };
    });
    scheduleAutosave();
  }

  function updateLog(seId: string, setIndex: number, field: keyof SetLog, value: unknown) {
    setLocalLogs((prev) => {
      const logs = [...(prev[seId] ?? [])];
      const idx = logs.findIndex((l) => l.setIndex === setIndex);
      if (idx >= 0) {
        logs[idx] = { ...logs[idx], [field]: value };
      }
      return { ...prev, [seId]: logs };
    });
  }

  function toggleComplete(seId: string, setIndex: number) {
    const logs = localLogs[seId] ?? [];
    const log = logs.find((l) => l.setIndex === setIndex);
    if (log) {
      const wasCompleted = log.completed;
      updateLog(seId, setIndex, "completed", !log.completed);
      scheduleAutosave();

      if (!wasCompleted) {
        const se = session?.exercises.find((e) => e.id === seId);
        if (se) {
          const restSec = parseRestSeconds(se.notes) ?? getDefaultRestSeconds(se.exercise.name);
          setActiveTimer({
            seId,
            endAt: Date.now() + restSec * 1000,
            pausedRemainingMs: null,
            totalSeconds: restSec,
            exerciseName: se.exercise.name,
          });
        }
      }
    }
  }

  async function saveLogs() {
    if (!session) return;
    setSaving(true);
    const allLogs = Object.values(localLogsRef.current).flat();
    const res = await fetch(`/api/sessions/${id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: allLogs }),
    });
    if (res.ok) {
      setSavedAt(new Date());
      fetchSession();
    }
    setSaving(false);
  }

  function toggleExpand(seId: string) {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(seId)) next.delete(seId);
      else next.add(seId);
      return next;
    });
  }

  async function handleMoveSession() {
    if (!moveDate || !session) return;
    const res = await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: moveDate }),
    });
    if (res.ok) {
      setMoveOpen(false);
      fetchSession();
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const usedIds = new Set(session.exercises.map((e) => e.exerciseId));
  const sessionEnded = !!session.endedAt;
  const sessionStarted = !!session.startedAt || sessionTimerRunning;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Session Timer Bar */}
      <div className="rounded-xl border border-border bg-surface p-3">
        {!sessionStarted && !sessionEnded ? (
          <button
            onClick={startSession}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Play className="h-4 w-4 fill-primary" />
            Start Session
          </button>
        ) : sessionTimerRunning ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-2xl font-bold text-text tabular-nums">
                {formatElapsed(sessionElapsed)}
              </span>
            </div>
            <button
              onClick={endSession}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 text-error text-sm font-bold hover:bg-error/20 transition-colors"
            >
              <Square className="h-3.5 w-3.5 fill-error" />
              End Session
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Session completed</span>
            </div>
            <span className="text-sm font-bold text-text tabular-nums">
              {formatElapsed(sessionElapsed)}
            </span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-high hover:text-text transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-text truncate">{session.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-text-secondary">
              {formatSessionDate(session.date)}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-sm text-primary font-medium capitalize">
              {session.category}
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={saveLogs} disabled={saving} size="sm">
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Exercise
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMoveDate(session.date.slice(0, 10));
            setMoveOpen(true);
          }}
        >
          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
          Move
        </Button>
        {session.exercises.length > 1 && (
          <Button
            variant={reorderMode ? "default" : "outline"}
            size="sm"
            onClick={() => setReorderMode((r) => !r)}
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            {reorderMode ? "Done" : "Reorder"}
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={deleteSession} className="ml-auto">
          <Trash2 className="h-4 w-4 text-error" />
        </Button>
        {savedAt && (
          <span className="text-[10px] text-success flex items-center gap-1">
            <Check className="h-3 w-3" /> {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Session Notes */}
      {session.notes && (
        <div className="rounded-xl bg-primary/5 border border-primary/15 px-3.5 py-3">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{session.notes}</p>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="space-y-3">
        {session.exercises.map((se, exIdx) => {
          const expanded = expandedExercises.has(se.id);
          const logs = localLogs[se.id] ?? [];
          const inputType = getExerciseInputType(se.exercise.name, se.exercise.category, logs);
          const completedCount = logs.filter((l) => l.completed).length;
          const exercisePR = prMap[se.exerciseId]?.bestSet;

          return (
            <div
              key={se.id}
              id={`exercise-${se.id}`}
              className="rounded-xl border border-border bg-surface overflow-hidden"
            >
              {/* Exercise header */}
              <button
                onClick={() => toggleExpand(se.id)}
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-surface-high transition-colors"
              >
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {exIdx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedExercise(se.exercise); }}
                      className="font-semibold text-base text-text truncate hover:text-primary transition-colors text-left"
                    >
                      {se.exercise.name}
                    </button>
                    {exercisePR && (
                      <span className="inline-flex items-center gap-1 shrink-0 text-[11px] text-primary/70 font-semibold bg-primary/8 px-1.5 py-0.5 rounded-md">
                        <Trophy className="h-3 w-3" />
                        {exercisePR.weight} {exercisePR.unit} x{exercisePR.reps}
                      </span>
                    )}
                  </div>
                  {se.notes && (
                    <p className="text-xs text-primary/80 font-medium mt-0.5 whitespace-pre-line leading-relaxed">{se.notes}</p>
                  )}
                  <p className="text-sm text-text-secondary mt-0.5">
                    {completedCount}/{logs.length} completed
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {reorderMode ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveExercise(se.id, "up");
                        }}
                        disabled={exIdx === 0}
                        className="p-2 rounded-md text-text-secondary hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary transition-colors"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveExercise(se.id, "down");
                        }}
                        disabled={exIdx === session.exercises.length - 1}
                        className="p-2 rounded-md text-text-secondary hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-secondary transition-colors"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSwap(se.id);
                        }}
                        className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        aria-label="Swap exercise"
                        title="Swap exercise"
                      >
                        <Repeat className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExercise(se.id);
                        }}
                        className="p-1.5 rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-muted" />
                      )}
                    </>
                  )}
                </div>
              </button>

              {/* Expanded: set logging */}
              {expanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-border">
                  {inputType === "strength" ? (
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-[1.2rem_1fr_1fr_2.5rem_1.5rem_1.5rem] gap-1.5 px-0.5">
                        <span className="text-xs font-bold uppercase text-text-muted">#</span>
                        <span className="text-xs font-bold uppercase text-text-muted">Reps</span>
                        <span className="text-xs font-bold uppercase text-text-muted">Weight</span>
                        <span className="text-xs font-bold uppercase text-text-muted">Unit</span>
                        <span />
                        <span />
                      </div>
                      {logs.map((log) => {
                        const isNewPR = log.completed && isPR(se.exerciseId, log.reps, log.weight, prMap);
                        return (
                          <div key={log.setIndex} className="relative">
                            <div className={`grid grid-cols-[1.2rem_1fr_1fr_2.5rem_1.5rem_1.5rem] gap-1.5 items-center ${isNewPR ? "bg-primary/5 rounded-lg -mx-1 px-1" : ""}`}>
                              <span className="text-xs font-bold text-text-muted text-center">{log.setIndex + 1}</span>
                              <Input type="number" placeholder="--" inputMode="numeric" value={log.reps ?? ""} className="h-10 text-sm px-2"
                                onChange={(e) => { updateLog(se.id, log.setIndex, "reps", e.target.value ? parseInt(e.target.value, 10) : null); scheduleAutosave(); }} />
                              <Input type="number" step="0.5" placeholder="--" inputMode="decimal" value={log.weight ?? ""} className="h-10 text-sm px-2"
                                onChange={(e) => { updateLog(se.id, log.setIndex, "weight", e.target.value ? parseFloat(e.target.value) : null); scheduleAutosave(); }} />
                              <Select value={log.unit} onValueChange={(v) => { updateLog(se.id, log.setIndex, "unit", v); scheduleAutosave(); }}>
                                <SelectTrigger className="h-10 px-1 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="lb">lb</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
                              </Select>
                              <button onClick={() => toggleComplete(se.id, log.setIndex)} className="flex items-center justify-center">
                                {log.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
                              </button>
                              <button onClick={() => removeSet(se.id, log.setIndex)} className="p-0.5 text-text-muted hover:text-error"><X className="h-3.5 w-3.5" /></button>
                            </div>
                            {isNewPR && (
                              <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">
                                <Trophy className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold">PR</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button onClick={() => addSet(se.id)} className="w-full py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Add Set
                      </button>
                    </div>
                  ) : inputType === "metric" ? (
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-[1fr_1.5rem] gap-2 px-0.5">
                        <span className="text-xs font-bold uppercase text-text-muted">{getMetricLabel(se.exercise.name)}</span>
                        <span />
                      </div>
                      {logs.map((log) => (
                        <div key={log.setIndex} className="grid grid-cols-[1fr_1.5rem] gap-2 items-center">
                          <Input type="number" step="0.1" placeholder="--" inputMode="decimal"
                            value={log.reps ?? ""} className="h-10 text-sm px-3"
                            onChange={(e) => { updateLog(se.id, log.setIndex, "reps", e.target.value ? parseFloat(e.target.value) : null); scheduleAutosave(); }} />
                          <button onClick={() => toggleComplete(se.id, log.setIndex)} className="flex items-center justify-center">
                            {log.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : inputType === "cardio" ? (
                    <div className="space-y-3 mt-3">
                      {logs.map((log) => {
                        const durationMin = log.durationSec != null ? Math.round(log.durationSec / 60 * 10) / 10 : null;
                        const distanceMi = log.distanceMeters != null ? Math.round(log.distanceMeters / 1609.344 * 100) / 100 : null;
                        const paceSecPerMi = (log.durationSec && log.distanceMeters && log.distanceMeters > 0)
                          ? Math.round(log.durationSec / (log.distanceMeters / 1609.344))
                          : null;
                        const paceStr = paceSecPerMi
                          ? `${Math.floor(paceSecPerMi / 60)}:${(paceSecPerMi % 60).toString().padStart(2, "0")} /mi`
                          : null;
                        const speedMph = (log.durationSec && log.distanceMeters && log.durationSec > 0)
                          ? Math.round((log.distanceMeters / 1609.344) / (log.durationSec / 3600) * 10) / 10
                          : null;

                        return (
                          <div key={log.setIndex} className="rounded-lg border border-border bg-surface/50 p-3 space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs font-bold uppercase text-text-muted mb-1 block">Duration (min)</label>
                                <Input type="number" step="0.1" placeholder="--" inputMode="decimal"
                                  value={durationMin ?? ""} className="h-10 text-sm px-3"
                                  onChange={(e) => {
                                    const min = e.target.value ? parseFloat(e.target.value) : null;
                                    updateLog(se.id, log.setIndex, "durationSec", min != null ? Math.round(min * 60) : null);
                                    scheduleAutosave();
                                  }} />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase text-text-muted mb-1 block">Distance (mi)</label>
                                <Input type="number" step="0.01" placeholder="--" inputMode="decimal"
                                  value={distanceMi ?? ""} className="h-10 text-sm px-3"
                                  onChange={(e) => {
                                    const mi = e.target.value ? parseFloat(e.target.value) : null;
                                    updateLog(se.id, log.setIndex, "distanceMeters", mi != null ? Math.round(mi * 1609.344) : null);
                                    scheduleAutosave();
                                  }} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs font-bold uppercase text-text-muted mb-1 block">Avg HR (bpm)</label>
                                <Input type="number" placeholder="--" inputMode="numeric"
                                  value={log.avgHeartRate ?? ""} className="h-10 text-sm px-3"
                                  onChange={(e) => {
                                    updateLog(se.id, log.setIndex, "avgHeartRate", e.target.value ? parseInt(e.target.value, 10) : null);
                                    scheduleAutosave();
                                  }} />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase text-text-muted mb-1 block">RPE (1-10)</label>
                                <Input type="number" min={1} max={10} placeholder="--" inputMode="numeric"
                                  value={log.rpe ?? ""} className="h-10 text-sm px-3"
                                  onChange={(e) => {
                                    updateLog(se.id, log.setIndex, "rpe", e.target.value ? parseInt(e.target.value, 10) : null);
                                    scheduleAutosave();
                                  }} />
                              </div>
                            </div>
                            {(paceStr || speedMph) && (
                              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                {paceStr && (
                                  <span className="text-sm font-semibold text-primary">
                                    Pace: {paceStr}
                                  </span>
                                )}
                                {speedMph && (
                                  <span className="text-sm text-text-secondary">
                                    {speedMph} mph
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-1">
                              <button onClick={() => toggleComplete(se.id, log.setIndex)} className="flex items-center gap-1.5 text-xs font-medium">
                                {log.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
                                <span className={log.completed ? "text-success" : "text-text-muted"}>{log.completed ? "Completed" : "Mark complete"}</span>
                              </button>
                              {log.avgHeartRate && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  log.avgHeartRate <= 140 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                }`}>
                                  {log.avgHeartRate <= 140 ? "Zone 2" : "Above Z2"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-[1.2rem_1fr_1.5rem] gap-2 px-0.5">
                        <span className="text-xs font-bold uppercase text-text-muted">#</span>
                        <span className="text-xs font-bold uppercase text-text-muted">Reps / Duration</span>
                        <span />
                      </div>
                      {logs.map((log) => (
                        <div key={log.setIndex} className="grid grid-cols-[1.2rem_1fr_1.5rem] gap-2 items-center">
                          <span className="text-xs font-bold text-text-muted text-center">{log.setIndex + 1}</span>
                          <Input type="number" placeholder="reps or sec" inputMode="numeric"
                            value={log.reps ?? log.durationSec ?? ""} className="h-10 text-sm px-3"
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value, 10) : null;
                              updateLog(se.id, log.setIndex, "reps", val);
                              scheduleAutosave();
                            }} />
                          <button onClick={() => toggleComplete(se.id, log.setIndex)} className="flex items-center justify-center">
                            {log.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addSet(se.id)} className="w-full py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Add Set
                      </button>
                    </div>
                  )}
                  {activeTimer?.seId === se.id && (
                    <RestTimer
                      remainingSeconds={timerRemainingSec}
                      totalSeconds={activeTimer.totalSeconds}
                      exerciseName={activeTimer.exerciseName}
                      isPaused={timerIsPaused}
                      onTogglePause={toggleTimerPause}
                      onAdjust={adjustTimer}
                      onDismiss={() => setActiveTimer(null)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {session.exercises.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-text-secondary text-sm">No exercises yet</p>
          <p className="text-text-muted text-xs mt-1">Add exercises to start logging</p>
        </div>
      )}

      {/* Add Exercise Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input placeholder="Search exercises..." value={exSearch} onChange={(e) => setExSearch(e.target.value)} className="pl-10" autoFocus />
          </div>
          <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2 space-y-0.5">
            {exercises
              .filter((e) => !usedIds.has(e.id))
              .filter((e) => exSearch ? e.name.toLowerCase().includes(exSearch.toLowerCase()) || e.category.toLowerCase().includes(exSearch.toLowerCase()) : true)
              .map((e) => (
                <button key={e.id} type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-primary/10 active:bg-primary/15 transition-colors min-h-[48px]" onClick={() => addExercise(e.id)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-text">{e.name}</span>
                    <span className="text-[10px] text-text-secondary capitalize">{e.category}</span>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              ))}
            {exercises.filter((e) => !usedIds.has(e.id)).filter((e) => exSearch ? e.name.toLowerCase().includes(exSearch.toLowerCase()) || e.category.toLowerCase().includes(exSearch.toLowerCase()) : true).length === 0 && (
              <p className="py-8 text-center text-text-secondary text-sm">No matching exercises</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Exercise Dialog */}
      <Dialog open={swapTargetSeId !== null} onOpenChange={(o) => { if (!o) setSwapTargetSeId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Swap Exercise
              {swapTargetSeId && (
                <span className="block text-xs font-normal text-text-secondary mt-1">
                  Replacing: {session.exercises.find((e) => e.id === swapTargetSeId)?.exercise.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto -mx-2 px-2 space-y-1">
            {swapLoading ? (
              <p className="py-8 text-center text-text-secondary text-sm">Finding alternatives...</p>
            ) : swapCandidates.length === 0 ? (
              <p className="py-8 text-center text-text-secondary text-sm">No matching alternatives found</p>
            ) : (
              swapCandidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={swapSubmitting}
                  onClick={() => performSwap(c.id)}
                  className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left hover:bg-primary/10 active:bg-primary/15 disabled:opacity-50 transition-colors min-h-[48px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-text truncate">{c.name}</div>
                    {c.reasons.length > 0 && (
                      <div className="text-[11px] text-text-secondary mt-0.5 capitalize">
                        {c.reasons.join(" · ")}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md tabular-nums">
                    {c.score}
                  </span>
                </button>
              ))
            )}
          </div>
          <p className="text-[11px] text-text-muted">
            Swapping will clear any set logs on this exercise.
          </p>
        </DialogContent>
      </Dialog>

      {/* Move Session Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">New Date</label>
              <Input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
            </div>
            <Button onClick={handleMoveSession} disabled={!moveDate} className="w-full">
              Move to {moveDate ? formatSessionDate(moveDate) : "..."}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Complete!</DialogTitle>
          </DialogHeader>
          {summaryData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-high p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{formatElapsed(summaryData.duration)}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Duration</p>
                </div>
                <div className="rounded-xl bg-surface-high p-4 text-center">
                  <p className="text-2xl font-bold text-text">{summaryData.exerciseCount}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Exercises</p>
                </div>
                <div className="rounded-xl bg-surface-high p-4 text-center">
                  <p className="text-2xl font-bold text-text">{summaryData.totalReps.toLocaleString()}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Total Reps</p>
                </div>
                <div className="rounded-xl bg-surface-high p-4 text-center">
                  <p className="text-2xl font-bold text-text">{formatWeight(summaryData.totalWeight)} lb</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Weight Lifted</p>
                </div>
              </div>
              <div className="rounded-xl bg-surface-high p-4 text-center">
                <p className="text-lg font-bold text-text">{summaryData.totalSets}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Completed Sets</p>
              </div>
              <Button onClick={() => setSummaryOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exercise Detail Dialog */}
      {selectedExercise && (
        <ExerciseDetailDialog
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
        />
      )}

      {/* Floating Rest Timer */}
      {activeTimer && timerRemainingSec > 0 && (
        <FloatingTimer
          seconds={timerRemainingSec}
          exerciseName={activeTimer.exerciseName}
          onTap={() => {
            setExpandedExercises((prev) => {
              const next = new Set(prev);
              next.add(activeTimer.seId);
              return next;
            });
            document.getElementById(`exercise-${activeTimer.seId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          onDismiss={() => setActiveTimer(null)}
        />
      )}
    </div>
  );
}
