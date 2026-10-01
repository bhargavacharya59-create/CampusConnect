"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";
import { markMessagesRead, requestMeeting, sendMessageToProctor } from "../actions";

function Submit({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? busy : idle}
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
  const [state, action] = useFormState<FormState, FormData>(sendMessageToProctor, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="mt-3 flex flex-col gap-2">
      <label htmlFor="body" className="label">
        Message {proctorName}
      </label>
      <textarea id="body" name="body" rows={3} maxLength={1000} required className="field h-auto py-2.5" placeholder="Write your message…" />
      <Feedback state={state} />
      <div className="flex justify-end">
        <Submit idle="Send" busy="Sending…" />
      </div>
    </form>
  );
}

export function MeetingForm({ min, max }: { min: string; max: string }) {
  const [state, action] = useFormState<FormState, FormData>(requestMeeting, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="date" className="label">
          Preferred date
        </label>
        <input id="date" name="date" type="date" min={min} max={max} required className="field" />
        <p className="text-xs text-ink-muted">Monday to Friday, within the next 30 days.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reason" className="label">
          What would you like to discuss?
        </label>
        <textarea id="reason" name="reason" rows={2} maxLength={500} required className="field h-auto py-2.5" />
      </div>
      <Feedback state={state} />
      <Submit idle="Send request" busy="Sending…" />
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
