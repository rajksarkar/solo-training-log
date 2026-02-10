"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, ArrowRight, Calendar } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
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

type Session = {
  id: string;
  title: string;
  category: string;
  date: string;
  exercises: unknown[];
};

type Template = { id: string; title: string; category: string };

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

export default function SessionsPage() {
  const searchParams = useSearchParams();
  const showNew = searchParams.get("new") === "1";
  const [sessions, setSessions] = useState<Session[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(showNew);
  const [form, setForm] = useState({
    title: "",
    category: "strength",
    date: new Date().toISOString().slice(0, 10),
    templateId: "",
  });

  async function fetchSessions() {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const to = new Date();
    to.setDate(to.getDate() + 7);
    const res = await fetch(
      `/api/sessions?from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`
    );
    const data = await res.json();
    setSessions(data);
  }

  async function fetchTemplates() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSessions(), fetchTemplates()]).finally(() =>
      setLoading(false)
    );
  }, []);

  async function handleDelete(sessionId: string) {
    if (!confirm("Delete this session?")) return;
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) fetchSessions();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {
      title: form.title,
      category: form.category,
      date: form.date,
    };
    if (form.templateId) body.templateId = form.templateId;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const s = await res.json();
      setOpen(false);
      setForm({
        title: "",
        category: "strength",
        date: new Date().toISOString().slice(0, 10),
        templateId: "",
      });
      window.location.href = `/app/sessions/${s.id}`;
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error ?? "Error"));
    }
  }

  function selectTemplate(t: Template) {
    setForm((f) => ({
      ...f,
      title: t.title,
      category: t.category,
      templateId: t.id,
    }));
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display italic text-on-surface">Sessions</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Your training history</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex gap-2">
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>From template (optional)</Label>
                <Select
                  value={form.templateId || "__none__"}
                  onValueChange={(v) => {
                    if (v === "__none__") {
                      setForm((f) => ({
                        ...f,
                        templateId: "",
                        title: "",
                        category: "strength",
                      }));
                    } else {
                      const t = templates.find((x) => x.id === v);
                      if (t) selectTemplate(t);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Start from scratch</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title} ({t.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Session title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v }))
                  }
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
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">Create & Log</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center">
          <Calendar className="h-10 w-10 mx-auto text-on-surface-variant/30 mb-3" />
          <p className="text-on-surface-variant">No sessions yet.</p>
          <p className="text-sm text-on-surface-variant/60 mt-1">Create your first session to start logging.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link key={s.id} href={`/app/sessions/${s.id}`}>
              <div className="group flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-elevation-1 hover:shadow-elevation-2 hover:border-primary/20 transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.other}`}>
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-on-surface truncate group-hover:text-primary transition-colors">{s.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(s.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    <span className="mx-1.5 text-outline-variant">·</span>
                    <span className="capitalize">{s.category}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(s.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-error" />
                  </Button>
                  <ArrowRight className="h-4 w-4 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
