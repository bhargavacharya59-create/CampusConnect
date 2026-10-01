"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Feedback } from "@/components/ui";
import { saveMarks } from "../../actions";

interface Row {
  id: string;
  rollNo: number;
  name: string;
  score: string;
  absent: boolean;
}

export function MarksSheet({ assessmentId, maxMarks, editable, students }: { assessmentId: number; maxMarks: number; editable: boolean; students: Row[] }) {
  const [rows, setRows] = useState<Row[]>(students);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});
  const router = useRouter();

  const set = (id: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const entered = rows.filter((r) => r.absent || r.score.trim() !== "").length;
  const nums = rows.filter((r) => !r.absent && r.score.trim() !== "").map((r) => Number(r.score)).filter((n) => Number.isFinite(n));
  const avg = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;

  async function save(submit: boolean) {
    if (submit && !window.confirm("Submit these marks to the Director? You won't be able to edit them after this.")) return;
    setBusy(true);
    setState({});
    try {
      const res = await saveMarks(
        assessmentId,
        rows.map((r) => ({ studentId: r.id, score: r.score, absent: r.absent })),
        submit,
      );
      setState(res);
      if (res.ok) router.refresh();
    } catch {
      setState({ error: "Couldn't save. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          Entered <b>{entered}</b> of {rows.length}
          {avg != null && (
            <>
              {" "}
              · class average <b>{avg}</b> / {maxMarks}
            </>
          )}
        </span>
        {!editable && <span className="pill pill-gray">Read only: already submitted</span>}
      </div>
      <div className="-mx-4 overflow-x-auto">
        <table className="table min-w-[520px]">
          <thead>
            <tr>
              <th>Roll</th>
              <th>Student</th>
              <th>Marks (out of {maxMarks})</th>
              <th>Absent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const n = Number(r.score);
              const bad = r.score.trim() !== "" && (!Number.isFinite(n) || n < 0 || n > maxMarks);
              return (
                <tr key={r.id}>
                  <td>{r.rollNo}</td>
                  <td>
                    <div className="font-bold">{r.name}</div>
                    <div className="font-mono text-xs text-ink-muted">{r.id}</div>
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`m-${r.id}`}>
                      Marks for {r.name}
                    </label>
                    <input
                      id={`m-${r.id}`}
                      inputMode="decimal"
                      value={r.absent ? "" : r.score}
                      disabled={!editable || r.absent}
                      onChange={(e) => set(r.id, { score: e.target.value })}
                      className={`field field-sm w-24 ${bad ? "border-danger" : ""}`}
                      aria-invalid={bad}
                    />
                  </td>
                  <td>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={r.absent} disabled={!editable} onChange={(e) => set(r.id, { absent: e.target.checked })} />
                      Absent
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Feedback state={state} />
      {editable && (
        <div className="sticky bottom-3 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-outline h-12 shadow" disabled={busy} onClick={() => save(false)}>
            Save draft
          </button>
          <button type="button" className="btn h-12 px-6 shadow-lg" disabled={busy} onClick={() => save(true)}>
            {busy ? "Saving…" : "Submit to Director"}
          </button>
        </div>
      )}
    </section>
  );
}
