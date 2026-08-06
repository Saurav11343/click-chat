import { axiosInstance } from "@/shared/api/api-client";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((character) => character.charCodeAt(0)),
  );
};

export const registerPushServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) return null;

  const registration = await navigator.serviceWorker.register("/sw.js", {
    updateViaCache: "none",
  });

  void registration.update().catch(() => {});
  return registration;
};

export const subscribeToPushNotifications = async () => {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await registerPushServiceWorker();

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      throw new Error("The VAPID public key is missing.");
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await axiosInstance.post("/user/push-subscriptions", subscription.toJSON());

  return subscription;
};

export const getPushNotificationState = async () => {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();

  return {
    supported: true,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
  };
};

export const unsubscribeFromPushNotifications = async () => {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  await axiosInstance.delete("/user/push-subscriptions", {
    data: { endpoint: subscription.endpoint },
  });
  await subscription.unsubscribe();

  return true;
};
