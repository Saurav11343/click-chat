import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMessageStore } from "@/features/chat/store/useMessageStore";

export function GiphyPicker({ conversationId, disabled, replyTo = null, onSent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaType, setMediaType] = useState("gif");
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const isSendingExternalMedia = useMessageStore(
    (state) => state.isSendingExternalMedia,
  );
  const sendExternalMedia = useMessageStore(
    (state) => state.sendExternalMedia,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const timeout = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetchGiphyMedia({
          query: query.trim(),
          mediaType,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setGifs(response.gifs);
        setNextCursor(response.nextCursor);
      } catch (error) {
        if (requestId === requestIdRef.current) {
          setGifs([]);
          setNextCursor(null);
          toast.error(error.message || "Unable to load GIFs.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, query.trim() ? 400 : 0);

    return () => clearTimeout(timeout);
  }, [isOpen, query, mediaType]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetchGiphyMedia({
        query: query.trim(),
        offset: Number(nextCursor) || 0,
        mediaType,
      });

      setGifs((current) => [
        ...current,
        ...response.gifs.filter(
          (gif) => !current.some((item) => item.providerId === gif.providerId),
        ),
      ]);
      setNextCursor(response.nextCursor);
    } catch (error) {
      toast.error(error.message || "Unable to load more GIFs.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSelectGif = async (gif) => {
    registerGiphyAction(gif.analytics?.onclick);

    const wasSent = await sendExternalMedia({
      conversationId,
      media: gif,
      replyTo,
    });

    if (wasSent) {
      registerGiphyAction(gif.analytics?.onsent);
      setIsOpen(false);
      setQuery("");
      onSent?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled || !conversationId}
          className="h-10 rounded-xl px-2 text-xs font-bold"
          aria-label="Open GIF picker"
        >
          GIF
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[min(680px,85dvh)] w-full max-w-2xl grid-rows-[auto_auto_minmax(0,1fr)_auto] flex-col gap-3 overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>Choose a GIF</DialogTitle>
          <DialogDescription>
            Search GIPHY for GIFs and transparent stickers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
          {[
            ["gif", "GIFs"],
            ["sticker", "Stickers"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMediaType(value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mediaType === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 50))}
            placeholder={mediaType === "sticker" ? "Search stickers" : "Search GIFs"}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 9 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-video animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground">
              No GIFs found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gifs.map((gif) => (
                <button
                  key={gif.providerId}
                  type="button"
                  disabled={isSendingExternalMedia}
                  onClick={() => handleSelectGif(gif)}
                  className="group relative overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
                  aria-label={`Send ${gif.description || "GIF"}`}
                >
                  <img
                    src={gif.previewUrl}
                    alt={gif.description || "GIF"}
                    loading="lazy"
                    onLoad={() => registerGiphyAction(gif.analytics?.onload)}
                    className="size-full object-cover transition-transform group-hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          )}

          {nextCursor && !isLoading && (
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingMore || isSendingExternalMedia}
              onClick={handleLoadMore}
              className="mt-3 w-full"
            >
              {isLoadingMore && <LoaderCircle className="size-4 animate-spin" />}
              Load more
            </Button>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Powered by GIPHY
        </p>
      </DialogContent>
    </Dialog>
  );
}

async function fetchGiphyMedia({
  query = "",
  offset = 0,
  limit = 20,
  mediaType = "gif",
}) {
  const apiKey = import.meta.env.VITE_GIPHY_API_KEY;

  if (!apiKey) {
    throw new Error("GIF search is not configured.");
  }

  const resource = mediaType === "sticker" ? "stickers" : "gifs";
  const endpoint = query
    ? `https://api.giphy.com/v1/${resource}/search`
    : `https://api.giphy.com/v1/${resource}/trending`;
  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    api_key: apiKey,
    ...(query ? { q: query, lang: "en" } : {}),
    limit: String(limit),
    offset: String(offset),
    rating: "pg",
    country_code: "IN",
    bundle: "messaging_non_clips",
    remove_low_contrast: "true",
  }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("GIPHY could not load GIFs.");
  }

  const payload = await response.json();
  const gifs = (payload.data || [])
    .map((result) => normalizeGiphyMedia(result, mediaType))
    .filter(Boolean);
  const count = Number(payload.pagination?.count) || 0;
  const totalCount = Number(payload.pagination?.total_count) || 0;
  const nextOffset = offset + count;
  const maximumOffset = query ? 4999 : 499;
  const hasMore =
    count > 0 && nextOffset < totalCount && nextOffset <= maximumOffset;

  return {
    gifs,
    nextCursor: hasMore ? String(nextOffset) : null,
  };
}

function normalizeGiphyMedia(result, mediaType) {
  const display =
    result.images?.fixed_width ||
    result.images?.downsized ||
    result.images?.original;
  const preview = result.images?.fixed_width_small || display;

  if (!display?.url || !preview?.url) {
    return null;
  }

  return {
    providerId: String(result.id),
    mediaType,
    url: display.url,
    previewUrl: preview.url,
    width: Math.max(1, Number(display.width) || 1),
    height: Math.max(1, Number(display.height) || 1),
    description: result.title || result.alt_text || "GIF",
    analytics: {
      onload: result.analytics?.onload?.url || null,
      onclick: result.analytics?.onclick?.url || null,
      onsent: result.analytics?.onsent?.url || null,
    },
  };
}

function registerGiphyAction(url) {
  if (!url || !url.startsWith("https://giphy-analytics.giphy.com/")) {
    return;
  }

  void fetch(url, {
    method: "GET",
    mode: "no-cors",
    keepalive: true,
  }).catch(() => {});
}
