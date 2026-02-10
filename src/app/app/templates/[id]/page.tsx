"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Exercise = { id: string; name: string; category: string };
type TemplateExercise = {
  id: string;
  exerciseId: string;
  order: number;
  exercise: Exercise;
  defaultSets: number | null;
  defaultReps: number | null;
  defaultWeight: number | null;
  defaultDurationSec: number | null;
};
type Template = {
  id: string;
  title: string;
  category: string;
  exercises: TemplateExercise[];
};

const CATEGORY_COLORS: Record<string, string> = {
  strength: "bg-primary-container text-on-primary-container",
  cardio: "bg-error-container text-on-error-container",
  zone2: "bg-accent-teal-soft text-on-primary-container",
  pilates: "bg-accent-rose-soft text-on-error-container",
  mobility: "bg-tertiary-container text-on-tertiary-container",
  plyometrics: "bg-accent-slate-soft text-on-primary-container",
  stretching: "bg-secondary-container text-on-secondary-container",
  other: "bg-surface-container-high text-on-surface-variant",
};

export default function TemplateBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [template, setTemplate] = useState<Template | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [exSearch, setExSearch] = useState("");
  const [startSessionLoading, setStartSessionLoading] = useState(false);

  async function fetchTemplate() {
    const res = await fetch(`/api/templates/${id}`);
    if (!res.ok) {
      router.push("/app/templates");
      return;
    }
    const data = await res.json();
    setTemplate(data);
  }

  async function fetchExercises() {
    const res = await fetch("/api/exercises");
    const data = await res.json();
    setExercises(data);
  }

  useEffect(() => {
    fetchTemplate();
    fetchExercises();
  }, [id]);

  async function addExercise(exerciseId: string) {
    if (!exerciseId || !template) return;
    const order = template.exercises.length;
    const res = await fetch(`/api/templates/${id}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, order }),
    });
    if (res.ok) {
      setExSearch("");
      fetchTemplate();
    }
  }

  async function removeExercise(teId: string) {
    if (!confirm("Remove this exercise?")) return;
    const res = await fetch(
      `/api/templates/${id}/exercises/${teId}`,
      { method: "DELETE" }
    );
    if (res.ok) fetchTemplate();
  }

  async function deleteTemplate() {
    if (!confirm("Delete this template and all its exercises?")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/app/templates");
  }

  async function startSession() {
    setStartSessionLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: template!.title,
        category: template!.category,
        date: today,
        templateId: id,
      }),
    });
    if (res.ok) {
      const s = await res.json();
      router.push(`/app/sessions/${s.id}`);
    }
    setStartSessionLoading(false);
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const usedIds = new Set(template.exercises.map((e) => e.exerciseId));

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/app/templates"
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-on-surface/[0.05] hover:text-on-surface transition-all duration-200 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-display italic text-on-surface">{template.title}</h1>
            <span className={`inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full capitalize ${CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.other}`}>
              {template.category}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={deleteTemplate}>
          <Trash2 className="h-4 w-4 text-error" />
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add exercise to template</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
              <Input
                placeholder="Search exercises..."
                value={exSearch}
                onChange={(e) => setExSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2 space-y-1">
              {exercises
                .filter((e) => !usedIds.has(e.id))
                .filter((e) =>
                  exSearch
                    ? e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
                      e.category.toLowerCase().includes(exSearch.toLowerCase())
                    : true
                )
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-primary/[0.06] active:bg-primary/[0.10] transition-colors min-h-[48px]"
                    onClick={() => addExercise(e.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-on-surface">{e.name}</span>
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full capitalize ${CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.other}`}>
                        {e.category}
                      </span>
                    </div>
                    <Plus className="h-4 w-4 text-primary shrink-0" />
                  </button>
                ))}
              {exercises.filter((e) => !usedIds.has(e.id)).filter((e) =>
                exSearch
                  ? e.name.toLowerCase().includes(exSearch.toLowerCase()) ||
                    e.category.toLowerCase().includes(exSearch.toLowerCase())
                  : true
              ).length === 0 && (
                <p className="py-8 text-center text-on-surface-variant text-sm">No matching exercises</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Button
          onClick={startSession}
          disabled={template.exercises.length === 0 || startSessionLoading}
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          {startSessionLoading ? "Starting..." : "Start Session"}
        </Button>
      </div>

      {/* Exercise list */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-elevation-1 overflow-hidden">
        <div className="px-5 py-3 border-b border-outline-variant/20">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Exercises ({template.exercises.length})
          </h2>
        </div>
        <div>
          {template.exercises.length === 0 ? (
            <p className="text-on-surface-variant py-10 text-center text-sm">No exercises. Add some to get started.</p>
          ) : (
            <ul>
              {template.exercises.map((te, i) => (
                <li
                  key={te.id}
                  className={`flex items-center justify-between py-3.5 px-5 hover:bg-primary/[0.04] transition-colors ${
                    i < template.exercises.length - 1 ? "border-b border-outline-variant/15" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-on-surface-variant/50 font-medium w-5 text-center shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <span className="font-medium text-on-surface text-[15px]">{te.exercise.name}</span>
                      {(te.defaultSets ?? te.defaultReps ?? te.defaultDurationSec) && (
                        <span className="text-xs text-on-surface-variant ml-2">
                          {te.defaultSets != null && `${te.defaultSets} sets`}
                          {te.defaultReps != null && ` x ${te.defaultReps} reps`}
                          {te.defaultWeight != null && ` @ ${te.defaultWeight}`}
                          {te.defaultDurationSec != null && ` ${te.defaultDurationSec}s`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-50 hover:opacity-100"
                    onClick={() => removeExercise(te.id)}
                  >
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
