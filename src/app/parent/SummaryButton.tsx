"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";
import { generateWeeklySummary } from "./ai-actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-outline h-10 w-full" disabled={pending}>
      {pending ? "Writing summary…" : "Get this week's AI summary"}
    </button>
  );
}

export function SummaryButton() {
  const [state, action] = useFormState<FormState, FormData>(generateWeeklySummary, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <Submit />
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-alert-800">
          {state.error}
        </p>
      )}
    </form>
  );
}
