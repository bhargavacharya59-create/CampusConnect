"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { changePassword, type FormState } from "@/app/actions/auth";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn w-full" disabled={pending}>
      {pending ? "Saving…" : "Change password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useFormState<FormState, FormData>(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="current" className="label">
          Current password
        </label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className="field" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="next" className="label">
          New password
        </label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required className="field" />
        <p className="text-xs text-ink-muted">At least 8 characters, with a letter and a number.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="label">
          Confirm new password
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-alert-100 px-3 py-2 text-sm font-semibold text-alert-800">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl bg-ok-50 px-3 py-2 text-sm font-semibold text-ok-900">
          {state.ok}
        </p>
      )}
      <Submit />
    </form>
  );
}
