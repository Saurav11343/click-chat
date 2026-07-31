import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

let googleScriptPromise;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );

      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}

export function GoogleSignInButton({ onCredential }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return;
    }

    let active = true;
    let resizeObserver;

    loadGoogleIdentityScript()
      .then(() => {
        if (!active || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => callbackRef.current(credential),
          cancel_on_tap_outside: true,
        });

        const renderButton = () => {
          if (!active || !containerRef.current) return;

          const width = Math.min(containerRef.current.clientWidth, 400);

          if (!width) return;

          containerRef.current.replaceChildren();
          window.google.accounts.id.renderButton(containerRef.current, {
            type: "standard",
            theme: resolvedTheme === "dark" ? "filled_black" : "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width,
          });
        };

        renderButton();
        resizeObserver = new ResizeObserver(renderButton);
        resizeObserver.observe(containerRef.current);
      })
      .catch(() => {
        toast.error("Unable to load Google sign-in.");
      });

    return () => {
      active = false;
      resizeObserver?.disconnect();
    };
  }, [resolvedTheme]);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google sign-in requires VITE_GOOGLE_CLIENT_ID.
      </p>
    );
  }

  return (
    <div className="rounded-2xl bg-muted/35 p-2 ring-1 ring-foreground/6">
      <div
        ref={containerRef}
        className="flex min-h-10 w-full justify-center overflow-hidden rounded-xl"
      />
    </div>
  );
}

export function GoogleAuthSection({ onCredential }) {
  return (
    <div className="mb-5">
      <GoogleSignInButton onCredential={onCredential} />

      <div className="mt-5 flex items-center gap-3" role="separator">
        <span className="h-px flex-1 bg-border/80" />
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Or continue with email
        </span>
        <span className="h-px flex-1 bg-border/80" />
      </div>
    </div>
  );
}
