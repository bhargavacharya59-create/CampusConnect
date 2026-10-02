// Checks every Gemini key in .env with a tiny request and explains any problem.
// Run with:  npm run ai:check
process.env.AI_QUIET = "1";
import { readFileSync, existsSync } from "node:fs";

// Load .env (simple KEY="value" lines) without extra packages.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
} else {
  console.log("No .env file found in this folder. Copy .env.example to .env first.\n");
}

const FEATURES = [
  ["PARENT", "Parent AI assistant + weekly summary"],
  ["ASSIGNMENT", "Assignment checking"],
  ["TEACHER", "Teacher AI helper"],
  ["ALERTS", "Director at-risk alerts"],
] as const;

(async () => {
  const { testAiKey, aiKeySource } = await import("../src/lib/ai/gemini");
  let bad = 0;
  for (const [f, label] of FEATURES) {
    const source = aiKeySource(f);
    process.stdout.write(`${label.padEnd(40)} `);
    const r = await testAiKey(f);
    if (r.ok) console.log(`OK   (key: ${source}, model: ${r.model})`);
    else {
      bad++;
      console.log(`FAIL (key: ${source ?? "none"})\n     ${r.help}${r.detail ? `\n     Google said: ${r.detail}` : ""}`);
    }
  }
  console.log(bad ? `\n${bad} feature(s) need attention.` : "\nAll AI features are working.");
  process.exit(bad ? 1 : 0);
})();
