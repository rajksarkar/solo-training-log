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

type SetLog = {
  id?: string;
  sessionExerciseId: string;
  setIndex: number;
  reps: number | null;
  weight: number | null;
  unit: "lb" | "kg";
  durationSec: number | null;
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
  };
  setLogs: SetLog[];
};

type Session = {
  id: string;
  title: string;
  category: string;
  date: string;
  exercises: SessionExercise[];
};

type Exercise = { id: string; name: string; category: string };

// Parse UTC date string without timezone shift
function formatSessionDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d); // local date, not UTC
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Determine the best input layout for an exercise based on its name and actual data
function getExerciseInputType(
  exerciseName: string,
  _category: string,
  logs: SetLog[]
): "strength" | "cardio" | "metric" | "bodyweight" {
  const name = exerciseName.toLowerCase();

  // Metric exercises: HR, speed, watts — show single value input
  if (
    name.includes("heart rate") ||
    name.includes("average speed") ||
    name.includes("watt") ||
    name.includes("rower audit")
  ) {
    return "metric";
  }

  // Duration-based cardio: run, bike, rowing
  if (
    name === "run" ||
    name === "walk" ||
    name.includes("stationary bike") ||
    name.includes("rowing") ||
    name.includes("cardio")
  ) {
    return "cardio";
  }

  // Check if any set has weight data — if so, it's strength
  const hasWeight = logs.some((l) => l.weight != null && l.weight > 0);
  if (hasWeight) return "strength";

  // Check if sets have duration data
  const hasDuration = logs.some((l) => l.durationSec != null && l.durationSec > 0);
  if (hasDuration) return "cardio";

  // Bodyweight exercises: planks, pushups, etc. (reps only, or just completed)
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

// Get the label for metric exercises
function getMetricLabel(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("heart rate")) return "Heart Rate (bpm)";
  if (n.includes("speed")) return "Speed (mph)";
  if (n.includes("watt") || n.includes("power")) return "Watts";
  if (n.includes("rower audit")) return "Meters";
  return "Value";
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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localLogsRef = useRef(localLogs);
  localLogsRef.current = localLogs;

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) {
      router.push("/app");
      return;
    }
    const data = await res.json();
    setSession(data);

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
          rpe: l.rpe,
          completed: l.completed ?? true,
        })
      );
      logs[se.id] =
        existing.length > 0
          ? existing
          : [
              {
                sessionExerciseId: se.id,
                setIndex: 0,
                reps: null,
                weight: null,
                unit: "lb",
                durationSec: null,
                rpe: null,
                completed: false,
              },
            ];
    });
    setLocalLogs(logs);
    setExpandedExercises(new Set(data.exercises.map((e: SessionExercise) => e.id)));
  }, [id, router]);

  useEffect(() => {
    fetchSession();
    fetch("/api/exercises")
      .then((r) => r.json())
      .then(setExercises);
  }, [fetchSession]);

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

  async function deleteSession() {
    if (!confirm("Delete this workout and all logged sets?")) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/app");
  }

  async function addExercise(exerciseId: string) {
    if (!exerciseId || !session) return;
    const order = session.exercises.length;
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
      updateLog(seId, setIndex, "completed", !log.completed);
      scheduleAutosave();
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

  if (!session) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const usedIds = new Set(session.exercises.map((e) => e.exerciseId));

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/app"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-high hover:text-text transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-text truncate">{session.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-secondary">
              {formatSessionDate(session.date)}
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-xs text-primary font-medium capitalize">
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
        <Button variant="ghost" size="icon" onClick={deleteSession} className="ml-auto">
          <Trash2 className="h-4 w-4 text-error" />
        </Button>
        {savedAt && (
          <span className="text-[10px] text-success flex items-center gap-1">
            <Check className="h-3 w-3" /> {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-3">
        {session.exercises.map((se, exIdx) => {
          const expanded = expandedExercises.has(se.id);
          const logs = localLogs[se.id] ?? [];
          const inputType = getExerciseInputType(se.exercise.name, se.exercise.category, logs);
          const completedCount = logs.filter((l) => l.completed).length;

          return (
            <div
              key={se.id}
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
                  <p className="font-semibold text-sm text-text truncate">
                    {se.exercise.name}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    {completedCount}/{logs.length} completed
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
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
                </div>
              </button>

              {/* Expanded: set logging */}
              {expanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-border">
                  {inputType === "strength" ? (
                    /* STRENGTH: Reps / Weight / Unit / Complete */
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-[1.2rem_1fr_1fr_2.5rem_1.5rem_1.5rem] gap-1.5 px-0.5">
                        <span className="text-[9px] font-bold uppercase text-text-muted">#</span>
                        <span className="text-[9px] font-bold uppercase text-text-muted">Reps</span>
                        <span className="text-[9px] font-bold uppercase text-text-muted">Weight</span>
                        <span className="text-[9px] font-bold uppercase text-text-muted">Unit</span>
                        <span />
                        <span />
                      </div>
                      {logs.map((log) => (
                        <div key={log.setIndex} className="grid grid-cols-[1.2rem_1fr_1fr_2.5rem_1.5rem_1.5rem] gap-1.5 items-center">
                          <span className="text-xs font-bold text-text-muted text-center">{log.setIndex + 1}</span>
                          <Input type="number" placeholder="--" inputMode="numeric" value={log.reps ?? ""} className="h-10 text-sm px-2"
                            onChange={(e) => { updateLog(se.id, log.setIndex, "reps", e.target.value ? parseInt(e.target.value, 10) : null); scheduleAutosave(); }} />
                          <Input type="number" step="0.5" placeholder="--" inputMode="decimal" value={log.weight ?? ""} className="h-10 text-sm px-2"
                            onChange={(e) => { updateLog(se.id, log.setIndex, "weight", e.target.value ? parseFloat(e.target.value) : null); scheduleAutosave(); }} />
                          <Select value={log.unit} onValueChange={(v) => { updateLog(se.id, log.setIndex, "unit", v); scheduleAutosave(); }}>
                            <SelectTrigger className="h-10 px-1 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="lb">lb</SelectItem><SelectItem value="kg">kg</SelectItem></SelectContent>
                          </Select>
                          <button onClick={() => toggleComplete(se.id, log.setIndex)} className="flex items-center justify-center">
                            {log.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
                          </button>
                          <button onClick={() => removeSet(se.id, log.setIndex)} className="p-0.5 text-text-muted hover:text-error"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                      <button onClick={() => addSet(se.id)} className="w-full py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Add Set
                      </button>
                    </div>
                  ) : inputType === "metric" ? (
                    /* METRIC: single value input (HR, speed, watts) */
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-[1fr_1.5rem] gap-2 px-0.5">
                        <span className="text-[9px] font-bold uppercase text-text-muted">{getMetricLabel(se.exercise.name)}</span>
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
                    /* CARDIO: Duration / RPE / Complete */
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-[1fr_1fr_1.5rem] gap-2">
                        <span className="text-[9px] font-bold uppercase text-text-muted">Duration (sec)</span>
                        <span className="text-[9px] font-bold uppercase text-text-muted">RPE (1-10)</span>
                        <span />
                      </div>
                      {logs.map((log) => (
                        <div key={log.setIndex} className="grid grid-cols-[1fr_1fr_1.5rem] gap-2 items-center">
                          <Input type="number" placeholder="Duration" value={log.durationSec ?? ""} className="h-10 text-sm px-3"
                            onChange={(e) => { updateLog(se.id, log.setIndex, "durationSec", e.target.value ? parseInt(e.target.value, 10) : null); scheduleAutosave(); }} />
                          <Input type="number" min={1} max={10} placeholder="RPE" value={log.rpe ?? ""} className="h-10 text-sm px-3"
                            onChange={(e) => { updateLog(se.id, log.setIndex, "rpe", e.target.value ? parseInt(e.target.value, 10) : null); scheduleAutosave(); }} />
                          <button onClick={() => toggleComplete(se.id, log.setIndex)} className="flex items-center justify-center">
                            {log.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-text-muted" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* BODYWEIGHT: Reps (optional) + Complete circle */
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-[1.2rem_1fr_1.5rem] gap-2 px-0.5">
                        <span className="text-[9px] font-bold uppercase text-text-muted">#</span>
                        <span className="text-[9px] font-bold uppercase text-text-muted">Reps / Duration</span>
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
    </div>
  );
}
