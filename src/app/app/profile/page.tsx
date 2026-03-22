"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Calendar,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Activity,
  Weight,
  Repeat,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoutButton } from "@/components/logout-button";

type BodyCompEntry = {
  id: string;
  date: string;
  scanType: string;
  weight: number;
  bodyFatPct: number;
  fatMass: number | null;
  leanMass: number | null;
  visceralFat: number | null;
  notes: string | null;
};

type BodyWeightStats = {
  current: { weight: number; date: string } | null;
  sevenDayAvg: number | null;
};

type LifetimeStats = {
  totalSessions: number;
  totalReps: number;
  totalWeight: number;
  totalSessionTimeSec: number;
  sessionsWithTime: number;
  lastWorkout: {
    id: string;
    title: string;
    category: string;
    date: string;
    exerciseCount: number;
    exercises: string[];
    totalReps: number;
    totalWeight: number;
    startedAt: string | null;
    endedAt: string | null;
  } | null;
};

const GOAL_WEIGHT = 180;
const GOAL_BF_PCT = 18;

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatWeight(w: number): string {
  if (w >= 1000000) return `${(w / 1000000).toFixed(1)}M`;
  if (w >= 1000) return `${(w / 1000).toFixed(w >= 10000 ? 0 : 1)}k`;
  return w.toLocaleString();
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ProfilePage() {
  const [bodyComp, setBodyComp] = useState<BodyCompEntry[]>([]);
  const [weightStats, setWeightStats] = useState<BodyWeightStats | null>(null);
  const [lifetimeStats, setLifetimeStats] = useState<LifetimeStats | null>(null);
  const [weekSessions, setWeekSessions] = useState(0);
  const [trainingDays, setTrainingDays] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [formWeight, setFormWeight] = useState("");
  const [formBfPct, setFormBfPct] = useState("");
  const [formFatMass, setFormFatMass] = useState("");
  const [formLeanMass, setFormLeanMass] = useState("");
  const [formVisceralFat, setFormVisceralFat] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchBodyComp = useCallback(async () => {
    const res = await fetch("/api/body-composition");
    if (res.ok) {
      const data = await res.json();
      setBodyComp(data);
    }
  }, []);

  const fetchWeightStats = useCallback(async () => {
    const res = await fetch("/api/body-weight?days=7");
    if (res.ok) {
      const data = await res.json();
      setWeightStats(data.stats);
    }
  }, []);

  const fetchLifetimeStats = useCallback(async () => {
    const res = await fetch("/api/stats/lifetime");
    if (res.ok) {
      const data = await res.json();
      setLifetimeStats(data);
    }
  }, []);

  const fetchSessionStats = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const sessions: { id: string; date: string }[] = await res.json();
      const uniqueDates = new Set(
        sessions.map((s) => s.date.slice(0, 10))
      );
      setTrainingDays(uniqueDates.size);

      const monday = getMonday(new Date());
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const thisWeek = sessions.filter((s) => {
        const d = new Date(s.date);
        return d >= monday && d <= sunday;
      });
      setWeekSessions(thisWeek.length);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchBodyComp(),
      fetchWeightStats(),
      fetchSessionStats(),
      fetchLifetimeStats(),
    ]).then(() => setLoading(false));
  }, [fetchBodyComp, fetchWeightStats, fetchSessionStats, fetchLifetimeStats]);

  function resetForm() {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormWeight("");
    setFormBfPct("");
    setFormFatMass("");
    setFormLeanMass("");
    setFormVisceralFat("");
    setFormNotes("");
  }

  async function handleAddScan() {
    if (!formWeight || !formBfPct) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      date: formDate,
      scanType: "dexa",
      weight: parseFloat(formWeight),
      bodyFatPct: parseFloat(formBfPct),
    };
    if (formFatMass) payload.fatMass = parseFloat(formFatMass);
    if (formLeanMass) payload.leanMass = parseFloat(formLeanMass);
    if (formVisceralFat) payload.visceralFat = parseFloat(formVisceralFat);
    if (formNotes.trim()) payload.notes = formNotes.trim();

    const res = await fetch("/api/body-composition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchBodyComp();
      setAddOpen(false);
      resetForm();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this scan entry?")) return;
    const res = await fetch(`/api/body-composition/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchBodyComp();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const latestDexa = bodyComp.length > 0 ? bodyComp[0] : null;
  const currentWeight = weightStats?.current?.weight ?? latestDexa?.weight ?? null;

  const startWeight = bodyComp.length > 0 ? bodyComp[bodyComp.length - 1].weight : currentWeight;
  const weightProgress =
    startWeight && currentWeight && startWeight > GOAL_WEIGHT
      ? Math.min(
          100,
          Math.round(
            ((startWeight - currentWeight) / (startWeight - GOAL_WEIGHT)) * 100
          )
        )
      : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Profile header */}
      <div className="text-center py-6">
        <img
          src="/profile.jpg"
          alt="Raj Sarkar"
          className="w-20 h-20 rounded-2xl border border-primary/20 mx-auto mb-4 object-cover"
        />
        <h1 className="text-xl font-bold text-text">Raj Sarkar</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          raj.sarkar@gmail.com
        </p>
      </div>

      {/* Last Workout Card */}
      {lifetimeStats?.lastWorkout && (
        <Link href={`/app/sessions/${lifetimeStats.lastWorkout.id}`}>
          <div className="rounded-xl border border-border bg-surface p-4 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Last Workout</h2>
            </div>
            <p className="font-bold text-lg text-text">{lifetimeStats.lastWorkout.title}</p>
            <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
              <span>{formatDate(lifetimeStats.lastWorkout.date)}</span>
              <span className="text-text-muted">·</span>
              <span className="capitalize">{lifetimeStats.lastWorkout.category}</span>
              <span className="text-text-muted">·</span>
              <span>{lifetimeStats.lastWorkout.exerciseCount} exercises</span>
            </div>
            {lifetimeStats.lastWorkout.exercises.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {lifetimeStats.lastWorkout.exercises.map((name) => (
                  <span key={name} className="text-xs px-2 py-0.5 rounded-md bg-surface-high text-text-secondary">
                    {name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm">
              {lifetimeStats.lastWorkout.totalReps > 0 && (
                <span className="text-primary font-medium">{lifetimeStats.lastWorkout.totalReps} reps</span>
              )}
              {lifetimeStats.lastWorkout.totalWeight > 0 && (
                <span className="text-primary font-medium">{formatWeight(lifetimeStats.lastWorkout.totalWeight)} lb</span>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Lifetime Stats */}
      {lifetimeStats && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Lifetime Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface-high p-3 text-center">
              <Repeat className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold text-text">{lifetimeStats.totalReps.toLocaleString()}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Total Reps</p>
            </div>
            <div className="rounded-xl bg-surface-high p-3 text-center">
              <Weight className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold text-text">{formatWeight(lifetimeStats.totalWeight)} lb</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Weight Lifted</p>
            </div>
            <div className="rounded-xl bg-surface-high p-3 text-center">
              <Timer className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold text-text">
                {lifetimeStats.totalSessionTimeSec > 0
                  ? formatDuration(lifetimeStats.totalSessionTimeSec)
                  : "--"}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                Session Time{lifetimeStats.sessionsWithTime > 0 ? ` (${lifetimeStats.sessionsWithTime})` : ""}
              </p>
            </div>
            <div className="rounded-xl bg-surface-high p-3 text-center">
              <Calendar className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-bold text-text">{lifetimeStats.totalSessions}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Workouts</p>
            </div>
          </div>
        </div>
      )}

      {/* Body Composition Card */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-text">Body Composition</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              Current Weight
            </p>
            <p className="text-2xl font-bold text-primary">
              {currentWeight ? `${currentWeight} lbs` : "--"}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">
              Body Fat %
            </p>
            <p className="text-2xl font-bold text-primary">
              {latestDexa ? `${latestDexa.bodyFatPct}%` : "--"}
            </p>
            {latestDexa && (
              <p className="text-[10px] text-text-muted">
                DEXA {formatShortDate(latestDexa.date)}
              </p>
            )}
          </div>
        </div>

        {/* Weight Goal Progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-text-secondary">
              Weight Goal: {GOAL_WEIGHT} lbs
            </p>
            <p className="text-xs text-text-muted">
              {currentWeight
                ? currentWeight <= GOAL_WEIGHT
                  ? "Goal reached!"
                  : `${(currentWeight - GOAL_WEIGHT).toFixed(1)} lbs to go`
                : ""}
            </p>
          </div>
          <div className="h-2 rounded-full bg-surface-high overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, weightProgress))}%` }}
            />
          </div>
        </div>

        {/* BF% Goal */}
        {latestDexa && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-text-secondary">
                BF% Goal: {GOAL_BF_PCT}%
              </p>
              <p className="text-xs text-text-muted">
                {latestDexa.bodyFatPct <= GOAL_BF_PCT
                  ? "Goal reached!"
                  : `${(latestDexa.bodyFatPct - GOAL_BF_PCT).toFixed(1)}% to go`}
              </p>
            </div>
            <div className="h-2 rounded-full bg-surface-high overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      bodyComp.length > 0
                        ? Math.round(
                            ((bodyComp[bodyComp.length - 1].bodyFatPct -
                              latestDexa.bodyFatPct) /
                              (bodyComp[bodyComp.length - 1].bodyFatPct -
                                GOAL_BF_PCT)) *
                              100
                          )
                        : 0
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* DEXA History */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-text">DEXA History</h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Scan
          </Button>
        </div>

        {bodyComp.length === 0 ? (
          <p className="text-sm text-text-secondary py-4 text-center">
            No scans recorded yet
          </p>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 text-xs font-bold uppercase text-text-muted">Date</th>
                  <th className="text-right py-2 px-2 text-xs font-bold uppercase text-text-muted">Weight</th>
                  <th className="text-right py-2 px-2 text-xs font-bold uppercase text-text-muted">BF%</th>
                  <th className="text-right py-2 px-2 text-xs font-bold uppercase text-text-muted hidden sm:table-cell">Fat</th>
                  <th className="text-right py-2 px-2 text-xs font-bold uppercase text-text-muted hidden sm:table-cell">Lean</th>
                  <th className="text-right py-2 px-2 text-xs font-bold uppercase text-text-muted hidden sm:table-cell">Visc.</th>
                  <th className="py-2 pl-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {bodyComp.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-3 text-text font-medium">{formatDate(entry.date)}</td>
                    <td className="py-2.5 px-2 text-right text-primary font-semibold">{entry.weight}</td>
                    <td className="py-2.5 px-2 text-right text-primary font-semibold">{entry.bodyFatPct}%</td>
                    <td className="py-2.5 px-2 text-right text-text-secondary hidden sm:table-cell">{entry.fatMass != null ? `${entry.fatMass}` : "--"}</td>
                    <td className="py-2.5 px-2 text-right text-text-secondary hidden sm:table-cell">{entry.leanMass != null ? `${entry.leanMass}` : "--"}</td>
                    <td className="py-2.5 px-2 text-right text-text-secondary hidden sm:table-cell">{entry.visceralFat != null ? `${entry.visceralFat}` : "--"}</td>
                    <td className="py-2.5 pl-2">
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-md text-text-muted hover:text-error hover:bg-error/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface border border-border p-4 text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-text">{weekSessions}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">This Week</p>
        </div>
        <div className="rounded-xl bg-surface border border-border p-4 text-center">
          <Dumbbell className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-text">{trainingDays}</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Training Days</p>
        </div>
      </div>

      {/* Logout */}
      <div className="space-y-2">
        <LogoutButton className="w-full justify-center py-3 border border-border rounded-xl" />
      </div>

      {/* Add Scan Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add DEXA Scan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">Date</label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">Weight (lbs)</label>
                <Input type="number" step="0.1" inputMode="decimal" placeholder="190.0" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">Body Fat %</label>
                <Input type="number" step="0.1" inputMode="decimal" placeholder="21.8" value={formBfPct} onChange={(e) => setFormBfPct(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">Fat Mass (lbs)</label>
                <Input type="number" step="0.1" inputMode="decimal" placeholder="41.0" value={formFatMass} onChange={(e) => setFormFatMass(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">Lean Mass (lbs)</label>
                <Input type="number" step="0.1" inputMode="decimal" placeholder="141.0" value={formLeanMass} onChange={(e) => setFormLeanMass(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">Visceral Fat</label>
              <Input type="number" step="0.01" inputMode="decimal" placeholder="1.32" value={formVisceralFat} onChange={(e) => setFormVisceralFat(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-text-muted block mb-1.5">Notes</label>
              <Input placeholder="Optional notes..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </div>
            <Button onClick={handleAddScan} disabled={submitting || !formWeight || !formBfPct} className="w-full">
              {submitting ? "Saving..." : "Save Scan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
