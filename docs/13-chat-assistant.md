# ClickChat Assistant

Open **Ask ClickChat Assistant** in the conversation list or the sparkle button in a chat header. The dialog works on desktop and mobile.

## Modes

- **Summarize:** select a conversation and a period (all time, last 24 hours, 7 days, or 30 days). Ask for key points, decisions, or action items.
- **Search chats:** ask a question across your conversations or select one conversation. Gemini extracts up to six search terms; MongoDB searches message text and attachment names, and Gemini answers from the matches. This is keyword retrieval assisted by AI, not embedding/vector search. Previous questions in the current dialog help interpret follow-ups.
- **Search web:** Tavily returns up to five results, and Gemini writes an answer with numbered citations. Result cards show titles, URLs, and snippets directly in the dialog. The original website opens in a new tab. Each web query is independent and includes neither private messages nor previous chat questions.

Click a numbered citation or source card to open its website or original chat message. Chat navigation loads older pages if necessary and highlights the message. A missing/deleted source displays an error. Switching modes, conversation, or period clears the assistant transcript; closing the assistant also ends that session. The transcript is not stored in MongoDB or browser storage.

## Configuration

Add these variables to `backend/.env` for local development and to the backend host's environment for deployment. Never add them to Vite/frontend environment variables.

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.5-flash-lite
TAVILY_API_KEY=your_key
```

`GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash-lite`. Restart the backend after setting variables. Both keys were tested with synthetic inputs during implementation. Provider availability and free-tier quotas can change; the model must support `generateContent` and JSON output in your account.

The Gemini adapter uses Google's REST `generateContent` API; Tavily uses basic search with no raw-page downloads. No additional npm dependencies are required.

## API

Both endpoints require the existing authenticated JWT cookie and return `Cache-Control: no-store`.

- `GET /api/assistant/status`: returns `{ ai: boolean, web: boolean }`, indicating whether keys are configured (not a provider health check).
- `POST /api/assistant/ask`: accepts `mode` (`summary`, `chats`, or `web`), `query` (1–1,000 characters), optional `conversationId`, optional ISO UTC `since`, and up to four prior question strings in `history`. Summaries require a conversation ID. Web requests reject conversation IDs, periods, and nonempty history.

Successful answers contain `answer`, `sources`, `coverage`, and optionally `warning`. Each source has a numbered reference, kind, title and excerpt. Chat sources include message/conversation IDs, sender and timestamp; web sources include a safe HTTP(S) URL. Empty results return a useful answer with no sources. If answer generation fails, retrieved sources are still returned with a warning. Search planning failures fall back to simple keywords. Invalid requests return 400; missing authentication 401; inaccessible conversations 404; source/access changes during generation 409; quota limits 429; provider failures 502; missing configuration 503.

## Privacy and limits

- MongoDB retrieval is scoped to the authenticated user's current memberships. Deleted messages are excluded. Membership and source contents are checked again before returning an answer, including when generation failed.
- Only selected text/captions, attachment filenames and source metadata go to Gemini. No attachment contents, passwords, emails, access tokens, or other profile fields are fetched for the assistant. Gemini's free-tier data policy may allow submitted data to improve Google products; the dialog discloses this.
- Web search receives the user's current explicit query only. The model has no database tools, arbitrary URLs to fetch, or ability to send messages. Retrieved content is treated as untrusted evidence. UI output is rendered as text, never HTML.
- Summaries cover at most the latest 200 messages and 60,000 source-text characters. Search returns at most the latest 30 matches within the same character budget. The UI reports truncation; select a narrower period or question for detail. These are bounded summaries, not guaranteed full-history summaries.
- The API allows six requests per minute and 60 per day per authenticated user, shared across modes. These counters are in memory, reset on restart and apply per server instance. They are abuse protection, not a persistent billing cap. Provider quotas apply across all app users. A chat-search request normally uses two Gemini calls; summary/web requests use one.
- Provider calls time out after 35 seconds. No automatic paid upgrades or alternate paid-model fallbacks are used. Secrets and raw upstream error payloads are never returned to the browser.

## Verification

```bash
cd backend
npm run test:assistant
npm run assistant:check
cd ../frontend
npm run lint
npm run build
```

The provider check sends only a synthetic greeting and a public React documentation query. It consumes a small amount of provider quota. To test just a model: `npm run assistant:check -- --gemini-only --model=gemini-3.5-flash-lite`.

For a UI fixture without an account or private messages, start Vite and visit `/tests/assistant-preview.html`. It mocks responses locally and is excluded from the production build. Try all modes, source navigation, narrow viewports, and the query `error` for a simulated quota failure. Automated backend tests use synthetic repositories and mocked providers; a live MongoDB end-to-end user session is a separate deployment acceptance check.

Provider references: [Gemini generation API](https://ai.google.dev/api/generate-content), [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search).
