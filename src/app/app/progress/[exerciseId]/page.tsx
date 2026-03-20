"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Trophy } from "lucide-react";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
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
          <p className="text-text-secondary">Exercise not found</p>
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
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/app/exercises"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-high hover:text-text transition-all shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <button
            type="button"
            onClick={() => setShowDetail(true)}
            className="text-lg font-bold text-text hover:text-primary transition-colors"
          >
            {data.exercise.name}
          </button>
          <p className="text-xs text-primary font-medium capitalize">{data.exercise.category}</p>
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
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm text-text">Progress</h2>
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">
              {isStrength
                ? "Best set weight & volume over time"
                : isCardioLike
                  ? "Duration (minutes) over time"
                  : "Activity over time"}
            </p>
          </div>
          <div className="p-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#8E8E93" }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    axisLine={{ stroke: "#2C2C30" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#8E8E93" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, ""]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                    contentStyle={{
                      background: "#1C1C22",
                      border: "1px solid #2C2C30",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#F5F5F7",
                    }}
                  />
                  {isStrength && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#E8B630"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#E8B630" }}
                        activeDot={{ r: 5, fill: "#E8B630" }}
                        name="Best weight"
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#8E8E93"
                        strokeWidth={1.5}
                        dot={{ r: 2, fill: "#8E8E93" }}
                        activeDot={{ r: 4, fill: "#8E8E93" }}
                        name="Volume"
                        strokeDasharray="4 2"
                      />
                    </>
                  )}
                  {isCardioLike && (
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="#E8B630"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#E8B630" }}
                      activeDot={{ r: 5, fill: "#E8B630" }}
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
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm text-text">Recent PRs</h2>
            </div>
          </div>
          <ul>
            {data.recentPRs.map((d, i) => (
              <li
                key={d.sessionId + d.date}
                className={`flex justify-between items-center py-3 px-4 hover:bg-surface-high transition-colors ${
                  i < data.recentPRs.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <Link
                  href={`/app/sessions/${d.sessionId}`}
                  className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                  {new Date(d.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Link>
                {d.bestSet && (
                  <span className="font-bold text-sm text-text">
                    {d.bestSet.weight} {d.bestSet.unit} x {d.bestSet.reps}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {chartData.length === 0 && data.recentPRs.length === 0 && (
        <div className="rounded-xl border border-border bg-surface py-12 text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-text-muted/40 mb-3" />
          <p className="text-text-secondary">No logged data yet</p>
          <p className="text-xs text-text-muted mt-1">Complete sessions with this exercise to see progress.</p>
        </div>
      )}
    </div>
  );
}
