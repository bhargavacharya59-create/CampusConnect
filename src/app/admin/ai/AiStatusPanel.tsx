"use client";

import { useFormState, useFormStatus } from "react-dom";

export interface KeyResult {
  feature: string;
  label: string;
  envName: string;
  source: string | null;
  ok: boolean;
  model?: string;
  help?: string;
  detail?: string;
}

function Run() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? "Testing each key…" : "Test all AI keys now"}
    </button>
  );
}

export function AiStatusPanel({ action }: { action: (prev: { results?: KeyResult[] }, f: FormData) => Promise<{ results?: KeyResult[] }> }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Run />
      </div>
      {state.results && (
        <div className="flex flex-col gap-3">
          {state.results.map((r) => (
            <div key={r.feature} className={`rounded-xl border p-3.5 ${r.ok ? "border-ok-50 bg-ok-50" : "border-alert-200 bg-alert-100"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>{r.label}</b>
                <span className={`pill ${r.ok ? "bg-white text-ok-900" : "bg-white text-alert-800"}`}>{r.ok ? "Working" : "Not working"}</span>
              </div>
              <div className="mt-1 text-sm">
                Key used: <span className="font-mono">{r.source ?? `none (add ${r.envName})`}</span>
                {r.model && (
                  <>
                    {" "}
                    · model <span className="font-mono">{r.model}</span>
                  </>
                )}
              </div>
              {!r.ok && r.help && <p className="mt-2 text-sm font-semibold text-alert-800">{r.help}</p>}
              {!r.ok && r.detail && <p className="mt-1 break-words font-mono text-xs text-ink-soft">Google said: {r.detail}</p>}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
