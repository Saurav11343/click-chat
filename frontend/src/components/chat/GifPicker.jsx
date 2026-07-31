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
import { useMessageStore } from "@/store/useMessageStore";

export function GifPicker({ conversationId, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const isSendingGif = useMessageStore((state) => state.isSendingGif);
  const sendGif = useMessageStore((state) => state.sendGif);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const timeout = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetchGiphyGifs({ query: query.trim() });

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
  }, [isOpen, query]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetchGiphyGifs({
        query: query.trim(),
        offset: Number(nextCursor) || 0,
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
    const wasSent = await sendGif({
      conversationId,
      gif,
    });

    if (wasSent) {
      setIsOpen(false);
      setQuery("");
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
            Search GIPHY or choose a trending GIF.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 50))}
            placeholder="Search GIFs"
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
                  disabled={isSendingGif}
                  onClick={() => handleSelectGif(gif)}
                  className="group relative overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
                  aria-label={`Send ${gif.description || "GIF"}`}
                >
                  <img
                    src={gif.previewUrl}
                    alt={gif.description || "GIF"}
                    loading="lazy"
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
              disabled={isLoadingMore || isSendingGif}
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

async function fetchGiphyGifs({ query = "", offset = 0, limit = 20 }) {
  const apiKey = import.meta.env.VITE_GIPHY_API_KEY;

  if (!apiKey) {
    throw new Error("GIF search is not configured.");
  }

  const endpoint = query
    ? "https://api.giphy.com/v1/gifs/search"
    : "https://api.giphy.com/v1/gifs/trending";
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
  const gifs = (payload.data || []).map(normalizeGiphyGif).filter(Boolean);
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

function normalizeGiphyGif(result) {
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
    url: display.url,
    previewUrl: preview.url,
    width: Math.max(1, Number(display.width) || 1),
    height: Math.max(1, Number(display.height) || 1),
    description: result.title || result.alt_text || "GIF",
  };
}
