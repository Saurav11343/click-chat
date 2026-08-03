import webpush from "web-push";

import ENV from "./env.js";

export const isWebPushConfigured = Boolean(
  ENV.VAPID_EMAIL && ENV.VAPID_PUBLIC_KEY && ENV.VAPID_PRIVATE_KEY,
);

if (isWebPushConfigured) {
  webpush.setVapidDetails(
    ENV.VAPID_EMAIL,
    ENV.VAPID_PUBLIC_KEY,
    ENV.VAPID_PRIVATE_KEY,
  );
}

export default webpush;
