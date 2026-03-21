"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dumbbell, ChevronRight, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Session = {
  id: string;
  title: string;
  category: string;
  date: string;
  exercises: { id: string }[];
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = sessions.filter((s) =>
    search
      ? s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
      : true
  );

  // Group by month (use date string directly to avoid UTC timezone shift)
  const grouped = filtered.reduce<Record<string, Session[]>>((acc, s) => {
    const key = s.date.slice(0, 7); // "2026-03" from "2026-03-18T00:00:00.000Z"
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

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold text-text">History</h1>
        <p className="text-xs text-text-secondary mt-0.5">All your past workouts</p>
      </div>

      {/* Search */}
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
                        <p className="font-semibold text-sm text-text truncate group-hover:text-primary transition-colors">
                          {s.title}
                        </p>
                        <p className="text-[11px] text-text-secondary mt-0.5">
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
    </div>
  );
}
