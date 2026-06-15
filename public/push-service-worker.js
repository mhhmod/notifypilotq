self.addEventListener("push", function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }

  var title = payload.title || "Store update";
  var fallbackUrl = self.location && self.location.origin ? self.location.origin : "/";
  var options = {
    body: payload.body || "A new update is available.",
    icon: payload.icon || "/icon.png",
    image: payload.image,
    badge: payload.icon || "/icon.png",
    data: {
      clickUrl: payload.clickUrl || fallbackUrl,
      campaignId: payload.campaignId,
      subscriberId: payload.subscriberId
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var data = event.notification.data || {};
  var clickUrl = data.clickUrl || (self.location && self.location.origin ? self.location.origin : "/");

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



