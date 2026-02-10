"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, TrendingUp, Trophy } from "lucide-react";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
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

type DataPoint = {
  date: string;
  sessionId: string;
  bestSet: { reps: number; weight: number; unit: string } | null;
  volume: number;
  durationSec: number | null;
  rpe: number | null;
};

type ProgressData = {
  exercise: {
    id: string;
    name: string;
    category: string;
    instructions?: string;
    equipment?: unknown;
    muscles?: unknown;
    youtubeId?: string | null;
  };
  dataPoints: DataPoint[];
  recentPRs: DataPoint[];
};

export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.exerciseId as string;
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetch(`/api/progress/exercise/${exerciseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          router.push("/app/exercises");
          return;
        }
        setData(d);
      })
      .finally(() => setLoading(false));
  }, [exerciseId, router]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        {loading ? (
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <p className="text-on-surface-variant">Exercise not found</p>
        )}
      </div>
    );
  }

  const chartData = data.dataPoints
    .filter((d) => d.bestSet != null || d.volume > 0 || d.durationSec != null)
    .map((d) => ({
      date: d.date,
      weight: d.bestSet?.weight ?? 0,
      volume: d.volume,
      duration: (d.durationSec ?? 0) / 60,
    }));

  const isStrength = data.exercise.category === "strength" || data.exercise.category === "plyometrics";
  const isCardioLike = ["cardio", "zone2", "pilates", "stretching"].includes(
    data.exercise.category
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/app/exercises"
          className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-on-surface/[0.05] hover:text-on-surface transition-all duration-200 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <button
            type="button"
            onClick={() => setShowDetail(true)}
            className="text-2xl font-display italic text-on-surface hover:text-primary flex items-center gap-2 transition-colors duration-200"
          >
            {data.exercise.name}
            <Play className="h-5 w-5 opacity-50" />
          </button>
          <p className="text-sm text-on-surface-variant capitalize">{data.exercise.category}</p>
        </div>
      </div>

      {showDetail && (
        <ExerciseDetailDialog
          exercise={data.exercise}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevation-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-on-surface">Progress</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isStrength
                ? "Best set weight & volume over time"
                : isCardioLike
                  ? "Duration (minutes) over time"
                  : "Activity over time"}
            </p>
          </div>
          <div className="p-5">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--md-outline-variant)" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "var(--md-on-surface-variant)" }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    axisLine={{ stroke: "var(--md-outline-variant)", strokeOpacity: 0.4 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--md-on-surface-variant)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, ""]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                    contentStyle={{
                      background: "var(--md-surface-container-lowest)",
                      border: "1px solid var(--md-outline-variant)",
                      borderRadius: "12px",
                      fontSize: "13px",
                      boxShadow: "var(--md-elevation-2)",
                    }}
                  />
                  {isStrength && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--md-primary)"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "var(--md-primary)" }}
                        activeDot={{ r: 6, fill: "var(--md-primary)" }}
                        name="Best weight"
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="var(--md-tertiary)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--md-tertiary)" }}
                        activeDot={{ r: 5, fill: "var(--md-tertiary)" }}
                        name="Volume"
                        strokeDasharray="4 2"
                      />
                    </>
                  )}
                  {isCardioLike && (
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="var(--md-primary)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "var(--md-primary)" }}
                      activeDot={{ r: 6, fill: "var(--md-primary)" }}
                      name="Duration (min)"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent PRs */}
      {data.recentPRs.length > 0 && isStrength && (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevation-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-tertiary" />
              <h2 className="font-semibold text-on-surface">Recent PRs</h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">Heaviest sets (best effort)</p>
          </div>
          <ul>
            {data.recentPRs.map((d, i) => (
              <li
                key={d.sessionId + d.date}
                className={`flex justify-between items-center py-3.5 px-5 hover:bg-primary/[0.04] transition-colors ${
                  i < data.recentPRs.length - 1 ? "border-b border-outline-variant/15" : ""
                }`}
              >
                <Link
                  href={`/app/sessions/${d.sessionId}`}
                  className="text-sm text-on-surface hover:text-primary transition-colors"
                >
                  {new Date(d.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Link>
                {d.bestSet && (
                  <span className="font-medium text-on-surface text-sm">
                    {d.bestSet.weight} {d.bestSet.unit} x {d.bestSet.reps} reps
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {chartData.length === 0 && data.recentPRs.length === 0 && (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevation-1 py-12 text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-on-surface-variant/30 mb-3" />
          <p className="text-on-surface-variant">No logged data yet.</p>
          <p className="text-sm text-on-surface-variant/60 mt-1">Complete sessions with this exercise to see progress.</p>
        </div>
      )}
    </div>
  );
}
