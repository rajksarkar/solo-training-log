"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, ExternalLink, TrendingUp, Calendar } from "lucide-react";

type ExerciseDetailDialogProps = {
  exercise: {
    id?: string;
    name: string;
    category: string;
    instructions?: string;
    equipment?: string[] | unknown;
    muscles?: string[] | unknown;
    youtubeId?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type HistoryEntry = {
  date: string;
  sessionId: string;
  sessionTitle: string;
  sets: { reps: number | null; weight: number | null; unit: string; durationSec: number | null }[];
};

export function ExerciseDetailDialog({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailDialogProps) {
  const equipment = Array.isArray(exercise.equipment) ? exercise.equipment : [];
  const muscles = Array.isArray(exercise.muscles) ? exercise.muscles : [];
  const instructions = exercise.instructions ?? "";
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " form tutorial")}`;

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [tab, setTab] = useState<"info" | "history">("info");

  useEffect(() => {
    if (!open || !exercise.id) return;
    setLoadingHistory(true);
    fetch(`/api/progress/exercise/${exercise.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.history) {
          setHistory(data.history);
        } else if (data.dataPoints) {
          // Convert dataPoints to history format
          setHistory(
            data.dataPoints.map((dp: any) => ({
              date: dp.date,
              sessionId: dp.sessionId,
              sessionTitle: "",
              sets: dp.bestSet
                ? [{ reps: dp.bestSet.reps, weight: dp.bestSet.weight, unit: dp.bestSet.unit, durationSec: null }]
                : dp.durationSec
                  ? [{ reps: null, weight: null, unit: "lb", durationSec: dp.durationSec }]
                  : [],
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [open, exercise.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{exercise.name}</DialogTitle>
          <span className="text-sm text-primary font-medium capitalize">{exercise.category}</span>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-high rounded-lg p-1">
          <button
            onClick={() => setTab("info")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${
              tab === "info"
                ? "bg-primary text-on-primary"
                : "text-text-secondary hover:text-text"
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors ${
              tab === "history"
                ? "bg-primary text-on-primary"
                : "text-text-secondary hover:text-text"
            }`}
          >
            History
          </button>
        </div>

        {tab === "info" ? (
          <div className="space-y-5">
            {/* Video embed */}
            {exercise.youtubeId ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-bg">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${exercise.youtubeId}?rel=0`}
                  title={`${exercise.name} form tutorial`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-[2.5] w-full rounded-xl overflow-hidden bg-primary/10 border border-primary/20 items-center justify-center gap-3 text-primary hover:bg-primary/15 transition-all group"
              >
                <Play className="h-8 w-8 opacity-70 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-sm font-semibold block">Watch form tutorial</span>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    YouTube <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </a>
            )}

            {/* Instructions */}
            {instructions && (
              <div className="rounded-xl bg-surface-high p-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  How to perform
                </h4>
                <p className="text-text-secondary text-sm whitespace-pre-line leading-relaxed">
                  {instructions}
                </p>
              </div>
            )}

            {/* Tags */}
            {(equipment.length > 0 || muscles.length > 0) && (
              <div className="space-y-3">
                {muscles.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                      Muscles
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {muscles.map((m) => (
                        <span key={m} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-primary/10 text-primary">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {equipment.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                      Equipment
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {equipment.map((e) => (
                        <span key={e} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-highest text-text-secondary">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress link */}
            {exercise.id && (
              <Link
                href={`/app/progress/${exercise.id}`}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                onClick={() => onOpenChange(false)}
              >
                <TrendingUp className="h-4 w-4" />
                View progress chart
              </Link>
            )}
          </div>
        ) : (
          /* History tab */
          <div className="space-y-2">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="h-8 w-8 mx-auto text-text-muted/40 mb-2" />
                <p className="text-text-secondary text-sm">No history yet</p>
              </div>
            ) : (
              history.slice().reverse().map((entry, i) => (
                <Link
                  key={entry.sessionId + entry.date + i}
                  href={`/app/sessions/${entry.sessionId}`}
                  onClick={() => onOpenChange(false)}
                  className="block p-3 rounded-xl bg-surface-high hover:bg-surface-highest transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-text">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {entry.sets.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {entry.sets.map((s, j) => (
                        <span key={j} className="text-xs text-text-secondary">
                          {s.reps != null && s.weight != null
                            ? `${s.reps} x ${s.weight} ${s.unit}`
                            : s.reps != null
                              ? `${s.reps} reps`
                              : s.durationSec != null
                                ? `${s.durationSec >= 60 ? `${Math.floor(s.durationSec / 60)}:${String(s.durationSec % 60).padStart(2, "0")}` : `${s.durationSec}s`}`
                                : "—"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">No data logged</span>
                  )}
                </Link>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
