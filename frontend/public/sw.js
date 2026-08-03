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
    tag: data.conversationId
      ? `conversation-${data.conversationId}`
      : "clickchat-message",
    data: {
      conversationId: data.conversationId || null,
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
  const targetUrl = conversationId
    ? `/chat?conversation=${encodeURIComponent(conversationId)}`
    : "/chat";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        for (const client of windowClients) {
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
