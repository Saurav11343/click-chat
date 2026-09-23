// Synthetic provider smoke test. Never sends private chats or prints API keys.
import { createProviders } from "../modules/assistant/assistant.providers.js";
import ENV from "../config/env.js";
const modelArg = process.argv.find((arg) => arg.startsWith("--model="))?.slice(8);
const providers = createProviders(modelArg ? { ...ENV, GEMINI_MODEL: modelArg } : ENV);
for (const [name, run] of [
  ["Gemini", async () => {
    if (!process.argv.includes("--json")) return providers.generate("Reply briefly.", { question: "Say hello." });
    const result = await providers.generate('Extract a search keyword. Return JSON {"terms":["keyword"]}.', { question: "Find project deadlines" }, true);
    if (!Array.isArray(JSON.parse(result).terms)) throw new Error("Unexpected JSON search plan");
    return result;
  }],
  ["Tavily", () => providers.searchWeb("React official documentation")],
]) {
  if (process.argv.includes("--gemini-only") && name !== "Gemini") continue;
  try {
    const result = await run();
    console.log(`${name}: OK (${typeof result === "string" ? result.length + " characters" : result.length + " results"})`);
  } catch (error) {
    console.error(`${name}: ${error.message} (HTTP ${error.upstreamStatus || error.statusCode})`);
    if (name === "Gemini" && error.upstreamStatus && process.argv.includes("--diagnose")) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", { headers: { "x-goog-api-key": ENV.GEMINI_API_KEY }, signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      console.log("Gemini model listing:", response.status, data.error?.status || "OK");
      if (response.ok) console.log("Available text models:", data.models?.filter((model) => model.supportedGenerationMethods?.includes("generateContent")).map((model) => model.name).join(", "));
    }
    process.exitCode = 1;
  }
}
