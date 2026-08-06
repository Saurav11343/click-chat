self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data?.json() || {};
  } catch {
    data = {
      body: event.data?.text() || "You have a new message.",
    };
  }

  const options = {
    body: data.body || "You have a new message.",
    icon: "/clickchat.png",
    badge: "/clickchat.png",
    tag: data.messageId
      ? `message-${data.messageId}`
      : `clickchat-message-${Date.now()}`,
    timestamp: Number(data.timestamp) || Date.now(),
    renotify: false,
    silent: false,
    actions: [{ action: "open", title: "Open chat" }],
    data: {
      conversationId: data.conversationId || null,
      messageId: data.messageId || null,
      url: data.url || null,
    },
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const hasVisibleClickChatWindow = windowClients.some(
          (client) => client.visibilityState === "visible",
        );

        if (hasVisibleClickChatWindow) {
          return undefined;
        }

        return self.registration.showNotification(
          data.title || "ClickChat",
          options,
        );
      }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const conversationId = event.notification.data?.conversationId;
  const targetUrl = event.notification.data?.url || (conversationId
    ? `/chat?conversation=${encodeURIComponent(conversationId)}`
    : "/chat");

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        const orderedClients = [...windowClients].sort(
          (first, second) =>
            Number(second.visibilityState === "visible") -
            Number(first.visibilityState === "visible"),
        );

        for (const client of orderedClients) {
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          }

          if ("focus" in client) {
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
