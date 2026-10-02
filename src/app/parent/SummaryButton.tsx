"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useI18n } from "@/lib/i18n/context";
import type { FormState } from "@/app/actions/auth";
import { generateWeeklySummary } from "./ai-actions";

function Submit() {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button type="submit" className="btn-outline h-10 w-full" disabled={pending}>
      {pending ? t("writingSummary") : t("getWeeklySummary")}
    </button>
  );
}

export function SummaryButton() {
  const { lang } = useI18n();
  const [state, action] = useFormState<FormState, FormData>(generateWeeklySummary, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lang" value={lang} />
      <Submit />
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-alert-800">
          {state.error}
        </p>
      )}
    </form>
  );
}
