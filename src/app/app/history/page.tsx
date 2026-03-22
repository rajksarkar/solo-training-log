"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  ChevronRight,
  Calendar,
  Search,
  Trophy,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Session = {
  id: string;
  title: string;
  category: string;
  date: string;
  exercises: { id: string }[];
};

type ExerciseRanking = {
  exerciseId: string;
  name: string;
  category: string;
  sessionCount: number;
  pr: { weight: number; reps: number; unit: string } | null;
};

type TrendPoint = {
  date: string;
  totalReps: number;
  totalWeight: number;
  sessionCount: number;
  sessionTimeSec: number;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rankings, setRankings] = useState<ExerciseRanking[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [tab, setTab] = useState<"sessions" | "exercises" | "trends">("exercises");
  const [showAllRankings, setShowAllRankings] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sessions");
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      } catch {
        setSessions([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/stats/history");
        if (res.ok) {
          const data = await res.json();
          setRankings(data.exerciseRankings ?? []);
          setTrends(data.trends ?? []);
        }
      } catch {
        // ignore
      }
      setHistoryLoading(false);
    }
    loadHistory();
  }, []);

  const filtered = sessions.filter((s) =>
    search
      ? s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const grouped = filtered.reduce<Record<string, Session[]>>((acc, s) => {
    const key = s.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped).sort().reverse();

  function formatMonth(key: string) {
    const [y, m] = key.split("-");
    const d = new Date(Number(y), Number(m) - 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  // Chart data formatting
  const chartData = trends.map((t) => ({
    ...t,
    label: new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weightK: Math.round(t.totalWeight / 1000),
    timeMin: Math.round(t.sessionTimeSec / 60),
  }));

  const displayedRankings = showAllRankings ? rankings : rankings.slice(0, 20);

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-text">History</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {sessions.length} total workouts
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface-high rounded-lg p-1">
        {(["exercises", "trends", "sessions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${
              tab === t
                ? "bg-primary text-on-primary"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {t === "exercises" ? "Top Exercises" : t === "trends" ? "Trends" : "Sessions"}
          </button>
        ))}
      </div>

      {tab === "exercises" ? (
        /* Exercise Rankings */
        historyLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="py-16 text-center">
            <Dumbbell className="h-10 w-10 mx-auto text-text-muted/40 mb-3" />
            <p className="text-text-secondary">No exercise history yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {displayedRankings.map((ex, i) => (
              <Link key={ex.exerciseId} href={`/app/progress/${ex.exerciseId}`}>
                <div className="group flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border hover:border-primary/30 hover:bg-surface-high transition-all duration-200">
                  <span className="w-7 h-7 rounded-lg bg-surface-high text-text-muted text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base text-text truncate group-hover:text-primary transition-colors">
                      {ex.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-text-secondary">
                        {ex.sessionCount} session{ex.sessionCount !== 1 ? "s" : ""}
                      </span>
                      {ex.pr && (
                        <>
                          <span className="text-text-muted">·</span>
                          <span className="text-sm text-primary font-medium flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {ex.pr.weight} {ex.pr.unit} x{ex.pr.reps}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))}
            {!showAllRankings && rankings.length > 20 && (
              <button
                onClick={() => setShowAllRankings(true)}
                className="w-full py-3 text-sm font-medium text-primary hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <ChevronDown className="h-4 w-4" />
                Show all {rankings.length} exercises
              </button>
            )}
          </div>
        )
      ) : tab === "trends" ? (
        /* 30-Day Trend Charts */
        historyLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reps Trend */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-text">Total Reps (30 days)</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8b8b95" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#8b8b95" }} width={40} />
                    <Tooltip
                      contentStyle={{ background: "#1C1C22", border: "1px solid #2a2a30", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#F5F5F7" }}
                    />
                    <Line type="monotone" dataKey="totalReps" stroke="#E8B630" strokeWidth={2} dot={false} name="Reps" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weight Trend */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-text">Total Weight (30 days)</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8b8b95" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#8b8b95" }} width={40} tickFormatter={(v) => `${v}k`} />
                    <Tooltip
                      contentStyle={{ background: "#1C1C22", border: "1px solid #2a2a30", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#F5F5F7" }}
                      formatter={(value: number) => [`${(value * 1000).toLocaleString()} lb`, "Weight"]}
                    />
                    <Line type="monotone" dataKey="weightK" stroke="#E8B630" strokeWidth={2} dot={false} name="Weight (k lb)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Session Time Trend */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-text">Session Time (30 days)</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8b8b95" }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: "#8b8b95" }} width={40} tickFormatter={(v) => `${v}m`} />
                    <Tooltip
                      contentStyle={{ background: "#1C1C22", border: "1px solid #2a2a30", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#F5F5F7" }}
                      formatter={(value: number) => [`${value} min`, "Duration"]}
                    />
                    <Line type="monotone" dataKey="timeMin" stroke="#E8B630" strokeWidth={2} dot={false} name="Minutes" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-text-muted mt-2 text-center">
                Session time tracking starts when you use the Start/End Session timer
              </p>
            </div>
          </div>
        )
      ) : (
        /* Sessions List */
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search workouts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="h-10 w-10 mx-auto text-text-muted/40 mb-3" />
              <p className="text-text-secondary">
                {search ? "No matching workouts" : "No workout history yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedMonths.map((month) => (
                <div key={month}>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 px-1">
                    {formatMonth(month)}
                  </h2>
                  <div className="space-y-1.5">
                    {grouped[month].map((s) => (
                      <Link key={s.id} href={`/app/sessions/${s.id}`}>
                        <div className="group flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border hover:border-primary/30 hover:bg-surface-high transition-all duration-200">
                          <div className="w-9 h-9 rounded-lg bg-surface-high flex items-center justify-center shrink-0">
                            <Dumbbell className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base text-text truncate group-hover:text-primary transition-colors">
                              {s.title}
                            </p>
                            <p className="text-sm text-text-secondary mt-0.5">
                              {(() => {
                                const [y, m, d] = s.date.slice(0, 10).split("-").map(Number);
                                return new Date(y, m - 1, d).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                });
                              })()}
                              <span className="mx-1.5 text-text-muted">·</span>
                              <span className="capitalize">{s.category}</span>
                              {s.exercises?.length > 0 && (
                                <>
                                  <span className="mx-1.5 text-text-muted">·</span>
                                  {s.exercises.length} exercises
                                </>
                              )}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
