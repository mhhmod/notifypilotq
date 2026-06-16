import { NextRequest, NextResponse } from "next/server";
import { publicEnv, serverEnv } from "@/lib/config/env";
import { getTenant } from "@/lib/data/supabase-repository";

const serviceWorkerSource = `
self.addEventListener("push", function(event) {
  var payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) { payload = {}; }
  var title = payload.title || "Store update";
  var options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    image: payload.image,
    data: {
      clickUrl: payload.clickUrl || payload.url || "/",
      trackingUrl: payload.trackingUrl
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var data = event.notification.data || {};
  var clickUrl = data.clickUrl || "/";
  var tasks = [];
  if (data.trackingUrl) {
    tasks.push(fetch(data.trackingUrl, { method: "POST", mode: "no-cors", keepalive: true }).catch(function() {}));
  }
  tasks.push(clients.openWindow(clickUrl));
  event.waitUntil(Promise.all(tasks));
});
`;

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("asset") === "service-worker") {
    return new NextResponse(serviceWorkerSource, {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Service-Worker-Allowed": "/"
      }
    });
  }

  const tenant = await getTenant();
  return NextResponse.json({
    ok: true,
    platform: "NotifyPilot",
    tenantSlug: tenant.tenantSlug,
    storeUrl: serverEnv.shopifyPublicStoreUrl || tenant.storeUrl,
    appUrl: publicEnv.appUrl,
    subscribeUrl: `${publicEnv.appUrl}/api/push/subscribe`,
    serviceWorkerPath: `${serverEnv.shopifyAppProxyPath}?asset=service-worker`,
    vapidPublicKey: publicEnv.vapidPublicKey ?? ""
  });
}
