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
          <DialogTitle className="text-xl font-bold">{exercise.name}</DialogTitle>
          <span className="text-sm text-primary font-medium capitalize">{exercise.category}</span>
        </DialogHeader>

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
              className="flex aspect-video w-full rounded-xl overflow-hidden bg-primary/10 border border-primary/20 items-center justify-center gap-3 text-primary hover:bg-primary/15 transition-all group"
            >
              <Play className="h-10 w-10 opacity-70 group-hover:scale-110 transition-transform" />
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
                      <span
                        key={m}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-primary/10 text-primary"
                      >
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
                      <span
                        key={e}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-highest text-text-secondary"
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
            <p className="text-xs text-text-muted">
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
