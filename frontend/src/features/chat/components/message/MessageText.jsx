import { useState } from "react";
import { Play } from "lucide-react";

export function MessageText({ content }) {
  const parts = splitTextAndUrls(content);

  return (
    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed sm:text-sm">
      {parts.map((part, index) =>
        part.isUrl ? (
          <a
            key={`${part.value}-${index}`}
            href={part.value}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline decoration-current/60 underline-offset-2 hover:opacity-80"
          >
            {part.value}
          </a>
        ) : (
          <span key={`${part.value}-${index}`}>{part.value}</span>
        ),
      )}
    </p>
  );
}

export function YouTubePreview({ content }) {
  const youtubeLink = findYouTubeLink(content);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  if (!youtubeLink) return null;

  return (
    <a
      href={youtubeLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block w-full min-w-60 max-w-sm overflow-hidden rounded-xl border border-current/15 bg-black text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Watch video on YouTube"
    >
      <div className="relative aspect-video w-full bg-zinc-900">
        {!thumbnailFailed && (
          <img
            src={`https://i.ytimg.com/vi/${youtubeLink.videoId}/hqdefault.jpg`}
            alt="YouTube video preview"
            loading="lazy"
            onError={() => setThumbnailFailed(true)}
            className="size-full object-cover"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/10">
          <span className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Play className="size-4 shrink-0 fill-red-500 text-red-500" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">YouTube video</p>
          <p className="text-xs text-zinc-400">Watch on YouTube</p>
        </div>
      </div>
    </a>
  );
}

function splitTextAndUrls(content) {
  const urlPattern = /(https?:\/\/[^\s<>]+)/gi;

  return String(content)
    .split(urlPattern)
    .filter(Boolean)
    .map((value) => ({ value, isUrl: /^https?:\/\//i.test(value) }));
}

function findYouTubeLink(content) {
  const urlMatches = String(content).match(/https?:\/\/[^\s<>]+/gi) || [];

  for (const rawUrl of urlMatches) {
    const cleanedUrl = rawUrl.replace(/[),.!?;:]+$/, "");
    const videoId = getYouTubeVideoId(cleanedUrl);

    if (videoId) return { videoId, url: cleanedUrl };
  }

  return null;
}

function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = null;

    if (hostname === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0];
    } else if (
      [
        "youtube.com",
        "m.youtube.com",
        "music.youtube.com",
        "youtube-nocookie.com",
      ].includes(hostname)
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        const pathParts = url.pathname.split("/").filter(Boolean);
        if (["shorts", "embed", "live"].includes(pathParts[0])) {
          videoId = pathParts[1];
        }
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId || "") ? videoId : null;
  } catch {
    return null;
  }
}

