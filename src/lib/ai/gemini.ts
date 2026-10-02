// Thin Gemini REST client. No SDK needed: one fetch per request.
//
// Each AI feature uses its own key so usage and limits can be tracked
// separately (create each key in a separate Google Cloud project, because
// Gemini limits are per project). If a feature's key is missing, the shared
// GEMINI_API_KEY is used instead.

export type AiFeature = "PARENT" | "ASSIGNMENT" | "TEACHER" | "ALERTS";

export const AI_KEY_ENV: Record<AiFeature, string> = {
  PARENT: "GEMINI_KEY_PARENT", // parent assistant + weekly parent summaries
  ASSIGNMENT: "GEMINI_KEY_ASSIGNMENT", // checking student notes/assignments
  TEACHER: "GEMINI_KEY_TEACHER", // teacher writing helper + proctor summaries
  ALERTS: "GEMINI_KEY_ALERTS", // at-risk student alerts
};

const DEFAULT_MODEL = "gemini-2.0-flash";
// Used automatically if the configured model is not found (e.g. retired).
const FALLBACK_MODEL = "gemini-1.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export function aiKey(feature: AiFeature): string | null {
  return process.env[AI_KEY_ENV[feature]] || process.env.GEMINI_API_KEY || null;
}

export function isAiEnabled(feature: AiFeature): boolean {
  return !!aiKey(feature);
}

export class AiError extends Error {
  constructor(
    message: string,
    /** Safe to show to users. */
    public userMessage: string,
  ) {
    super(message);
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
  maxOutputTokens?: number;
  timeoutMs?: number;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string; status?: string };
}

async function call(model: string, key: string, body: unknown, timeoutMs: number) {
  return fetch(`${ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
}

/** Returns the model's text reply. Throws AiError with a user-safe message on failure. */
export async function generateText(opts: GenerateOptions): Promise<string> {
  const key = aiKey(opts.feature);
  if (!key) {
    throw new AiError(`No key for ${opts.feature}`, "The AI feature is not set up yet. Please ask the college office to add the Gemini API key.");
  }

  const body = {
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.turns,
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  let res: Response;
  try {
    res = await call(model, key, body, opts.timeoutMs ?? 45_000);
    if (res.status === 404 && model !== FALLBACK_MODEL) {
      res = await call(FALLBACK_MODEL, key, body, opts.timeoutMs ?? 45_000);
    }
  } catch (e) {
    throw new AiError(`Gemini request failed: ${String(e)}`, "The AI took too long to answer. Please try again.");
  }

  const data = (await res.json().catch(() => ({}))) as GeminiResponse;
  if (!res.ok) {
    const detail = data.error?.message ?? res.statusText;
    if (res.status === 429) throw new AiError(`Gemini 429: ${detail}`, "The AI is busy right now. Please try again in a minute.");
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new AiError(`Gemini ${res.status}: ${detail}`, "The AI is not configured correctly. Please inform the college office.");
    }
    throw new AiError(`Gemini ${res.status}: ${detail}`, "The AI is unavailable right now. Please try again later.");
  }
  if (data.promptFeedback?.blockReason) {
    throw new AiError(`Blocked: ${data.promptFeedback.blockReason}`, "Sorry, I can't help with that question.");
  }
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
  if (!text) throw new AiError("Empty reply", "The AI couldn't answer that. Please try asking differently.");
  return text;
}

/** Like generateText but parses JSON. */
export async function generateJson<T>(opts: Omit<GenerateOptions, "json">): Promise<T> {
  const text = await generateText({ ...opts, json: true });
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T;
  } catch {
    throw new AiError("Bad JSON from Gemini", "The AI gave an unexpected answer. Please try again.");
  }
}
