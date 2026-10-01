"use client";

// Generic form helpers built on server actions + useFormState.
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";
import { Feedback } from "./ui";

export function SubmitButton({ children, busy = "Saving…", className = "btn", name, value }: { children: React.ReactNode; busy?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        // Put this button's name/value into a hidden field so the server
        // action knows which button was pressed (works in every browser).
        if (!name) return;
        const form = e.currentTarget.form;
        if (!form) return;
        let input = form.querySelector(`input[type="hidden"][name="${name}"]`) as HTMLInputElement | null;
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          form.appendChild(input);
        }
        input.value = value ?? "";
      }}
    >
      {pending ? busy : children}
    </button>
  );
}

/**
 * A <form> wired to a server action that returns { ok, error }.
 * Shows the message and (optionally) clears the form on success.
 */
export function ActionForm({
  action,
  children,
  className = "flex flex-col gap-3",
  resetOnSuccess = true,
}: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <Feedback state={state} />
    </form>
  );
}

/** Form for AI tools: shows the generated text below the button. */
export function AiForm({
  action,
  children,
  className = "flex flex-col gap-3",
}: {
  action: (prev: AiFormState, data: FormData) => Promise<AiFormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useFormState<AiFormState, FormData>(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      <Feedback state={{ error: state.error }} />
      {state.text && (
        <div className="rounded-xl border border-[color:var(--card-border)] bg-ground p-3.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">AI draft</span>
            <CopyButton text={state.text} />
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{state.text}</p>
        </div>
      )}
    </form>
  );
}

export interface AiFormState {
  text?: string;
  error?: string;
}

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="btn-outline btn-sm"
      onClick={(e) => {
        navigator.clipboard?.writeText(text);
        const b = e.currentTarget;
        b.textContent = "Copied";
        setTimeout(() => (b.textContent = "Copy"), 1500);
      }}
    >
      Copy
    </button>
  );
}

/** A button that runs a server action with fixed hidden fields, asking first if `confirm` is set. */
export function InlineAction({
  action,
  fields,
  label,
  busy,
  className = "btn btn-sm",
  confirm,
}: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  fields: Record<string, string>;
  label: string;
  busy?: string;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className="inline-flex flex-col items-end gap-1"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton className={className} busy={busy ?? "…"}>
        {label}
      </SubmitButton>
      {state.error && <span className="max-w-xs text-right text-xs font-semibold text-alert-800">{state.error}</span>}
      {state.ok && (
        <span role="status" className="max-w-xs select-all text-right text-xs font-semibold text-ok-900">
          {state.ok}
        </span>
      )}
    </form>
  );
}
