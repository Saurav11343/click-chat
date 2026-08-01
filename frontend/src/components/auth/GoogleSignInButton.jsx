import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";

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
  const isNativeAndroid = Capacitor.getPlatform() === "android";

  if (isNativeAndroid) {
    return <NativeGoogleSignInButton onCredential={onCredential} />;
  }

  return <WebGoogleSignInButton onCredential={onCredential} />;
}

function NativeGoogleSignInButton({ onCredential }) {
  const [isReady, setIsReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let active = true;

    if (!clientId) return undefined;

    GoogleSignIn.initialize({ clientId })
      .then(() => {
        if (active) setIsReady(true);
      })
      .catch(() => {
        if (active) {
          toast.error("Google sign-in is not configured for this Android app.");
        }
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  if (!clientId) {
    return <MissingGoogleClientId />;
  }

  const handleSignIn = async () => {
    if (!isReady || isSigningIn) return;

    setIsSigningIn(true);

    try {
      const result = await GoogleSignIn.signIn();

      if (!result.idToken) {
        throw new Error("Google did not return an ID token.");
      }

      await onCredential(result.idToken);
    } catch (error) {
      if (error?.code !== "SIGN_IN_CANCELED") {
        toast.error(error?.message || "Unable to sign in with Google.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="rounded-2xl bg-muted/35 p-2 ring-1 ring-foreground/6">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={!isReady || isSigningIn}
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
      >
        <GoogleMark />
        {isSigningIn
          ? "Opening Google…"
          : isReady
            ? "Continue with Google"
            : "Preparing Google sign-in…"}
      </button>
    </div>
  );
}

function WebGoogleSignInButton({ onCredential }) {
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
    return <MissingGoogleClientId />;
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

function MissingGoogleClientId() {
  return (
    <p className="text-center text-xs text-muted-foreground">
      Google sign-in requires VITE_GOOGLE_CLIENT_ID.
    </p>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.35l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.77-5.62-4.14H3.03v2.63A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.38 13.92A6.02 6.02 0 0 1 6.06 12c0-.67.12-1.32.32-1.92V7.45H3.03A10 10 0 0 0 2 12c0 1.61.38 3.14 1.03 4.55l3.35-2.63Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.78.5 3.82 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.97 5.45l3.35 2.63C7.17 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
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
