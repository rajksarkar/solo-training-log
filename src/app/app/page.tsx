"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  CheckCircle2,
  Calendar,
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
import { CATEGORIES } from "@/lib/constants";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";

type SetLog = {
  reps: number | null;
  weight: number | null;
  unit: string;
  durationSec: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  completed: boolean;
  notes: string | null;
};

type SessionExercise = {
  id: string;
  exerciseId: string;
  exercise: { id: string; name: string; category: string; instructions?: string; equipment?: unknown; muscles?: unknown; youtubeId?: string | null };
  setLogs: SetLog[];
};

type Session = {
  id: string;
  title: string;
  category: string;
  date: string;
  exercises: SessionExercise[];
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  // Use local date to avoid UTC timezone shift (toISOString would shift by timezone)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${monday.toLocaleDateString("en-US", opts)} - ${sunday.toLocaleDateString("en-US", opts)}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${m}:00`;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles >= 0.1 ? `${miles.toFixed(1)} mi` : `${meters} m`;
}

/** Summarize logged data for a single exercise across its sets. */
function summarizeExercise(ex: SessionExercise): string {
  const logs = ex.setLogs?.filter((l) => l.completed) ?? [];
  if (logs.length === 0) {
    const total = ex.setLogs?.length ?? 0;
    return total > 0 ? `${total} sets (not logged)` : "no sets";
  }

  const name = ex.exercise.name.toLowerCase();
  const category = ex.exercise.category;

  // Special: metric exercises (HR, speed, watts, distance)
  if (name.includes("heart rate") || name.includes("average hr")) {
    const val = logs[0]?.reps;
    return val != null ? `${val} bpm` : "—";
  }
  if (name.includes("average speed") || name.includes("speed")) {
    const val = logs[0]?.reps;
    return val != null ? `${val} mph` : "—";
  }
  if (name.includes("watt") || name.includes("power")) {
    const val = logs[0]?.reps;
    return val != null ? `${val}W` : "—";
  }
  if (name.includes("rower audit") || name.includes("rowing")) {
    const dur = logs[0]?.durationSec;
    return dur != null ? `${dur}m` : "—";
  }
  if (name === "run" || name === "walk") {
    const dur = logs[0]?.durationSec;
    const dist = logs[0]?.reps; // miles stored as reps
    if (dur && dist) return `${formatDuration(dur)} / ${dist} mi`;
    if (dur) return formatDuration(dur);
    if (dist) return `${dist} mi`;
    return "—";
  }
  if (name.includes("stationary bike") || name.includes("bike")) {
    const dur = logs[0]?.durationSec;
    return dur != null ? formatDuration(dur) : "—";
  }

  // Strength-style: has reps and/or weight
  const hasWeight = logs.some((l) => l.weight != null && l.weight > 0);
  const hasReps = logs.some((l) => l.reps != null && l.reps > 0);
  const hasDuration = logs.some((l) => l.durationSec != null && l.durationSec > 0);
  const hasDistance = logs.some((l) => l.distanceMeters != null && l.distanceMeters > 0);

  // Strength: "3x10 @ 135 lb" or "3x10" or "3 sets @ 135 lb"
  if ((category === "strength" || category === "plyometrics") && (hasReps || hasWeight)) {
    const sets = logs.length;
    // Check if all sets have same reps/weight for compact display
    const repsValues = [...new Set(logs.map((l) => l.reps).filter(Boolean))];
    const weightValues = [...new Set(logs.map((l) => l.weight).filter(Boolean))];
    const unit = logs[0]?.unit ?? "lb";

    let summary = "";
    if (repsValues.length === 1 && hasReps) {
      summary = `${sets}x${repsValues[0]}`;
    } else if (hasReps) {
      const repsList = logs.map((l) => l.reps ?? 0).join("/");
      summary = repsList;
    } else {
      summary = `${sets} sets`;
    }

    if (weightValues.length === 1 && hasWeight) {
      summary += ` @ ${weightValues[0]} ${unit}`;
    } else if (hasWeight) {
      const maxW = Math.max(...logs.map((l) => l.weight ?? 0));
      summary += ` up to ${maxW} ${unit}`;
    }
    return summary;
  }

  // Cardio / zone2 / running: duration + distance
  if (hasDuration && hasDistance) {
    const totalDur = logs.reduce((a, l) => a + (l.durationSec ?? 0), 0);
    const totalDist = logs.reduce((a, l) => a + (l.distanceMeters ?? 0), 0);
    return `${formatDuration(totalDur)} / ${formatDistance(totalDist)}`;
  }

  if (hasDuration) {
    const totalDur = logs.reduce((a, l) => a + (l.durationSec ?? 0), 0);
    return formatDuration(totalDur);
  }

  if (hasDistance) {
    const totalDist = logs.reduce((a, l) => a + (l.distanceMeters ?? 0), 0);
    return formatDistance(totalDist);
  }

  // Reps-only (bodyweight, pilates, mobility, stretching)
  if (hasReps) {
    const sets = logs.length;
    const repsValues = [...new Set(logs.map((l) => l.reps).filter(Boolean))];
    if (repsValues.length === 1) {
      return `${sets}x${repsValues[0]}`;
    }
    return logs.map((l) => l.reps ?? 0).join("/") + " reps";
  }

  // Check for data in notes (e.g., "HR: 136", "Speed: 4.1")
  const notesWithData = logs.filter((l) => l.notes && l.notes.trim());
  if (notesWithData.length > 0) {
    return notesWithData[0].notes!.trim();
  }

  // RPE only
  const hasRpe = logs.some((l) => l.rpe != null);
  if (hasRpe) {
    const avgRpe = logs.reduce((a, l) => a + (l.rpe ?? 0), 0) / logs.length;
    return `RPE ${avgRpe.toFixed(0)}`;
  }

  return `${logs.length} sets`;
}

export default function WeeklyTrainingPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [monday, setMonday] = useState(() => getMonday(today));
  const [selectedDate, setSelectedDate] = useState(() => formatDate(today));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<SessionExercise["exercise"] | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "strength",
    date: formatDate(today),
  });

  const weekDates = getWeekDates(monday);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const from = formatDate(monday);
    const sun = new Date(monday);
    sun.setDate(monday.getDate() + 6);
    const to = formatDate(sun);
    try {
      const res = await fetch(`/api/sessions?from=${from}&to=${to}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    }
    setLoading(false);
  }, [monday]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function prevWeek() {
    const prev = new Date(monday);
    prev.setDate(monday.getDate() - 7);
    setMonday(prev);
    // Select same day-of-week in new week
    const offset = weekDates.findIndex((d) => formatDate(d) === selectedDate);
    const newDate = new Date(prev);
    newDate.setDate(prev.getDate() + (offset >= 0 ? offset : 0));
    setSelectedDate(formatDate(newDate));
  }

  function nextWeek() {
    const next = new Date(monday);
    next.setDate(monday.getDate() + 7);
    setMonday(next);
    const offset = weekDates.findIndex((d) => formatDate(d) === selectedDate);
    const newDate = new Date(next);
    newDate.setDate(next.getDate() + (offset >= 0 ? offset : 0));
    setSelectedDate(formatDate(newDate));
  }

  function goToToday() {
    const todayMon = getMonday(new Date());
    setMonday(todayMon);
    setSelectedDate(formatDate(new Date()));
  }

  // Sessions for the selected day
  const daySessions = sessions.filter(
    (s) => s.date.slice(0, 10) === selectedDate
  );

  // Map of date → session status: "logged" (has set data) or "scheduled" (no data yet)
  const sessionDateStatus = new Map<string, "logged" | "scheduled">();
  for (const s of sessions) {
    const dateKey = s.date.slice(0, 10);
    const hasLoggedData = s.exercises?.some(
      (ex) => ex.setLogs?.some((l) => l.reps != null || l.weight != null || l.durationSec != null)
    );
    const current = sessionDateStatus.get(dateKey);
    if (hasLoggedData || current !== "logged") {
      sessionDateStatus.set(dateKey, hasLoggedData ? "logged" : (current ?? "scheduled"));
    }
  }

  const isToday = formatDate(today) === selectedDate;
  const isCurrentWeek =
    formatDate(getMonday(today)) === formatDate(monday);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const s = await res.json();
      setNewOpen(false);
      setForm({ title: "", category: "strength", date: selectedDate });
      window.location.href = `/app/sessions/${s.id}`;
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevWeek}
          className="p-2 rounded-lg hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={goToToday}
          className="text-center"
        >
          <p className="text-sm font-bold text-text tracking-wide">
            {formatWeekRange(monday)}
          </p>
          {!isCurrentWeek && (
            <p className="text-[10px] text-primary font-medium mt-0.5">
              Tap to go to today
            </p>
          )}
        </button>

        <button
          onClick={nextWeek}
          className="p-2 rounded-lg hover:bg-surface-high text-text-secondary hover:text-text transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day Strip */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date);
          const isSelected = dateStr === selectedDate;
          const isTodayDate = dateStr === formatDate(today);
          const status = sessionDateStatus.get(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center py-2.5 rounded-xl transition-all duration-200 ${
                isSelected
                  ? "bg-primary text-on-primary"
                  : isTodayDate
                    ? "bg-surface-high text-primary"
                    : "text-text-secondary hover:bg-surface-high"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                isSelected ? "text-on-primary/70" : ""
              }`}>
                {DAY_NAMES[i]}
              </span>
              <span className={`text-lg font-bold mt-0.5 ${
                isSelected ? "" : isTodayDate ? "text-primary" : ""
              }`}>
                {date.getDate()}
              </span>
              {/* Dot: bright yellow = logged data, gray = scheduled but no data */}
              <div className={`w-1.5 h-1.5 rounded-full mt-1 transition-colors ${
                status === "logged"
                  ? isSelected ? "bg-on-primary" : "bg-primary"
                  : status === "scheduled"
                    ? isSelected ? "bg-on-primary/40" : "bg-text-muted"
                    : "bg-transparent"
              }`} />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Day Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : daySessions.length > 0 ? (
        <div className="space-y-3">
          {daySessions.map((s) => {
            const exerciseCount = s.exercises?.length ?? 0;
            const completedSets = s.exercises?.reduce(
              (acc, ex) => acc + (ex.setLogs?.filter((l) => l.completed).length ?? 0),
              0
            ) ?? 0;
            const totalSets = s.exercises?.reduce(
              (acc, ex) => acc + (ex.setLogs?.length ?? 0),
              0
            ) ?? 0;
            const isComplete = totalSets > 0 && completedSets === totalSets;

            return (
              <Link key={s.id} href={`/app/sessions/${s.id}`}>
                <div className="group p-4 rounded-xl bg-surface border border-border hover:border-primary/30 hover:bg-surface-high transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isComplete && (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                        )}
                        <h3 className="font-bold text-text truncate group-hover:text-primary transition-colors">
                          {s.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="capitalize">{s.category}</span>
                        {exerciseCount > 0 && (
                          <>
                            <span className="text-text-muted">|</span>
                            <span>{exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}</span>
                          </>
                        )}
                        {totalSets > 0 && (
                          <>
                            <span className="text-text-muted">|</span>
                            <span>{completedSets}/{totalSets} sets</span>
                          </>
                        )}
                      </div>
                      {/* Exercise preview */}
                      {s.exercises && s.exercises.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {s.exercises.slice(0, 4).map((ex) => {
                            const summary = summarizeExercise(ex);
                            return (
                              <div
                                key={ex.id}
                                className="flex items-center justify-between text-xs gap-2"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedExercise(ex.exercise);
                                  }}
                                  className="text-text-secondary truncate text-left hover:text-primary active:text-primary-bright transition-colors underline decoration-text-muted/30 underline-offset-2"
                                >
                                  {ex.exercise.name}
                                </button>
                                <span className="text-text-muted shrink-0 tabular-nums">
                                  {summary}
                                </span>
                              </div>
                            );
                          })}
                          {s.exercises.length > 4 && (
                            <p className="text-[10px] text-text-muted">
                              +{s.exercises.length - 4} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Dumbbell className="h-5 w-5 text-text-muted group-hover:text-primary shrink-0 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Add another session button */}
          <button
            onClick={() => {
              setForm((f) => ({ ...f, date: selectedDate }));
              setNewOpen(true);
            }}
            className="w-full p-3 rounded-xl border border-dashed border-border text-text-muted text-sm font-medium hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Workout
          </button>
        </div>
      ) : (
        /* Empty state for selected day */
        <div className="py-12 text-center">
          <Calendar className="h-10 w-10 mx-auto text-text-muted/40 mb-3" />
          <p className="text-text-secondary font-medium">
            {isToday ? "No workout today" : "Rest day"}
          </p>
          <p className="text-xs text-text-muted mt-1 mb-4">
            {isToday
              ? "Start a new session or take a rest day"
              : "No workout was scheduled for this day"}
          </p>
          <Button
            onClick={() => {
              setForm((f) => ({ ...f, date: selectedDate }));
              setNewOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workout
          </Button>
        </div>
      )}

      {/* Create Session Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Workout</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Day 1 - Push"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="capitalize">{c}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Create & Start Logging
            </Button>
          </form>
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
    </div>
  );
}
