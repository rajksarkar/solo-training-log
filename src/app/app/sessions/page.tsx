"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-on-surface">Sessions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="hidden sm:inline-flex">
              <Plus className="h-4 w-4 mr-2" />
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
              <Button type="submit">Create & Log</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-on-surface-variant">Loading...</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-on-surface-variant">
            No sessions yet. Create one to start logging.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link key={s.id} href={`/app/sessions/${s.id}`}>
              <Card className="hover:bg-primary/[0.08] transition-colors">
                <CardContent className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-on-surface">{s.title}</p>
                    <p className="text-sm text-on-surface-variant">
                      {new Date(s.date).toLocaleDateString()} · {s.category}
                    </p>
                  </div>
                  <span className="text-primary text-sm">View →</span>
                </CardContent>
              </Card>
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
