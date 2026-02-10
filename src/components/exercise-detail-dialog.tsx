"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, ExternalLink } from "lucide-react";

type ExerciseDetailDialogProps = {
  exercise: {
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

export function ExerciseDetailDialog({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailDialogProps) {
  const equipment = Array.isArray(exercise.equipment) ? exercise.equipment : [];
  const muscles = Array.isArray(exercise.muscles) ? exercise.muscles : [];
  const instructions = exercise.instructions ?? "";
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " form tutorial")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display italic">{exercise.name}</DialogTitle>
          <span className="text-sm text-on-surface-variant capitalize">{exercise.category}</span>
        </DialogHeader>

        <div className="space-y-5">
          {/* Video embed */}
          {exercise.youtubeId ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-inverse-surface">
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
              className="flex aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 items-center justify-center gap-3 text-on-primary hover:from-primary/90 hover:to-primary/70 transition-all duration-300 group"
            >
              <Play className="h-12 w-12 opacity-80 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-base font-medium block">Watch form tutorial</span>
                <span className="text-xs opacity-70 flex items-center gap-1">YouTube <ExternalLink className="h-3 w-3" /></span>
              </div>
            </a>
          )}

          {/* Instructions */}
          <div className="rounded-2xl bg-surface-container-low p-5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">How to perform</h4>
            <p className="text-on-surface-variant text-[15px] whitespace-pre-line leading-relaxed">
              {instructions || "No instructions available."}
            </p>
          </div>

          {/* Tags */}
          {(equipment.length > 0 || muscles.length > 0) && (
            <div className="space-y-3">
              {muscles.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Muscles</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {muscles.map((m) => (
                      <span
                        key={m}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-primary-container/60 text-on-primary-container"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {equipment.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Equipment</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {equipment.map((e) => (
                      <span
                        key={e}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-tertiary-container/60 text-on-tertiary-container"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback YouTube link */}
          {!exercise.youtubeId && (
            <p className="text-xs text-on-surface-variant/60">
              <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                Search YouTube for &quot;{exercise.name} form tutorial&quot;
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
