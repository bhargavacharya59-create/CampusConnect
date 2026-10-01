"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login, type FormState } from "@/app/actions/auth";
import { ROLE_LABEL } from "@/lib/constants";
import { departmentFromId, detectRole } from "@/lib/ids";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn h-[50px] text-base" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useFormState<FormState, FormData>(login, {});
  const [id, setId] = useState("");
  const role = detectRole(id);
  const dept = departmentFromId(id);

  return (
    <form
      action={action}
      className="flex w-full max-w-[420px] flex-col gap-5 rounded-[18px] border border-line bg-white p-6 shadow-[0_16px_40px_rgba(11,61,58,0.08)] sm:p-10"
    >
      <div>
        <h2 className="text-[28px] font-extrabold">Sign in</h2>
        <p className="mt-1.5 text-[15px] text-ink-muted">Use the ID given by the college office.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="id" className="label">
          Unique ID
        </label>
        <input
          id="id"
          name="id"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          required
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g. 24SUUBECS0302"
          className="field font-mono"
        />
        <div className="min-h-[20px] text-[13px] font-bold" aria-live="polite">
          {id.trim().length >= 6 &&
            (role ? (
              <span className="text-brand-700">
                Detected: {ROLE_LABEL[role]}
                {dept ? ` · ${dept}` : ""}
              </span>
            ) : (
              <span className="text-ink-muted">ID format not recognised yet</span>
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl border border-alert-200 bg-alert-100 px-3.5 py-2.5 text-sm font-semibold text-alert-800">
          {state.error}
        </p>
      )}

      <SubmitButton />
      <p className="text-center text-[13px] text-ink-muted">
        Parents: add <b>P</b> to the end of your child&apos;s ID. Forgot your password? Contact the college office.
      </p>
    </form>
  );
}
