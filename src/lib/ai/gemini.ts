// Gemini REST client. No SDK needed: one fetch per request.
//
// Each AI feature uses its own key so usage and limits can be tracked
// separately (create each key in a separate Google Cloud project, because
// Gemini limits are per project). If a feature's key is missing, the shared
// GEMINI_API_KEY is used instead.
//
// Model choice: Google retires model names over time (gemini-1.5-flash and
// gemini-2.0-flash are gone). So we try GEMINI_MODEL (if set), then the
// "latest" aliases, and if all of those are missing we ask Google which models
// this key can use and pick the newest Flash model. The working name is
// remembered until the server restarts.

export type AiFeature = "PARENT" | "ASSIGNMENT" | "TEACHER" | "ALERTS";

export const AI_KEY_ENV: Record<AiFeature, string> = {
  PARENT: "GEMINI_KEY_PARENT", // parent assistant + weekly parent summaries
  ASSIGNMENT: "GEMINI_KEY_ASSIGNMENT", // checking student notes/assignments
  TEACHER: "GEMINI_KEY_TEACHER", // teacher writing helper + proctor summaries
  ALERTS: "GEMINI_KEY_ALERTS", // at-risk student alerts
};

const PREFERRED_MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-flash-lite"];
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export function aiKey(feature: AiFeature): string | null {
  const k = (process.env[AI_KEY_ENV[feature]] || process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  return k || null;
}

export function isAiEnabled(feature: AiFeature): boolean {
  return !!aiKey(feature);
}

/** Which env variable actually supplies the key for a feature (for status screens). */
export function aiKeySource(feature: AiFeature): string | null {
  if ((process.env[AI_KEY_ENV[feature]] || "").trim()) return AI_KEY_ENV[feature];
  if ((process.env.GEMINI_API_KEY || "").trim()) return "GEMINI_API_KEY";
  return null;
}

export type AiErrorCode = "NO_KEY" | "KEY_INVALID" | "PERMISSION" | "QUOTA" | "REGION" | "MODEL" | "NETWORK" | "TIMEOUT" | "SERVER" | "BLOCKED" | "EMPTY" | "BAD_JSON";

export class AiError extends Error {
  constructor(
    message: string,
    /** Safe to show to users. */
    public userMessage: string,
    public code: AiErrorCode = "SERVER",
  ) {
    super(message);
  }
}

/** Plain-English explanation for the person setting up the keys. */
export function aiErrorHelp(code: AiErrorCode, feature: AiFeature): string {
  const env = AI_KEY_ENV[feature];
  switch (code) {
    case "NO_KEY":
      return `No key found. Add ${env}="..." to the .env file and restart the server.`;
    case "KEY_INVALID":
      return `Google says the key in ${env} is not valid. Copy it again from https://aistudio.google.com/apikey (no spaces or quotes inside), save .env and restart.`;
    case "PERMISSION":
      return `The key in ${env} is not allowed to use Gemini. In Google Cloud, enable the "Generative Language API" for that key's project, and remove any API/IP restrictions on the key.`;
    case "QUOTA":
      return `The key in ${env} has run out of quota (too many requests, or the free tier limit). Wait and retry, turn on billing for that project, or use a key from another project.`;
    case "REGION":
      return "Google does not offer the Gemini API from the server's location. Run the server from a supported region.";
    case "MODEL":
      return "No usable Gemini model was found for this key. Set GEMINI_MODEL in .env to a model listed at https://ai.google.dev/gemini-api/docs/models.";
    case "NETWORK":
      return "The server could not reach generativelanguage.googleapis.com. Check the internet connection, firewall or proxy.";
    case "TIMEOUT":
      return "Gemini took too long to answer. Try again; if it keeps happening, check the network.";
    case "BLOCKED":
      return "Gemini refused this particular request for safety reasons.";
    default:
      return "Gemini returned an error. Try again in a minute.";
  }
}

export interface AiPart {
  text?: string;
  /** Images or PDFs, base64-encoded. */
  inlineData?: { mimeType: string; data: string };
}

export interface AiTurn {
  role: "user" | "model";
  parts: AiPart[];
}

export interface GenerateOptions {
  feature: AiFeature;
  system: string;
  turns: AiTurn[];
  /** Ask Gemini to reply with JSON only. */
  json?: boolean;
  temperature?: number;
  /** Length of the visible answer. Extra room is added for "thinking" models. */
  maxOutputTokens?: number;
  timeoutMs?: number;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string; status?: string };
}

const isDev = process.env.NODE_ENV !== "production";
/** In development, show the technical reason under the friendly message. */
const withDetail = (msg: string, detail: string) => (isDev ? `${msg} (${detail})` : msg);

// ---------------- model resolution ----------------

let resolvedModel: string | null = null;

function candidates(): string[] {
  const list = [process.env.GEMINI_MODEL?.trim(), resolvedModel, ...PREFERRED_MODELS].filter(Boolean) as string[];
  return [...new Set(list.map((m) => m.replace(/^models\//, "")))];
}

/** Asks Google which models this key can call and picks the newest Flash model. */
async function discoverModel(key: string): Promise<string | null> {
  try {
    const res = await fetch(`${ENDPOINT}/models?pageSize=200`, { headers: { "x-goog-api-key": key }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const names = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((n) => /flash/.test(n) && !/(image|tts|audio|live|embedding|vision|exp|preview|thinking)/.test(n));
    if (!names.length) return null;
    const version = (n: string) => Number((n.match(/gemini-(\d+(?:\.\d+)?)/) ?? [])[1] ?? 0);
    names.sort((a, b) => version(b) - version(a) || Number(/lite/.test(a)) - Number(/lite/.test(b)) || a.length - b.length);
    return names[0];
  } catch {
    return null;
  }
}

async function post(model: string, key: string, body: unknown, timeoutMs: number) {
  return fetch(`${ENDPOINT}/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
}

function classify(status: number, data: GeminiResponse): { code: AiErrorCode; user: string } {
  const msg = `${data.error?.status ?? ""} ${data.error?.message ?? ""}`.toLowerCase();
  if (/api key not valid|api_key_invalid|invalid api key|api key expired/.test(msg)) return { code: "KEY_INVALID", user: "The AI key is not valid. Please inform the college office." };
  if (/location is not supported|user location/.test(msg)) return { code: "REGION", user: "The AI is not available from this location." };
  if (status === 429 || /resource_exhausted|quota/.test(msg)) return { code: "QUOTA", user: "The AI has reached its usage limit. Please try again later." };
  if (status === 401 || status === 403 || /permission_denied|has not been used|is disabled|not authorized/.test(msg))
    return { code: "PERMISSION", user: "The AI key is not allowed to use Gemini. Please inform the college office." };
  if (status === 404) return { code: "MODEL", user: "The AI model is not available. Please inform the college office." };
  if (status === 400) return { code: "SERVER", user: "The AI could not process that request. Please try rephrasing." };
  return { code: "SERVER", user: "The AI is busy or unavailable right now. Please try again in a minute." };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Returns the model's text reply. Throws AiError with a user-safe message on failure. */
export async function generateText(opts: GenerateOptions): Promise<string> {
  const key = aiKey(opts.feature);
  if (!key) {
    throw new AiError(`No key for ${opts.feature}`, "The AI feature is not set up yet. Please ask the college office to add the Gemini API key.", "NO_KEY");
  }

  const visible = opts.maxOutputTokens ?? 1024;
  const body = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.turns,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      // Newer Gemini models "think" before answering and those tokens count
      // against this limit, so leave plenty of room or the answer comes back empty.
      maxOutputTokens: Math.min(visible + 6144, 8192),
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  const timeout = opts.timeoutMs ?? 60_000;

  let res: Response | null = null;
  let data: GeminiResponse = {};
  const tried: string[] = [];
  let list = candidates();
  let discovered = false;

  for (let i = 0; i < list.length; i++) {
    const model = list[i];
    tried.push(model);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await post(model, key, body, timeout);
      } catch (e) {
        const name = (e as Error)?.name ?? "";
        if (name === "TimeoutError" || name === "AbortError") {
          throw new AiError(`Gemini timeout (${model})`, withDetail("The AI took too long to answer. Please try again.", "timeout"), "TIMEOUT");
        }
        throw new AiError(`Gemini network error: ${String(e)}`, withDetail("Couldn't reach the AI service. Please try again later.", String((e as Error)?.cause ?? e)), "NETWORK");
      }
      data = (await res.json().catch(() => ({}))) as GeminiResponse;
      // Overloaded / internal error: wait a moment and retry once.
      if ((res.status === 500 || res.status === 503) && attempt === 0) {
        await sleep(1500);
        continue;
      }
      break;
    }
    if (res && res.ok) {
      resolvedModel = model;
      break;
    }
    // Model name retired or unknown for this key: try the next one; once all
    // known names fail, ask Google for the list.
    const status = res?.status ?? 0;
    const modelMissing = status === 404 || (status === 400 && /model|not found|not supported/i.test(data.error?.message ?? ""));
    if (!modelMissing) break;
    if (i === list.length - 1 && !discovered) {
      discovered = true;
      const found = await discoverModel(key);
      if (found && !tried.includes(found)) list = [...list, found];
    }
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 0;
    const detail = `${status} ${data.error?.status ?? ""}: ${data.error?.message ?? "no details"} [models tried: ${tried.join(", ")}]`;
    const { code, user } = classify(status, data);
    if (!process.env.AI_QUIET) console.error(`[ai] ${opts.feature} failed: ${detail}`);
    throw new AiError(`Gemini ${detail}`, withDetail(user, detail), code);
  }

  if (data.promptFeedback?.blockReason) {
    throw new AiError(`Blocked: ${data.promptFeedback.blockReason}`, "Sorry, I can't help with that question.", "BLOCKED");
  }
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) {
    const reason = cand?.finishReason ?? "none";
    if (reason === "SAFETY" || reason === "PROHIBITED_CONTENT") throw new AiError("Blocked by safety", "Sorry, I can't help with that question.", "BLOCKED");
    throw new AiError(`Empty reply (finishReason ${reason})`, withDetail("The AI couldn't answer that. Please try asking differently.", `finishReason ${reason}`), "EMPTY");
  }
  return text;
}

/** Like generateText but parses JSON. */
export async function generateJson<T>(opts: Omit<GenerateOptions, "json">): Promise<T> {
  const text = await generateText({ ...opts, json: true });
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Some models wrap JSON in prose; take the outermost {...} or [...].
    const m = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        /* fall through */
      }
    }
    throw new AiError("Bad JSON from Gemini", "The AI gave an unexpected answer. Please try again.", "BAD_JSON");
  }
}

/** Sends a tiny request to check a feature's key. Used by the Office "AI status" page and `npm run ai:check`. */
export async function testAiKey(feature: AiFeature): Promise<{ ok: boolean; model?: string; code?: AiErrorCode; detail?: string; help?: string }> {
  if (!aiKey(feature)) return { ok: false, code: "NO_KEY", help: aiErrorHelp("NO_KEY", feature) };
  try {
    await generateText({ feature, system: "Reply with the single word OK.", turns: [{ role: "user", parts: [{ text: "Say OK" }] }], maxOutputTokens: 16, timeoutMs: 30_000 });
    return { ok: true, model: resolvedModel ?? undefined };
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError(String(e), String(e));
    return { ok: false, code: err.code, detail: err.message, help: aiErrorHelp(err.code, feature) };
  }
}
