"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Feedback } from "@/components/ui";
import { saveAttendance } from "../actions";

interface S {
  id: string;
  name: string;
  rollNo: number;
}

export function AttendanceSheet({
  assignmentId,
  period,
  title,
  students,
  initialAbsent,
  alreadyTaken,
}: {
  assignmentId: number;
  period: number;
  title: string;
  students: S[];
  initialAbsent: string[];
  alreadyTaken: boolean;
}) {
  const [absent, setAbsent] = useState<Set<string>>(() => new Set(initialAbsent));
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});
  const router = useRouter();

  const toggle = (id: string) =>
    setAbsent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const q = filter.trim().toLowerCase();
  const shown = q ? students.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) : students;

  async function submit() {
    setSaving(true);
    setState({});
    try {
      const res = await saveAttendance(assignmentId, period, [...absent]);
      setState(res);
      if (res.ok) router.refresh();
    } catch {
      setState({ error: "Couldn't save. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-extrabold">{title}</h2>
          <p className="text-sm text-ink-muted">Everyone starts as Present. Tap a student to mark Absent.{alreadyTaken ? " Already taken: you are editing." : ""}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pill pill-green px-3 py-1.5 text-sm">Present {students.length - absent.size}</span>
          <span className="pill pill-red px-3 py-1.5 text-sm">Absent {absent.size}</span>
          <span className="pill pill-gray px-3 py-1.5 text-sm">Total {students.length}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="find" className="sr-only">
          Find a student
        </label>
        <input id="find" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find by name or ID" className="field field-sm max-w-xs" />
        <button type="button" className="btn-outline btn-sm" onClick={() => setAbsent(new Set())}>
          Mark all present
        </button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((s) => {
          const off = absent.has(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => toggle(s.id)}
                aria-pressed={off}
                className={`flex min-h-[56px] w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                  off ? "border-alert-200 bg-alert-100" : "border-line bg-white hover:border-[color:var(--accent)]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    <span className="mr-1.5 text-ink-muted">{s.rollNo}.</span>
                    {s.name}
                  </span>
                  <span className="block font-mono text-xs text-ink-muted">{s.id}</span>
                </span>
                <span className={`pill ${off ? "bg-alert-600 text-white" : "pill-green"}`}>{off ? "Absent" : "Present"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Feedback state={state} />
      <div className="sticky bottom-3 flex justify-end">
        <button type="button" className="btn h-12 px-6 shadow-lg" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : alreadyTaken ? "Save changes" : "Submit attendance"}
        </button>
      </div>
    </section>
  );
}
