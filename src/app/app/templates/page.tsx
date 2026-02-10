"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/constants";

type Template = {
  id: string;
  title: string;
  category: string;
  notes: string | null;
  exercises: { exercise: { name: string } }[];
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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "strength", notes: "" });

  async function fetchTemplates() {
    setLoading(true);
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) fetchTemplates();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const t = await res.json();
      setOpen(false);
      setForm({ title: "", category: "strength", notes: "" });
      window.location.href = `/app/templates/${t.id}`;
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error ?? "Error"));
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display italic text-on-surface">Templates</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Create reusable workout plans</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Push Day A"
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
                <Label>Notes</Label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-2.5 text-base text-on-surface placeholder:text-on-surface-variant/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-200"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="h-10 w-10 mx-auto text-on-surface-variant/30 mb-3" />
          <p className="text-on-surface-variant">No templates yet.</p>
          <p className="text-sm text-on-surface-variant/60 mt-1">Create one to speed up your sessions.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/app/templates/${t.id}`}>
              <div className="group rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-elevation-1 hover:shadow-elevation-3 hover:border-primary/20 transition-all duration-200 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary/60 to-tertiary/40" />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                        {t.title}
                      </h3>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full capitalize ${CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.other}`}>
                        {t.category}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-error" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/20">
                    <p className="text-xs text-on-surface-variant">
                      {t.exercises.length} exercise{t.exercises.length !== 1 ? "s" : ""}
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <FAB onClick={() => setOpen(true)}>
        <Plus />
      </FAB>
    </div>
  );
}
