"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Check, Play, Trash2, Search } from "lucide-react";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
    instructions?: string;
    equipment?: unknown;
    muscles?: unknown;
    youtubeId?: string | null;
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

const CATEGORY_COLORS: Record<string, string> = {
  strength: "bg-primary-container text-on-primary-container",
  cardio: "bg-error-container text-on-error-container",
  zone2: "bg-accent-teal-soft text-on-primary-container",
  pilates: "bg-accent-rose-soft text-on-error-container",
  mobility: "bg-tertiary-container text-on-tertiary-container",
  plyometrics: "bg-accent-slate-soft text-on-primary-container",
  stretching: "bg-secondary-container text-on-secondary-container",
  other: "bg-surface-container-high text-on-surface-variant",
};

export default function SessionLogPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [exSearch, setExSearch] = useState("");
  const [localLogs, setLocalLogs] = useState<Record<string, SetLog[]>>({});
  const [lastPRs, setLastPRs] = useState<Record<string, { weight: number; reps: number; unit: string }>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [exerciseDetail, setExerciseDetail] = useState<SessionExercise["exercise"] | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localLogsRef = useRef(localLogs);
  localLogsRef.current = localLogs;

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) {
      router.push("/app/sessions");
      return;
    }
    const data = await res.json();
    setSession(data);
    const logs: Record<string, SetLog[]> = {};
    data.exercises.forEach((se: SessionExercise) => {
      const existing = (se.setLogs || []).map((l: SetLog & { id?: string }) => ({
        sessionExerciseId: se.id,
        setIndex: l.setIndex,
        reps: l.reps,
        weight: l.weight,
        unit: (l.unit ?? "lb") as "lb" | "kg",
        durationSec: l.durationSec,
        rpe: l.rpe,
        completed: l.completed ?? true,
      }));
      if (existing.length > 0) {
        logs[se.id] = existing;
      } else {
        logs[se.id] = [
          {
            sessionExerciseId: se.id,
            setIndex: 0,
            reps: null,
            weight: null,
            unit: "lb" as const,
            durationSec: null,
            rpe: null,
            completed: true,
          },
        ];
      }
    });
    setLocalLogs(logs);
  }, [id, router]);

  useEffect(() => {
    fetchSession();
    fetch("/api/exercises")
      .then((r) => r.json())
      .then(setExercises);
  }, [fetchSession]);

  useEffect(() => {
    if (!session?.exercises?.length) return;
    session.exercises.forEach((se) => {
      if (se.exercise.category === "strength") {
        fetch(`/api/progress/exercise/${se.exerciseId}/last`)
          .then((r) => r.json())
          .then((d) => {
            if (d.bestSet) {
              setLastPRs((prev) => ({
                ...prev,
                [se.exerciseId]: d.bestSet,
              }));
            }
          });
      }
    });
  }, [session?.id, session?.exercises?.length]);

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
      if (saveTimeoutRef.current) saveTimeoutRef.current = null;
    }, 1500);
  }, [id]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function isStrength(cat: string) {
    return cat === "strength" || cat === "plyometrics";
  }

  function isCardioLike(cat: string) {
    return ["cardio", "zone2", "pilates", "stretching"].includes(cat);
  }

  async function deleteSession() {
    if (!confirm("Delete this session and all logged sets?")) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/app/sessions");
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
      fetchSession();
    }
  }

  function addSet(seId: string) {
    const logs = localLogs[seId] ?? [];
    const nextIndex = logs.length;
    setLocalLogs((prev) => ({
      ...prev,
      [seId]: [
        ...logs,
        {
          sessionExerciseId: seId,
          setIndex: nextIndex,
          reps: null,
          weight: null,
          unit: "lb",
          durationSec: null,
          rpe: null,
          completed: true,
        },
      ],
    }));
  }

  function updateLog(
    seId: string,
    setIndex: number,
    field: keyof SetLog,
    value: unknown
  ) {
    setLocalLogs((prev) => {
      const logs = [...(prev[seId] ?? [])];
      const idx = logs.findIndex((l) => l.setIndex === setIndex);
      if (idx >= 0) {
        logs[idx] = { ...logs[idx], [field]: value };
      }
      return { ...prev, [seId]: logs };
    });
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
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error ?? "Error saving"));
    }
    setSaving(false);
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
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/app/sessions"
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-on-surface/[0.05] hover:text-on-surface transition-all duration-200 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-display italic text-on-surface">{session.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-on-surface-variant">
                {new Date(session.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-outline-variant">·</span>
              <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full capitalize ${CATEGORY_COLORS[session.category] ?? CATEGORY_COLORS.other}`}>
                {session.category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-13 sm:pl-0 sm:justify-end">
          {savedAt && (
            <span className="text-xs text-primary flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={saveLogs} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="ghost" size="icon" onClick={deleteSession}>
            <Trash2 className="h-4 w-4 text-error" />
          </Button>
        </div>
      </div>

      {/* Add exercise */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add exercise</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              placeholder="Search exercises..."
              value={exSearch}
              onChange={(e) => setExSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2 space-y-1">
            {exercises
              .filter((e) => !usedIds.has(e.id))
              .filter((e) =>
                exSearch
                  ? e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
                    e.category.toLowerCase().includes(exSearch.toLowerCase())
                  : true
              )
              .map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-primary/[0.08] active:bg-primary/[0.12] transition-colors min-h-[48px]"
                  onClick={() => addExercise(e.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-on-surface">{e.name}</span>
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full capitalize ${CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.other}`}>
                      {e.category}
                    </span>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              ))}
            {exercises.filter((e) => !usedIds.has(e.id)).filter((e) =>
              exSearch
                ? e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
                  e.category.toLowerCase().includes(exSearch.toLowerCase())
                : true
            ).length === 0 && (
              <p className="py-8 text-center text-on-surface-variant text-sm">No matching exercises</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise cards */}
      <div className="space-y-4">
        {session.exercises.map((se) => (
          <div
            key={se.id}
            className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevation-1"
          >
            {/* Exercise header */}
            <div className="p-4 pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setExerciseDetail(se.exercise)}
                    className="text-on-surface hover:text-primary font-semibold text-[15px] break-words text-left flex items-center gap-1.5 transition-colors duration-200"
                  >
                    {se.exercise.name}
                    <Play className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </button>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${CATEGORY_COLORS[se.exercise.category] ?? CATEGORY_COLORS.other}`}>
                    {se.exercise.category}
                  </span>
                  <Link
                    href={`/app/progress/${se.exerciseId}`}
                    className="text-primary/70 hover:text-primary text-[11px] font-medium shrink-0 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Progress &rarr;
                  </Link>
                </div>
                {isStrength(se.exercise.category) && lastPRs[se.exerciseId] && (
                  <span className="text-xs font-normal text-on-surface-variant shrink-0">
                    Last: {lastPRs[se.exerciseId].weight} {lastPRs[se.exerciseId].unit} &times; {lastPRs[se.exerciseId].reps}
                  </span>
                )}
              </div>
              {se.notes && (
                <p className="text-xs text-on-surface-variant mt-1">{se.notes}</p>
              )}
            </div>

            {/* Set logging area */}
            <div className="px-4 pb-4 pt-0">
              {isStrength(se.exercise.category) ? (
                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-[2rem_1fr_1fr_4rem] sm:grid-cols-[2.5rem_1fr_1fr_5rem] gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Set</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Reps</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Weight</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Unit</span>
                  </div>
                  {/* Set rows */}
                  {(localLogs[se.id] ?? []).map((log) => (
                    <div
                      key={`${log.setIndex}`}
                      className="grid grid-cols-[2rem_1fr_1fr_4rem] sm:grid-cols-[2.5rem_1fr_1fr_5rem] gap-2 items-center"
                    >
                      <span className="text-sm font-medium text-on-surface-variant text-center">{log.setIndex + 1}</span>
                      <Input
                        type="number"
                        placeholder="--"
                        inputMode="numeric"
                        value={log.reps ?? ""}
                        onChange={(e) => {
                          updateLog(
                            se.id,
                            log.setIndex,
                            "reps",
                            e.target.value ? parseInt(e.target.value, 10) : null
                          );
                          scheduleAutosave();
                        }}
                      />
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="--"
                        inputMode="decimal"
                        value={log.weight ?? ""}
                        onChange={(e) => {
                          updateLog(
                            se.id,
                            log.setIndex,
                            "weight",
                            e.target.value ? parseFloat(e.target.value) : null
                          );
                          scheduleAutosave();
                        }}
                      />
                      <Select
                        value={log.unit}
                        onValueChange={(v) => {
                          updateLog(se.id, log.setIndex, "unit", v as "lb" | "kg");
                          scheduleAutosave();
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSet(se.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add set
                  </Button>
                </div>
              ) : isCardioLike(se.exercise.category) ? (
                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-2 gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Duration (sec)</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">RPE (1-10)</span>
                  </div>
                  {/* Input rows */}
                  {(localLogs[se.id] ?? []).map((log) => (
                    <div
                      key={`${log.setIndex}`}
                      className="grid grid-cols-2 gap-3 items-center"
                    >
                      <Input
                        type="number"
                        placeholder="Duration (sec)"
                        value={log.durationSec ?? ""}
                        onChange={(e) => {
                          updateLog(
                            se.id,
                            log.setIndex,
                            "durationSec",
                            e.target.value ? parseInt(e.target.value, 10) : null
                          );
                          scheduleAutosave();
                        }}
                      />
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        placeholder="RPE"
                        value={log.rpe ?? ""}
                        onChange={(e) => {
                          updateLog(
                            se.id,
                            log.setIndex,
                            "rpe",
                            e.target.value ? parseInt(e.target.value, 10) : null
                          );
                          scheduleAutosave();
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm">
                  Log duration and RPE for this exercise type.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {session.exercises.length === 0 && (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevation-1 py-12 text-center">
          <p className="text-on-surface-variant">No exercises. Add one to start logging.</p>
        </div>
      )}

      {exerciseDetail && (
        <ExerciseDetailDialog
          exercise={exerciseDetail}
          open={!!exerciseDetail}
          onOpenChange={(open) => !open && setExerciseDetail(null)}
        />
      )}
    </div>
  );
}
