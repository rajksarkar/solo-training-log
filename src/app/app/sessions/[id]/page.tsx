"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Check, Play, Trash2 } from "lucide-react";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";

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

export default function SessionLogPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedEx, setSelectedEx] = useState("");
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

  async function addExercise() {
    if (!selectedEx || !session) return;
    const order = session.exercises.length;
    const res = await fetch(`/api/sessions/${id}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: selectedEx, order }),
    });
    if (res.ok) {
      setOpen(false);
      setSelectedEx("");
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
    return <p className="text-on-surface-variant">Loading...</p>;
  }

  const usedIds = new Set(session.exercises.map((e) => e.exerciseId));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link href="/app/sessions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{session.title}</h1>
            <p className="text-on-surface-variant">
              {new Date(session.date).toLocaleDateString()} · {session.category}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="space-y-4">
            <Label>Exercise</Label>
            <Select value={selectedEx} onValueChange={setSelectedEx}>
              <SelectTrigger>
                <SelectValue placeholder="Choose exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises
                  .filter((e) => !usedIds.has(e.id))
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.category})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={addExercise} disabled={!selectedEx}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {session.exercises.map((se) => (
          <Card key={se.id}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExerciseDetail(se.exercise)}
                    className="text-primary hover:text-primary hover:underline break-words text-left flex items-center gap-1.5"
                  >
                    {se.exercise.name}
                    <Play className="h-3.5 w-3.5 shrink-0" />
                  </button>
                  <Link
                    href={`/app/progress/${se.exerciseId}`}
                    className="text-on-surface-variant hover:text-on-surface text-xs shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Progress →
                  </Link>
                </div>
                {isStrength(se.exercise.category) && lastPRs[se.exerciseId] && (
                  <span className="text-xs font-normal text-on-surface-variant shrink-0">
                    Last: {lastPRs[se.exerciseId].weight} {lastPRs[se.exerciseId].unit} × {lastPRs[se.exerciseId].reps}
                  </span>
                )}
              </CardTitle>
              {se.notes && (
                <p className="text-xs text-on-surface-variant mt-0.5">{se.notes}</p>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {isStrength(se.exercise.category) ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 text-sm font-medium text-on-surface-variant">
                    <div>Set</div>
                    <div>Reps</div>
                    <div className="hidden sm:block">Weight</div>
                    <div className="hidden sm:block">Unit</div>
                  </div>
                  {(localLogs[se.id] ?? []).map((log) => (
                    <div
                      key={`${log.setIndex}`}
                      className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="text-sm">{log.setIndex + 1}</div>
                      <Input
                        type="number"
                        placeholder="—"
                        inputMode="numeric"
                        className="h-12"
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
                        placeholder="—"
                        inputMode="decimal"
                        className="h-12"
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
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-on-surface-variant">
                    <div className="col-span-2">Duration (sec)</div>
                    <div className="col-span-2">RPE (1-10)</div>
                  </div>
                  {(localLogs[se.id] ?? []).map((log) => (
                    <div
                      key={`${log.setIndex}`}
                      className="grid grid-cols-12 gap-2 items-center"
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
                        className="col-span-4"
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
                        className="col-span-4"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm">
                  Log duration and RPE for this exercise type.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {session.exercises.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-on-surface-variant">
            No exercises. Add one to start logging.
          </CardContent>
        </Card>
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
