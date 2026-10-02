"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { useI18n } from "@/lib/i18n/context";
import type { FormState } from "@/app/actions/auth";
import { markMessagesRead, requestMeeting, sendMessageToProctor } from "../actions";

function Submit({ idleKey, busyKey }: { idleKey: "send" | "sendRequest"; busyKey: "sending" }) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? t(busyKey) : t(idleKey)}
    </button>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-xl bg-alert-100 px-3 py-2 text-sm font-semibold text-alert-800">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="rounded-xl bg-ok-50 px-3 py-2 text-sm font-semibold text-ok-900">
        {state.ok}
      </p>
    );
  return null;
}

export function MessageForm({ proctorName }: { proctorName: string }) {
  const { t } = useI18n();
  const [state, action] = useFormState<FormState, FormData>(sendMessageToProctor, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="mt-3 flex flex-col gap-2">
      <label htmlFor="body" className="label">
        {t("messageProctor", { name: proctorName })}
      </label>
      <textarea id="body" name="body" rows={3} maxLength={1000} required className="field h-auto py-2.5" placeholder={t("writeYourMessage")} />
      <Feedback state={state} />
      <div className="flex justify-end">
        <Submit idleKey="send" busyKey="sending" />
      </div>
    </form>
  );
}

export function MeetingForm({ min, max }: { min: string; max: string }) {
  const { t } = useI18n();
  const [state, action] = useFormState<FormState, FormData>(requestMeeting, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="label">
          {t("preferredDate")}
        </label>
        <input id="date" name="date" type="date" min={min} max={max} required className="field" />
        <p className="text-xs text-ink-muted">{t("dateConstraint")}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="label">
          {t("whatToDiscuss")}
        </label>
        <textarea id="reason" name="reason" rows={2} maxLength={500} required className="field h-auto py-2.5" />
      </div>
      <Feedback state={state} />
      <Submit idleKey="sendRequest" busyKey="sending" />
    </form>
  );
}

/** Marks incoming messages as read once the page is open, then refreshes the unread badge. */
export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!hasUnread) return;
    markMessagesRead().then(() => router.refresh());
  }, [hasUnread, router]);
  return null;
}
