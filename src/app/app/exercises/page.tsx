"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Play } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { ExerciseDetailDialog } from "@/components/exercise-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl font-bold text-on-surface">Exercise Inventory</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex">
              <Plus className="h-4 w-4 mr-2" />
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
                  className="flex min-h-[80px] w-full rounded-xs border border-outline px-4 py-2 text-base text-on-surface bg-transparent placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
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
              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
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
        <p className="text-on-surface-variant">Loading...</p>
      ) : exercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-on-surface-variant">
            No exercises found. Add a custom exercise or run the seed script.
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-on-surface-variant">
            Showing {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
          </p>

          {/* Mobile: card list */}
          <div className="sm:hidden space-y-2">
            {exercises.map((ex) => (
              <Card
                key={ex.id}
                className="cursor-pointer active:bg-primary/[0.08] transition-colors"
                onClick={() => setSelectedExercise(ex)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-primary flex items-center gap-1.5">
                        {ex.name}
                        <Play className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {ex.category} {ex.ownerId ? " · Custom" : ""}
                      </div>
                    </div>
                  </div>
                  {(Array.isArray(ex.muscles) && ex.muscles.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(ex.muscles as string[]).slice(0, 3).map((m) => (
                        <span key={m} className="px-2 py-0.5 text-xs rounded-full bg-primary-container text-on-primary-container">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block border border-outline-variant rounded-xl overflow-x-auto bg-surface-container-lowest text-sm">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="text-left py-3 px-4 font-medium text-on-surface-variant">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-on-surface-variant w-28">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-on-surface-variant">Equipment</th>
                  <th className="text-left py-3 px-4 font-medium text-on-surface-variant">Muscles</th>
                  <th className="text-left py-3 px-4 font-medium text-on-surface-variant w-16">Custom</th>
                </tr>
              </thead>
              <tbody>
              {exercises.map((ex) => (
                <tr
                  key={ex.id}
                  className="border-b border-outline-variant last:border-0 hover:bg-primary/[0.08] cursor-pointer group transition-colors"
                  onClick={() => setSelectedExercise(ex)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-primary group-hover:text-primary flex items-center gap-2">
                          {ex.name}
                          <Play className="h-3.5 w-3.5 opacity-60 shrink-0" />
                        </div>
                        {ex.instructions && (
                          <div className="text-xs text-on-surface-variant line-clamp-1 max-w-lg">
                            {ex.instructions}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                    <td className="py-3 px-4 text-on-surface-variant">{ex.category}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{(Array.isArray(ex.equipment) ? ex.equipment : []).join(", ") || "—"}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{(Array.isArray(ex.muscles) ? ex.muscles : []).join(", ") || "—"}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{ex.ownerId ? "Yes" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FAB for mobile */}
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
