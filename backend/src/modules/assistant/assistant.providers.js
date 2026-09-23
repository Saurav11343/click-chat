import ENV from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";

async function requestJson(url, options, provider, fetcher) {
  try {
    const response = await fetcher(url, {
      ...options,
      signal: AbortSignal.timeout(35000),
    });
    if (!response.ok) {
      if (response.status === 429 || response.status === 432) {
        throw new AppError(
          `${provider}'s usage limit has been reached. Please try again later.`,
          429,
        );
      }
      // Never log or forward upstream payloads, which can contain credentials or prompts.
      if (response.status >= 500) {
        throw new AppError(`${provider} is temporarily unavailable. Please try again shortly.`, 502, { upstreamStatus: response.status });
      }
      throw new AppError(
        `${provider} is unavailable. Check the server API key and model configuration.`,
        502,
        { upstreamStatus: response.status },
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`${provider} did not respond. Please try again.`, 502);
  }
}

export function createProviders(config = ENV, fetcher = globalThis.fetch) {
  return {
    async generate(instruction, input, json = false) {
      if (!config.GEMINI_API_KEY)
        throw new AppError(
          "The assistant needs GEMINI_API_KEY on the server.",
          503,
        );
      const data = await requestJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.GEMINI_MODEL)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": config.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: instruction }] },
            contents: [
              { role: "user", parts: [{ text: JSON.stringify(input) }] },
            ],
            generationConfig: {
              maxOutputTokens: 4096,
              ...(json ? { responseMimeType: "application/json" } : {}),
            },
          }),
        },
        "Gemini",
        fetcher,
      );
      const candidate = data.candidates?.[0];
      const answer = candidate?.content?.parts
        ?.filter((part) => !part.thought)
        .map((part) => part.text || "")
        .join("")
        .trim();
      if (
        !answer ||
        (candidate.finishReason &&
          !["STOP", "MAX_TOKENS"].includes(candidate.finishReason))
      ) {
        throw new AppError(
          "The assistant could not answer this request. Try rephrasing it.",
          502,
        );
      }
      return (
        answer +
        (!json && candidate.finishReason === "MAX_TOKENS"
          ? "\n\n[Response reached its length limit. Please ask a narrower question.]"
          : "")
      );
    },
    async searchWeb(query) {
      if (!config.TAVILY_API_KEY)
        throw new AppError(
          "Web search needs TAVILY_API_KEY on the server.",
          503,
        );
      const data = await requestJson(
        "https://api.tavily.com/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.TAVILY_API_KEY}`,
          },
          body: JSON.stringify({
            query,
            search_depth: "basic",
            max_results: 5,
            include_answer: false,
            include_raw_content: false,
          }),
        },
        "Web search",
        fetcher,
      );
      return (data.results || [])
        .filter((result) => {
          try {
            return ["https:", "http:"].includes(new URL(result.url).protocol);
          } catch {
            return false;
          }
        })
        .slice(0, 5)
        .map((result, index) => ({
          number: index + 1,
          kind: "web",
          title: String(result.title || result.url).slice(0, 300),
          url: result.url,
          excerpt: String(result.content || "").slice(0, 2500),
        }));
    },
  };
}
