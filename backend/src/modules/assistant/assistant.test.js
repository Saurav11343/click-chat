import test from "node:test";
import assert from "node:assert/strict";
import { assistantSchema } from "./assistant.schema.js";
import { createAssistantService, escapeRegex } from "./assistant.service.js";
import { createProviders } from "./assistant.providers.js";
import { AppError } from "../../shared/errors/app-error.js";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import ENV from "../../config/env.js";
import User from "../users/user.model.js";
import assistantRouter from "./assistant.route.js";

const userId = "111111111111111111111111";
const conversationId = "222222222222222222222222";
const message = {
  _id: "333333333333333333333333",
  conversation: conversationId,
  sender: { firstName: "Alex" },
  content: "Project deadline is Friday",
  createdAt: new Date("2026-09-20"),
  messageType: "text",
};
const conversation = {
  _id: conversationId,
  participants: [{ _id: userId }, { _id: "other", firstName: "Alex" }],
};
const summary = {
  mode: "summary",
  query: "Summarize",
  conversationId,
  history: [],
};
function setup(overrides = {}) {
  const calls = [];
  const repository = {
    conversations: async (...args) => {
      calls.push(["conversations", ...args]);
      return [conversation];
    },
    messages: async (...args) => {
      calls.push(["messages", ...args]);
      return [message];
    },
    currentMessages: async () => [message],
    ...overrides.repository,
  };
  const providers = {
    generate: async (...args) => {
      calls.push(["generate", ...args]);
      return args[2] ? '{"terms":["deadline"]}' : "Deadline: Friday [1]";
    },
    searchWeb: async (...args) => {
      calls.push(["web", ...args]);
      return [
        {
          kind: "web",
          number: 1,
          title: "React",
          url: "https://react.dev",
          excerpt: "Learn React",
        },
      ];
    },
    ...overrides.providers,
  };
  return { ask: createAssistantService({ repository, providers }), calls };
}

test("validation rejects private context in web mode, invalid IDs, huge inputs and unscoped summaries", () => {
  for (const input of [
    { mode: "web", query: "React", history: ["private chat"] },
    { mode: "web", query: "React", conversationId },
    { mode: "chats", query: "x", conversationId: "bad" },
    { mode: "summary", query: "x" },
    { mode: "web", query: "x".repeat(1001) },
    { mode: "chats", query: "x", since: "yesterday" },
  ])
    assert.equal(assistantSchema.safeParse(input).success, false);
  assert.equal(assistantSchema.safeParse(summary).success, true);
});
test("a foreign conversation fails before messages or AI are accessed", async () => {
  const { ask, calls } = setup({
    repository: { conversations: async () => [] },
  });
  await assert.rejects(ask(userId, summary), { statusCode: 404 });
  assert.equal(calls.length, 0);
});
test("queries enforce membership, exclude deleted messages and respect the requested date", async () => {
  const { ask, calls } = setup();
  const since = "2026-09-01T00:00:00.000Z";
  const result = await ask(userId, { ...summary, since });
  const filter = calls.find(([type]) => type === "messages")[1];
  assert.deepEqual(filter, {
    conversation: { $in: [conversationId] },
    isDeleted: false,
    createdAt: { $gte: new Date(since) },
  });
  assert.equal(result.sources[0].messageId, message._id);
  assert.equal(result.sources[0].sender, "Alex");
});
test("web search never reads MongoDB or passes chat context to either provider", async () => {
  const { ask, calls } = setup();
  await ask(userId, { mode: "web", query: "React", history: [] });
  assert.deepEqual(
    calls.map(([type]) => type),
    ["web", "generate"],
  );
  assert.deepEqual(calls[1][2].previousQuestions, []);
  assert.equal(JSON.stringify(calls).includes(message.content), false);
});
test("regex metacharacters in model search terms are treated literally", async () => {
  const { ask, calls } = setup({
    providers: {
      generate: async (instruction, input, json) =>
        json ? '{"terms":[".*(a)+$"]}' : "Result",
    },
  });
  await ask(userId, { ...summary, mode: "chats" });
  const regex = calls.find(([type]) => type === "messages")[1].$or[0].content
    .$regex;
  assert.equal(new RegExp(regex).test("anything"), false);
  assert.equal(new RegExp(regex).test(".*(a)+$"), true);
  assert.equal(escapeRegex("[x]"), "\\[x\\]");
});
test("model query failures fall back to keyword search and still show results", async () => {
  const { ask, calls } = setup({
    providers: {
      generate: async () => {
        throw new AppError("Quota exceeded", 429);
      },
    },
  });
  const result = await ask(userId, {
    ...summary,
    mode: "chats",
    query: "Find deadline",
  });
  assert.equal(result.sources.length, 1);
  assert.equal(result.warning, "Quota exceeded");
  assert.equal(
    calls.find(([type]) => type === "messages")[1].$or[0].content.$regex,
    "deadline",
  );
});
test("no matching messages avoids answer generation", async () => {
  const { ask, calls } = setup({ repository: { messages: async () => [] } });
  const result = await ask(userId, summary);
  assert.equal(result.sources.length, 0);
  assert.equal(
    calls.some(([type]) => type === "generate"),
    false,
  );
});
test("large summaries report truncation and stay within their source budget", async () => {
  const rows = Array.from({ length: 201 }, (_, index) => ({
    ...message,
    _id: String(index),
    content: "a".repeat(5000),
  }));
  const { ask } = setup({
    repository: {
      messages: async () => rows,
      currentMessages: async () => rows,
    },
  });
  const result = await ask(userId, summary);
  assert.equal(result.sources.length, 12);
  assert.match(result.coverage, /Limited/);
  assert.equal(result.sources[0].number, 1);
});
for (const providerFails of [false, true]) {
  test(`revoked membership blocks responses even when model failure is ${providerFails}`, async () => {
    let reads = 0;
    const { ask } = setup({
      repository: {
        conversations: async () => (++reads === 1 ? [conversation] : []),
      },
      ...(providerFails
        ? {
            providers: {
              generate: async () => {
                throw new AppError("Unavailable", 502);
              },
            },
          }
        : {}),
    });
    await assert.rejects(ask(userId, summary), { statusCode: 409 });
  });
}
test("messages deleted or edited while AI is answering are not returned", async () => {
  for (const rows of [[], [{ ...message, content: "Updated text" }]]) {
    const { ask } = setup({
      repository: { currentMessages: async () => rows },
    });
    await assert.rejects(ask(userId, summary), { statusCode: 409 });
  }
});
test("provider errors never echo upstream secrets", async () => {
  const providers = createProviders(
    { GEMINI_API_KEY: "secret", GEMINI_MODEL: "test" },
    async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: "secret" }),
    }),
  );
  await assert.rejects(
    providers.generate("test", {}),
    (error) => error.statusCode === 502 && !error.message.includes("secret"),
  );
});
test("Gemini adapter uses the server key header and parses text while ignoring thoughts", async () => {
  const providers = createProviders(
    { GEMINI_API_KEY: "secret", GEMINI_MODEL: "test" },
    async (url, options) => {
      assert.equal(url.includes("secret"), false);
      assert.equal(options.headers["x-goog-api-key"], "secret");
      assert.equal(
        JSON.parse(options.body).generationConfig.responseMimeType,
        "application/json",
      );
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: {
                parts: [
                  { text: "internal", thought: true },
                  { text: '{"terms":["React"]}' },
                ],
              },
            },
          ],
        }),
      };
    },
  );
  assert.equal(
    await providers.generate("test", {}, true),
    '{"terms":["React"]}',
  );
});
test("Tavily filters unsafe URLs, limits snippets, and uses basic search credits", async () => {
  const providers = createProviders(
    { TAVILY_API_KEY: "secret" },
    async (url, options) => {
      assert.equal(JSON.parse(options.body).search_depth, "basic");
      assert.equal(options.headers.Authorization, "Bearer secret");
      return {
        ok: true,
        json: async () => ({
          results: [
            { url: "javascript:alert(1)" },
            {
              title: "React",
              url: "https://react.dev",
              content: "x".repeat(5000),
            },
          ],
        }),
      };
    },
  );
  const results = await providers.searchWeb("React");
  assert.equal(results.length, 1);
  assert.equal(results[0].excerpt.length, 2500);
  assert.equal(results[0].number, 1);
});

test("HTTP endpoints require authentication, validate input and enforce per-user rate limits", async (t) => {
  const oldSecret = ENV.JWT_SECRET;
  ENV.JWT_SECRET = "assistant-test-secret";
  t.after(() => { ENV.JWT_SECRET = oldSecret; });
  t.mock.method(User, "findById", () => ({ select: async () => ({ _id: userId }) }));
  const app = express();
  app.use(express.json(), cookieParser());
  app.use("/assistant", assistantRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/assistant`;
  const unauthenticated = await fetch(`${base}/status`);
  assert.equal(unauthenticated.status, 401);
  const headers = { Cookie: `jwt=${jwt.sign({ userId }, ENV.JWT_SECRET)}`, "Content-Type": "application/json" };
  const status = await fetch(`${base}/status`, { headers });
  assert.equal(status.status, 200);
  assert.equal(status.headers.get("cache-control"), "no-store");
  assert.deepEqual(Object.keys(await status.json()).sort(), ["ai", "web"]);
  for (let index = 0; index < 6; index++) {
    const response = await fetch(`${base}/ask`, { method: "POST", headers, body: JSON.stringify({ mode: "web", query: "React", conversationId }) });
    assert.equal(response.status, 400);
    await response.text();
  }
  const limited = await fetch(`${base}/ask`, { method: "POST", headers, body: JSON.stringify({ mode: "web", query: "React" }) });
  assert.equal(limited.status, 429);
  await limited.text();
});
