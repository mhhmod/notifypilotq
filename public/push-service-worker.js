self.addEventListener("push", function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }

  var title = payload.title || "Aurela Studio";
  var options = {
    body: payload.body || "A new update is available.",
    icon: payload.icon || "/icon.png",
    image: payload.image,
    badge: payload.icon || "/icon.png",
    data: {
      clickUrl: payload.clickUrl || "https://aurelastudio.com",
      campaignId: payload.campaignId,
      subscriberId: payload.subscriberId
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var data = event.notification.data || {};
  var clickUrl = data.clickUrl || "https://aurelastudio.com";

  event.waitUntil(
    Promise.allSettled([
      fetch("/api/push/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: data.campaignId,
          subscriberId: data.subscriberId,
          clickUrl: clickUrl
        })
      }),
      clients.openWindow(clickUrl)
    ])
  );
});
