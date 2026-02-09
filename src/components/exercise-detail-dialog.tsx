"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";

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
          <DialogTitle className="text-xl">{exercise.name}</DialogTitle>
          <span className="text-sm text-on-surface-variant capitalize">{exercise.category}</span>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video embed */}
          {exercise.youtubeId ? (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-inverse-surface">
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
              className="flex aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-primary to-primary items-center justify-center gap-3 text-on-primary hover:opacity-90 transition-colors"
            >
              <Play className="h-16 w-16 opacity-90" />
              <span className="text-lg font-medium">Watch form tutorial on YouTube</span>
            </a>
          )}

          {/* Instructions */}
          <div className="rounded-lg bg-surface-container-low p-4">
            <h4 className="text-sm font-semibold text-on-surface mb-2">How to perform</h4>
            <p className="text-on-surface-variant whitespace-pre-line leading-relaxed">
              {instructions || "No instructions available."}
            </p>
          </div>

          {/* Tags */}
          {(equipment.length > 0 || muscles.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {muscles.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary-container text-on-primary-container"
                >
                  {m}
                </span>
              ))}
              {equipment.map((e) => (
                <span
                  key={e}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary-container text-on-secondary-container"
                >
                  {e}
                </span>
              ))}
            </div>
          )}

          {/* Fallback YouTube link */}
          {!exercise.youtubeId && (
            <p className="text-xs text-on-surface-variant">
              <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Search YouTube for &quot;{exercise.name} form tutorial&quot;
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
