"use client";

import { useEffect, useState, useCallback } from "react";
import { Scale, TrendingDown, TrendingUp, Target, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type BodyWeightEntry = {
  id: string;
  date: string;
  weight: number;
  unit: string;
  notes: string | null;
};

type Stats = {
  current: { weight: number; date: string } | null;
  sevenDayAvg: number | null;
  thirtyDayAvg: number | null;
  weeklyChange: number | null;
};

const GOAL_WEIGHT = 180;

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateLong(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BodyWeightPage() {
  const [entries, setEntries] = useState<BodyWeightEntry[]>([]);
  const [stats, setStats] = useState<Stats>({
    current: null,
    sevenDayAvg: null,
    thirtyDayAvg: null,
    weeklyChange: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [date, setDate] = useState(todayString());
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/body-weight?days=90");
      const data = await res.json();
      setEntries(data.entries ?? []);
      setStats(data.stats ?? {});
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pre-fill form when date changes and there's an existing entry
  useEffect(() => {
    const existing = entries.find((e) => e.date.slice(0, 10) === date);
    if (existing) {
      setWeight(String(existing.weight));
      setNotes(existing.notes ?? "");
    } else {
      setWeight("");
      setNotes("");
    }
  }, [date, entries]);

  const existingEntry = entries.find((e) => e.date.slice(0, 10) === date);

  // Yesterday's weight for placeholder
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const yesterdayEntry = entries.find((e) => e.date.slice(0, 10) === yesterdayStr);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    try {
      await fetch("/api/body-weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          weight: parseFloat(weight),
          unit: "lb",
          notes: notes.trim() || undefined,
        }),
      });
      await fetchData();
      // Reset form only if not editing an existing entry
      if (!existingEntry) {
        setWeight("");
        setNotes("");
      }
    } catch {
      // ignore
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/body-weight/${id}`, { method: "DELETE" });
      await fetchData();
    } catch {
      // ignore
    }
  }

  // Chart data: sorted oldest first with 7-day moving average
  const chartEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const chartData = chartEntries.map((entry, i) => {
    // 7-day moving average
    const windowStart = Math.max(0, i - 6);
    const window = chartEntries.slice(windowStart, i + 1);
    const avg =
      Math.round((window.reduce((s, e) => s + e.weight, 0) / window.length) * 10) / 10;
    return {
      date: entry.date,
      weight: entry.weight,
      avg,
    };
  });

  const toGoal =
    stats.current != null
      ? Math.round((stats.current.weight - GOAL_WEIGHT) * 10) / 10
      : null;

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text">Body Weight</h1>
        <p className="text-xs text-text-secondary mt-0.5">Track your daily weigh-ins</p>
      </div>

      {/* Quick Entry Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-4 space-y-3"
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">
            Weight
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={
                yesterdayEntry ? String(yesterdayEntry.weight) : "185.0"
              }
              className="h-14 text-2xl font-bold text-center tracking-wide"
            />
            <span className="text-text-muted text-sm font-medium shrink-0 w-8">
              lb
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary mb-1 block">
            Notes <span className="text-text-muted">(optional)</span>
          </label>
          <Input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. after morning coffee"
            className="h-10 text-sm"
          />
        </div>

        <Button type="submit" className="w-full" disabled={!weight || saving}>
          {saving
            ? "Saving..."
            : existingEntry
              ? "Update Weight"
              : "Log Weight"}
        </Button>
      </form>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Current */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Scale className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">Current</span>
              </div>
              {stats.current ? (
                <>
                  <p className="text-lg font-bold text-text">
                    {stats.current.weight}
                    <span className="text-xs text-text-muted ml-1">lb</span>
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {formatDate(stats.current.date)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-muted">No data</p>
              )}
            </div>

            {/* 7-Day Avg */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">7-Day Avg</span>
              </div>
              {stats.sevenDayAvg != null ? (
                <p className="text-lg font-bold text-text">
                  {stats.sevenDayAvg}
                  <span className="text-xs text-text-muted ml-1">lb</span>
                </p>
              ) : (
                <p className="text-sm text-text-muted">No data</p>
              )}
            </div>

            {/* Rate */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 mb-1">
                {stats.weeklyChange != null && stats.weeklyChange < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-red-400" />
                )}
                <span className="text-xs font-medium text-text-secondary">Rate</span>
              </div>
              {stats.weeklyChange != null ? (
                <p
                  className={`text-lg font-bold ${
                    stats.weeklyChange < 0 ? "text-green-500" : stats.weeklyChange > 0 ? "text-red-400" : "text-text"
                  }`}
                >
                  {stats.weeklyChange > 0 ? "+" : ""}
                  {stats.weeklyChange}
                  <span className="text-xs text-text-muted ml-1">lb/wk</span>
                </p>
              ) : (
                <p className="text-sm text-text-muted">Need 2 weeks</p>
              )}
            </div>

            {/* Goal */}
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-text-secondary">Goal</span>
              </div>
              {toGoal != null ? (
                <p className="text-lg font-bold text-text">
                  {toGoal > 0 ? toGoal : 0}
                  <span className="text-xs text-text-muted ml-1">lb to go</span>
                </p>
              ) : (
                <p className="text-sm text-text-muted">
                  {GOAL_WEIGHT} lb target
                </p>
              )}
              <p className="text-[10px] text-text-muted">Target: {GOAL_WEIGHT} lb</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <h2 className="font-bold text-base text-text">Trend</h2>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Daily weight &amp; 7-day moving average
                </p>
              </div>
              <div className="p-4">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#2C2C30"
                        strokeOpacity={0.6}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#8E8E93" }}
                        tickFormatter={(v) => formatDate(v)}
                        axisLine={{ stroke: "#2C2C30" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#8E8E93" }}
                        axisLine={false}
                        tickLine={false}
                        domain={["dataMin - 2", "dataMax + 2"]}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value} lb`,
                          name === "weight" ? "Weight" : "7-Day Avg",
                        ]}
                        labelFormatter={(label) => formatDate(label)}
                        contentStyle={{
                          background: "#141418",
                          border: "1px solid #2A2A32",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                          color: "#F5F5F7",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#E8B630"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#E8B630" }}
                        activeDot={{ r: 5, fill: "#E8B630" }}
                        name="weight"
                      />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="#6B6B76"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="5 5"
                        name="avg"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface py-12 text-center">
              <Scale className="h-10 w-10 mx-auto text-text-muted/40 mb-3" />
              <p className="text-text-secondary">No data yet</p>
              <p className="text-xs text-text-muted mt-1">
                Log your first weigh-in above to see your trend.
              </p>
            </div>
          )}

          {/* Recent Entries */}
          {entries.length > 0 && (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h2 className="font-bold text-sm text-text">Recent Entries</h2>
              </div>
              <ul>
                {entries.slice(0, 30).map((entry, i) => (
                  <li
                    key={entry.id}
                    className={`flex items-center justify-between py-3 px-4 hover:bg-surface-high transition-colors ${
                      i < Math.min(entries.length, 30) - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm text-text-secondary">
                          {formatDateLong(entry.date)}
                        </span>
                        <span className="font-bold text-sm text-text">
                          {entry.weight} lb
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="ml-2 p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-surface-high transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
