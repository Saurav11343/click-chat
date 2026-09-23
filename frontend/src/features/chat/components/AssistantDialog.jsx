import { useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, Globe, LoaderCircle, MessageSquare, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { axiosInstance } from "@/shared/api/api-client";

const modes = [
  { id: "summary", label: "Summarize", icon: BookOpen },
  { id: "chats", label: "Search chats", icon: MessageSquare },
  { id: "web", label: "Search web", icon: Globe },
];
const prompts = {
  summary: ["Summarize the key points", "List decisions and action items"],
  chats: ["What deadlines did we discuss?", "Find shared project links"],
  web: ["Find beginner React tutorials", "Find ideas for a weekend project"],
};

const periodStart = (days) => days === "all" ? undefined : new Date(Date.now() - Number(days) * 86400000).toISOString();

function Answer({ text, sources, onSource }) {
  // Render only trusted source references as interactive elements; never render provider HTML.
  return <div className="whitespace-pre-wrap break-words text-sm leading-7">{text.split(/(\[\d+\])/g).map((part, index) => {
    const number = /^\[(\d+)\]$/.exec(part)?.[1];
    const source = number && sources.find((item) => item.number === Number(number));
    return source ? <button key={index} onClick={() => onSource(source)} className="mx-0.5 rounded bg-primary/10 px-1 text-xs font-semibold text-primary hover:underline" aria-label={`Open source ${number}`}>{part}</button> : <span key={index}>{part}</span>;
  })}</div>;
}

export function AssistantDialog({ open, onOpenChange, conversations, initialConversationId, onOpenSource }) {
  const [mode, setMode] = useState("summary");
  const [conversationId, setConversationId] = useState(initialConversationId || "");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState("");
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null);
  const requestRef = useRef(null);
  const scrollRef = useRef(null);
  const latestTurnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    axiosInstance.get("/assistant/status", { signal: controller.signal })
      .then(({ data }) => setStatus(data))
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.response?.data?.message || "Unable to connect to the assistant."); });
    return () => controller.abort();
  }, [open]);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (busy) container.scrollTop = container.scrollHeight;
    else if (latestTurnRef.current) container.scrollTop += latestTurnRef.current.getBoundingClientRect().top - container.getBoundingClientRect().top - 16;
  }, [turns, busy]);

  const reset = () => { requestRef.current?.abort(); requestRef.current = null; setBusy(false); setTurns([]); setError(""); };
  const selectMode = (value) => { reset(); setMode(value); setQuery(""); };
  const selectConversation = (value) => { reset(); setConversationId(value); };
  const missingSetup = status && (!status.ai || (mode === "web" && !status.web));
  const validConversation = conversations.some((item) => item.id === conversationId);
  const disabled = busy || missingSetup || (mode === "summary" && !validConversation);

  const handleSubmit = async (question) => {
    const text = question.trim();
    if (!text || disabled || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true); setError(""); setQuery("");
    const since = periodStart(period);
    try {
      const { data } = await axiosInstance.post("/assistant/ask", {
        mode, query: text,
        ...(mode !== "web" ? {
          ...(validConversation ? { conversationId } : {}),
          ...(since ? { since } : {}),
          history: turns.slice(-4).map((turn) => turn.question),
        } : {}),
      }, { signal: controller.signal, timeout: 100000 });
      if (!controller.signal.aborted) setTurns((current) => [...current, { ...data, question: text, id: crypto.randomUUID() }]);
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure.response?.data?.message || "Unable to get an answer. Please try again.");
        setQuery(text);
      }
    } finally {
      if (requestRef.current === controller) { requestRef.current = null; setBusy(false); }
    }
  };
  const openSource = (source) => {
    if (source.kind === "web") {
      try { if (["https:", "http:"].includes(new URL(source.url).protocol)) window.open(source.url, "_blank", "noopener,noreferrer"); } catch { /* Ignore invalid URLs. */ }
    } else { onOpenChange(false); onOpenSource(source.conversationId, source.messageId); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[min(780px,90dvh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
      <DialogHeader className="shrink-0 border-b p-5 pr-12">
        <DialogTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /> ClickChat Assistant</DialogTitle>
        <DialogDescription>Catch up on conversations or explore the web.</DialogDescription>
      </DialogHeader>
      <div className="shrink-0 space-y-3 border-b p-4">
        <div className="flex gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Assistant mode">
          {modes.map(({ id, label, icon: Icon }) => <Button key={id} variant={mode === id ? "secondary" : "ghost"} className="min-w-0 flex-1 gap-1.5 px-2 text-xs sm:text-sm" aria-pressed={mode === id} onClick={() => selectMode(id)}><Icon className="size-4" />{label}</Button>)}
        </div>
        {mode !== "web" && <div className="flex flex-wrap gap-2">
          <label className="min-w-0 flex-1 text-xs text-muted-foreground">Conversation
            <select aria-label="Conversation scope" value={validConversation ? conversationId : ""} onChange={(event) => selectConversation(event.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2 text-sm text-foreground">
              <option value="">{mode === "summary" ? "Choose a conversation" : "All my conversations"}</option>
              {conversations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">Period
            <select aria-label="Message period" value={period} onChange={(event) => { reset(); setPeriod(event.target.value); }} className="mt-1 block rounded-lg border bg-background p-2 text-sm text-foreground">
              <option value="all">All time</option><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
            </select>
          </label>
        </div>}
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 [overflow-anchor:none] sm:p-5" role="log" aria-label="Assistant conversation" aria-live="polite">
        {!turns.length && <div className="space-y-4 py-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-6" /></div>
          <p className="font-medium">{mode === "web" ? "Discover something new" : mode === "summary" ? "Get up to speed" : "Find what was said"}</p>
          <p className="mx-auto max-w-sm text-xs leading-5 text-muted-foreground">{mode === "web" ? "Read search results and an AI answer here. Each web question is searched independently; private chats are never attached." : "Only conversations you belong to are searched. Selected messages are sent to Gemini, whose free tier may use data to improve Google products. Attachment contents are not read."}</p>
          <div className="flex flex-wrap justify-center gap-2">{prompts[mode].map((prompt) => <Button key={prompt} variant="outline" size="sm" className="h-auto whitespace-normal py-2" disabled={disabled} onClick={() => handleSubmit(prompt)}>{prompt}</Button>)}</div>
        </div>}
        {turns.map((turn, index) => <article key={turn.id} ref={index === turns.length - 1 ? latestTurnRef : undefined} className="space-y-3">
          <div className="ml-8 rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground">{turn.question}</div>
          <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
            <Answer text={turn.answer} sources={turn.sources} onSource={openSource} />
            {turn.warning && <p className="text-xs text-destructive" role="status">{turn.warning}</p>}
            <p className="text-xs leading-5 text-muted-foreground">{turn.coverage}</p>
            {turn.sources.length > 0 && <details open={mode === "web"}>
              <summary className="cursor-pointer text-xs font-medium text-primary">Sources ({turn.sources.length})</summary>
              <div className="mt-3 grid gap-2">
                {turn.sources.map((source) => <button key={source.number} onClick={() => openSource(source)} className="min-w-0 rounded-xl border bg-background p-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <p className="break-words text-sm font-medium">[{source.number}] {source.title}</p>
                  <p className="mt-1 truncate text-xs text-primary">{source.kind === "web" ? source.url : `${source.sender} · ${new Date(source.date).toLocaleString()}`}</p>
                  <p className="mt-2 line-clamp-3 break-words text-xs leading-5 text-muted-foreground">{source.excerpt}</p>
                  <span className="mt-2 block text-xs text-primary">{source.kind === "web" ? "Visit website ↗" : "Open original message →"}</span>
                </button>)}
              </div>
            </details>}
          </div>
        </article>)}
        {busy && <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle className="size-4 animate-spin" />{mode === "web" ? "Searching the web…" : "Reading relevant messages…"}</p>}
      </div>
      <div className="shrink-0 space-y-2 border-t bg-background p-4">
        {missingSetup && <p className="text-xs text-destructive">The server needs {status.ai ? "TAVILY_API_KEY" : "GEMINI_API_KEY"} configured. Restart the backend after adding the key.</p>}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <form className="flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); handleSubmit(query); }}>
          <Button type="button" variant="ghost" size="icon" aria-label="Clear assistant conversation" onClick={reset}><Trash2 className="size-4" /></Button>
          <textarea value={query} onChange={(event) => setQuery(event.target.value)} maxLength={1000} rows={2} disabled={busy} aria-label="Ask the assistant" placeholder={mode === "summary" ? "What would you like summarized?" : mode === "web" ? "Search the web…" : "Ask a question or search for a topic…"} className="min-w-0 flex-1 resize-none rounded-xl border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); handleSubmit(query); } }} />
          <Button type="submit" size="icon" disabled={disabled || !query.trim()} aria-label="Send question">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}</Button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground">AI can make mistakes. Check the sources. Free-tier usage limits apply.</p>
      </div>
    </DialogContent>
  </Dialog>;
}
