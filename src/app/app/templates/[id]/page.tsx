"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    return <p className="text-on-surface-variant">Loading...</p>;
  }

  const usedIds = new Set(template.exercises.map((e) => e.exerciseId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/templates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{template.title}</h1>
            <p className="text-on-surface-variant">{template.category}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={deleteTemplate}>
          <Trash2 className="h-4 w-4 text-error" />
        </Button>
      </div>

      <div className="flex gap-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add exercise to template</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
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
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-primary/[0.08] active:bg-primary/[0.12] transition-colors min-h-[48px]"
                    onClick={() => addExercise(e.id)}
                  >
                    <div>
                      <span className="font-medium text-on-surface">{e.name}</span>
                      <span className="ml-2 text-xs text-on-surface-variant">{e.category}</span>
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
        >
          {startSessionLoading ? "Starting..." : "Start Session"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          {template.exercises.length === 0 ? (
            <p className="text-on-surface-variant">No exercises. Add some to get started.</p>
          ) : (
            <ul className="space-y-3">
              {template.exercises.map((te) => (
                <li
                  key={te.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <span className="font-medium">{te.exercise.name}</span>
                    {(te.defaultSets ?? te.defaultReps ?? te.defaultDurationSec) && (
                      <span className="text-sm text-on-surface-variant ml-2">
                        {te.defaultSets != null && `${te.defaultSets} sets`}
                        {te.defaultReps != null && ` × ${te.defaultReps} reps`}
                        {te.defaultWeight != null && ` @ ${te.defaultWeight}`}
                        {te.defaultDurationSec != null && ` ${te.defaultDurationSec}s`}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(te.id)}
                  >
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
