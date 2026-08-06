export function TypingIndicator({ typingUser, isGroup = false }) {
  if (!typingUser) {
    return null;
  }

  return (
    <div
      className="flex justify-start"
      role="status"
      aria-label={`${typingUser.firstName || "Someone"} is typing`}
    >
      <div className="message-bubble-received rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm ring-1 ring-foreground/8">
        {isGroup && (
          <p className="mb-1.5 max-w-40 truncate text-[11px] font-medium text-primary">
            {typingUser.firstName || "Someone"}
          </p>
        )}

        <div className="flex h-4 items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 animate-bounce rounded-full bg-muted-foreground/65 motion-reduce:animate-pulse"
              style={{ animationDelay: `${dot * 140}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
