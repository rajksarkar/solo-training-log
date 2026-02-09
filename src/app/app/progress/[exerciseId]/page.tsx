"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="space-y-6">
        {loading ? (
          <p className="text-on-surface-variant">Loading...</p>
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/exercises">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <button
            type="button"
            onClick={() => setShowDetail(true)}
            className="text-2xl font-bold text-primary hover:text-primary flex items-center gap-2"
          >
            {data.exercise.name}
            <Play className="h-5 w-5" />
          </button>
          <p className="text-on-surface-variant">{data.exercise.category}</p>
        </div>
      </div>

      {showDetail && (
        <ExerciseDetailDialog
          exercise={data.exercise}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <p className="text-sm text-on-surface-variant">
              {isStrength
                ? "Best set weight & volume over time"
                : isCardioLike
                  ? "Duration (minutes) over time"
                  : "Activity over time"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value, ""]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                  />
                  {isStrength && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="var(--md-primary)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Best weight"
                      />
                      <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="var(--md-tertiary)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Volume"
                      />
                    </>
                  )}
                  {isCardioLike && (
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="var(--md-primary)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Duration (min)"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.recentPRs.length > 0 && isStrength && (
        <Card>
          <CardHeader>
            <CardTitle>Recent PRs</CardTitle>
            <p className="text-sm text-on-surface-variant">Heaviest sets (best effort)</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recentPRs.map((d) => (
                <li
                  key={d.sessionId + d.date}
                  className="flex justify-between items-center py-2 border-b last:border-0"
                >
                  <Link
                    href={`/app/sessions/${d.sessionId}`}
                    className="text-primary hover:underline"
                  >
                    {new Date(d.date).toLocaleDateString()}
                  </Link>
                  {d.bestSet && (
                    <span className="font-medium">
                      {d.bestSet.weight} {d.bestSet.unit} × {d.bestSet.reps} reps
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && data.recentPRs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-on-surface-variant">
            No logged data yet. Complete sessions with this exercise to see
            progress.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
