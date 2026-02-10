"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Play } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FAB } from "@/components/ui/fab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string[] | unknown;
  muscles: string[] | unknown;
  instructions: string;
  youtubeId?: string | null;
  ownerId: string | null;
};

const CATEGORY_CHIP: Record<string, string> = {
  strength: "bg-primary-container/60 text-on-primary-container",
  cardio: "bg-error-container/60 text-on-error-container",
  zone2: "bg-accent-teal-soft text-on-primary-container",
  pilates: "bg-accent-rose-soft text-on-error-container",
  mobility: "bg-tertiary-container/60 text-on-tertiary-container",
  plyometrics: "bg-accent-slate-soft text-on-primary-container",
  stretching: "bg-secondary-container/60 text-on-secondary-container",
  other: "bg-surface-container-high text-on-surface-variant",
};

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "strength" as string,
    equipment: "",
    muscles: "",
    instructions: "",
    youtubeId: "" as string | undefined,
  });

  async function fetchExercises() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("category", category);
      const res = await fetch(`/api/exercises?${params}`);
      if (!res.ok) {
        console.error("Fetch exercises failed:", res.status);
        return;
      }
      const data = await res.json();
      setExercises(data);
    } catch (err) {
      console.error("Fetch exercises error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExercises();
  }, [search, category]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        equipment: form.equipment ? form.equipment.split(",").map((s) => s.trim()) : [],
        muscles: form.muscles ? form.muscles.split(",").map((s) => s.trim()) : [],
        instructions: form.instructions,
        youtubeId: form.youtubeId || undefined,
      }),
    });
    if (res.ok) {
      setOpen(false);
      setForm({ name: "", category: "strength", equipment: "", muscles: "", instructions: "", youtubeId: "" });
      fetchExercises();
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error ?? "Error"));
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display italic text-on-surface">Exercises</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Browse and manage your exercise library</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex gap-2">
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create custom exercise</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Exercise name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Equipment (comma-separated)</Label>
                <Input
                  value={form.equipment}
                  onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
                  placeholder="barbell, bench"
                />
              </div>
              <div className="space-y-2">
                <Label>Muscles (comma-separated)</Label>
                <Input
                  value={form.muscles}
                  onChange={(e) => setForm((f) => ({ ...f, muscles: e.target.value }))}
                  placeholder="chest, triceps"
                />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-2.5 text-[15px] text-on-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200"
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="Step-by-step how to perform..."
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube video ID (optional)</Label>
                <Input
                  value={form.youtubeId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, youtubeId: e.target.value || undefined }))}
                  placeholder="e.g. gRVjAtPip0Y from youtube.com/watch?v=..."
                />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[180px] min-w-0">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-on-surface-variant">No exercises found.</p>
          <p className="text-sm text-on-surface-variant/60 mt-1">Try adjusting your search or add a custom exercise.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-on-surface-variant">
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
          </p>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                className="w-full text-left rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-4 active:scale-[0.98] transition-all duration-200 shadow-elevation-1"
                onClick={() => setSelectedExercise(ex)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-on-surface flex items-center gap-1.5">
                      {ex.name}
                      <Play className="h-3 w-3 text-primary shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full capitalize ${CATEGORY_CHIP[ex.category] ?? CATEGORY_CHIP.other}`}>
                        {ex.category}
                      </span>
                      {ex.ownerId && (
                        <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-tertiary-container/60 text-on-tertiary-container">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {(Array.isArray(ex.muscles) && ex.muscles.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {(ex.muscles as string[]).slice(0, 3).map((m) => (
                      <span key={m} className="px-2 py-0.5 text-[11px] rounded-full bg-surface-container text-on-surface-variant">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block border border-outline-variant/30 rounded-2xl overflow-hidden bg-surface-container-lowest text-sm shadow-elevation-1">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Name</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant w-28">Category</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Equipment</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Muscles</th>
                </tr>
              </thead>
              <tbody>
              {exercises.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-outline-variant/20 last:border-0 hover:bg-primary/[0.04] cursor-pointer group transition-colors"
                  onClick={() => setSelectedExercise(ex)}
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-on-surface group-hover:text-primary flex items-center gap-1.5 transition-colors">
                          {ex.name}
                          <Play className="h-3 w-3 text-primary/50 group-hover:text-primary shrink-0" />
                        </div>
                        {ex.instructions && (
                          <div className="text-xs text-on-surface-variant/60 line-clamp-1 max-w-lg mt-0.5">
                            {ex.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full capitalize ${CATEGORY_CHIP[ex.category] ?? CATEGORY_CHIP.other}`}>
                      {ex.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-on-surface-variant text-xs">{(Array.isArray(ex.equipment) ? ex.equipment : []).join(", ") || "—"}</td>
                  <td className="py-3.5 px-5 text-on-surface-variant text-xs">{(Array.isArray(ex.muscles) ? ex.muscles : []).join(", ") || "—"}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <FAB onClick={() => setOpen(true)}>
        <Plus />
      </FAB>

      {selectedExercise && (
        <ExerciseDetailDialog
          exercise={selectedExercise}
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
        />
      )}
    </div>
  );
}
