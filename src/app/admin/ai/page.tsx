import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AI_KEY_ENV, aiKeySource, testAiKey, type AiFeature } from "@/lib/ai/gemini";
import { Card, PageHeader } from "@/components/ui";
import { AiStatusPanel, type KeyResult } from "./AiStatusPanel";

export const metadata: Metadata = { title: "AI status" };

const FEATURES: { feature: AiFeature; label: string }[] = [
  { feature: "PARENT", label: "Gemini 1 · Parent AI assistant + weekly summary" },
  { feature: "ASSIGNMENT", label: "Gemini 2 · Assignment checking" },
  { feature: "TEACHER", label: "Gemini 3 · Teacher AI helper" },
  { feature: "ALERTS", label: "Gemini 4 · Director at-risk alerts" },
];

async function runTests(_prev: { results?: KeyResult[] }, _f: FormData): Promise<{ results?: KeyResult[] }> {
  "use server";
  await requireRole("ADMIN");
  const results: KeyResult[] = [];
  for (const { feature, label } of FEATURES) {
    const r = await testAiKey(feature);
    results.push({ feature, label, envName: AI_KEY_ENV[feature], source: aiKeySource(feature), ok: r.ok, model: r.model, help: r.help, detail: r.detail });
  }
  return { results };
}

export default async function AiStatusPage() {
  await requireRole("ADMIN");
  return (
    <>
      <PageHeader title="AI status" subtitle="Checks each Gemini key with a tiny request and explains any problem in plain words" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card title="Keys">
          <AiStatusPanel action={runTests} />
        </Card>
        <Card title="Where the keys go">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            <li>
              Open the <b>.env</b> file in the project folder.
            </li>
            <li>
              Paste each key between the quotes:
              <ul className="mt-1 space-y-0.5 font-mono text-xs">
                {FEATURES.map((f) => (
                  <li key={f.feature}>
                    {AI_KEY_ENV[f.feature]}=&quot;…&quot; {aiKeySource(f.feature) ? "✓" : "(missing)"}
                  </li>
                ))}
              </ul>
            </li>
            <li>Save the file and restart the server.</li>
            <li>Come back here and press Test.</li>
          </ol>
          <p className="mt-3 text-xs text-ink-muted">Keys come from aistudio.google.com/apikey. The same check runs from a terminal with npm run ai:check.</p>
        </Card>
      </div>
    </>
  );
}
