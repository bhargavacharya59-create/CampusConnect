"use client";

import { useEffect, useRef, useState } from "react";
import { SendIcon, SparkleIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/context";
import { askAssistant, type ChatTurn } from "../ai-actions";

// Removes markdown symbols the model sometimes adds, keeping line breaks.
const clean = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "").replace(/^\s*[*-]\s+/gm, "• ");

export function AssistantChat({ enabled, firstName, initialLeft }: { enabled: boolean; firstName: string; initialLeft: number }) {
  const { t, lang } = useI18n();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(initialLeft);
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, pending]);

  const suggestions = [
    t("howDoing", { name: firstName }),
    t("whichSubjectAttention"),
    t("whenNextFee"),
    "ನನ್ನ ಮಗುವಿನ ಹಾಜರಾತಿ ಹೇಗಿದೆ?",
    "मेरे बच्चे के अंक कैसे हैं?",
  ];

  async function send(text: string) {
    const q = text.trim();
    if (!q || pending) return;
    const next: ChatTurn[] = [...turns, { role: "user", text: q }];
    setTurns(next);
    setInput("");
    setError(null);
    setPending(true);
    try {
      const res = await askAssistant(next, lang);
      if (res.left != null) setLeft(res.left);
      if (res.reply) {
        const reply = res.reply;
        setTurns((t) => [...t, { role: "model", text: reply }]);
      } else {
        setError(res.error ?? "Something went wrong.");
        // Take the unanswered question back out so it can be resent.
        setTurns((t) => t.slice(0, -1));
        setInput(q);
      }
    } catch {
      setError(t("connectionError"));
      setTurns((t) => t.slice(0, -1));
      setInput(q);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card flex min-h-[60vh] flex-col shadow-[0_10px_24px_rgba(11,61,58,0.10)]">
      <div className="flex items-center gap-2.5 border-b border-line-soft pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <SparkleIcon size={18} />
        </div>
        <div>
          <h1 className="text-[15px] font-extrabold">{t("askAiTitle", { name: firstName })}</h1>
          <p className="text-xs text-ink-muted">{t("aiAnswerSource", { name: firstName })}</p>
        </div>
      </div>

      {!enabled ? (
        <p className="py-8 text-center text-sm text-ink-muted">{t("aiNotSetUp")}</p>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-3 py-3" aria-live="polite">
            {turns.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-ink-muted">{t("tryAsking")}</p>
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-xl border border-line bg-ground px-3 py-2.5 text-left text-sm font-semibold hover:border-brand-600">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${t.role === "user" ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-ground"}`}>
                  {t.role === "model" ? clean(t.text) : t.text}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-ground px-3.5 py-2.5 text-sm text-ink-muted">{t("thinking")}</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && (
            <p role="alert" className="mb-2 rounded-xl bg-alert-100 px-3 py-2 text-sm font-semibold text-alert-800">
              {error}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-line-soft pt-3"
          >
            <label htmlFor="q" className="sr-only">
              {t("askQuestion")}
            </label>
            <textarea
              id="q"
              rows={1}
              maxLength={1000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={t("askQuestion")}
              className="field h-auto max-h-32 min-h-[48px] flex-1 resize-none py-3"
            />
            <button type="submit" className="btn h-12 w-12 shrink-0 px-0" disabled={pending || !input.trim() || left === 0} aria-label={t("send")}>
              <SendIcon size={18} />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-ink-muted">
            {t("aiCanMakeMistakes")} {t("questionsLeftToday", { count: left })}
          </p>
        </>
      )}
    </section>
  );
}
