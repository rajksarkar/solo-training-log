"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, TrendingUp } from "lucide-react";
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

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "strength" as string,
    equipment: "",
    muscles: "",
    instructions: "",
  });

  async function fetchExercises() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category) params.set("category", category);
      const res = await fetch(`/api/exercises?${params}`);
      if (!res.ok) return;
      setExercises(await res.json());
    } catch {
      // ignore
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
      }),
    });
    if (res.ok) {
      setCreateOpen(false);
      setForm({ name: "", category: "strength", equipment: "", muscles: "", instructions: "" });
      fetchExercises();
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Exercises</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} in library
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden sm:inline-flex gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Exercise</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Exercise name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Category</label>
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
                        <span className="capitalize">{c}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Equipment (comma-separated)</label>
                <Input
                  value={form.equipment}
                  onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))}
                  placeholder="barbell, bench"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Muscles (comma-separated)</label>
                <Input
                  value={form.muscles}
                  onChange={(e) => setForm((f) => ({ ...f, muscles: e.target.value }))}
                  placeholder="chest, triceps"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Instructions</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-border bg-surface-high px-4 py-2.5 text-base text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="How to perform this exercise..."
                />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                <span className="capitalize">{c}</span>
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
          <p className="text-text-secondary">No exercises found</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {exercises.map((ex) => {
            const muscles = Array.isArray(ex.muscles) ? ex.muscles as string[] : [];
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExercise(ex)}
                className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-surface border border-border hover:border-primary/30 hover:bg-surface-high active:scale-[0.99] transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-text truncate">{ex.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-primary font-medium capitalize">
                      {ex.category}
                    </span>
                    {muscles.length > 0 && (
                      <span className="text-xs text-text-muted truncate">
                        {muscles.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/app/progress/${ex.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                </Link>
              </button>
            );
          })}
        </div>
      )}

      <FAB onClick={() => setCreateOpen(true)}>
        <Plus />
      </FAB>

      {/* Exercise Detail Dialog */}
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
