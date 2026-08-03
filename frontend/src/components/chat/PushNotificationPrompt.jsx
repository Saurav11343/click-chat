import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  getPushNotificationState,
  subscribeToPushNotifications,
} from "@/lib/pushNotifications";
import { useAuthStore } from "@/store/useAuthStore";

const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000;

export function PushNotificationPrompt() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.authUser?._id);
  const [pushState, setPushState] = useState(null);
  const [isEnabling, setIsEnabling] = useState(false);

  const dismissalKey = userId
    ? `clickchat:push-prompt-dismissed:${userId}`
    : "clickchat:push-prompt-dismissed";

  useEffect(() => {
    let isMounted = true;

    getPushNotificationState()
      .then((state) => {
        if (!isMounted || !state.supported || state.subscribed) {
          return;
        }

        const dismissedAt = Number(localStorage.getItem(dismissalKey) || 0);
        const dismissalIsActive =
          dismissedAt > 0 && Date.now() - dismissedAt < DISMISSAL_DURATION;

        if (!dismissalIsActive) {
          setPushState(state);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [dismissalKey]);

  const dismissPrompt = () => {
    localStorage.setItem(dismissalKey, Date.now().toString());
    setPushState(null);
  };

  const enableNotifications = async () => {
    setIsEnabling(true);

    try {
      await subscribeToPushNotifications();
      localStorage.removeItem(dismissalKey);
      setPushState(null);
      toast.success("Browser notifications enabled.");
    } catch (error) {
      const state = await getPushNotificationState();
      setPushState(state);
      toast.error(error.message || "Unable to enable notifications.");
    } finally {
      setIsEnabling(false);
    }
  };

  if (!pushState) {
    return null;
  }

  const isBlocked = pushState.permission === "denied";

  return (
    <div className="mx-3 mt-3 rounded-2xl border border-primary/15 bg-primary/5 p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isBlocked ? (
            <BellOff className="size-4" />
          ) : (
            <Bell className="size-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {isBlocked ? "Notifications are blocked" : "Never miss a message"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isBlocked
              ? "Allow notifications in your browser's site settings, then enable them from your profile."
              : "Receive alerts when ClickChat is in the background."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-lg"
              onClick={
                isBlocked
                  ? () => navigate("/profile")
                  : enableNotifications
              }
              disabled={isEnabling}
            >
              {isEnabling
                ? "Enabling..."
                : isBlocked
                  ? "View settings"
                  : "Enable notifications"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-lg"
              onClick={dismissPrompt}
            >
              Not now
            </Button>
          </div>
        </div>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="-mr-1 -mt-1 shrink-0 rounded-lg"
          onClick={dismissPrompt}
          aria-label="Dismiss notification prompt"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
