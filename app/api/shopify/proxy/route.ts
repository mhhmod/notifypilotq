import { NextRequest, NextResponse } from "next/server";
import { publicEnv, serverEnv } from "@/lib/config/env";
import { getSettingsFromData, getTenant } from "@/lib/data/supabase-repository";

const serviceWorkerSource = `
self.addEventListener("install", function() {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

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
  let storeName = tenant.tenantSlug;
  let storeUrl = serverEnv.shopifyPublicStoreUrl || tenant.storeUrl;
  let iconUrl = "";
  try {
    const settings = await getSettingsFromData();
    storeName = settings.brand.storeName || storeName;
    storeUrl = serverEnv.shopifyPublicStoreUrl || settings.brand.storeUrl || tenant.storeUrl;
    iconUrl = settings.brand.defaultNotificationIcon || "";
  } catch {
    /* fall back to tenant defaults */
  }

  // Web app manifest enables Add-to-Home-Screen (and iOS 16.4+ web push).
  // Served same-origin via the App Proxy so the storefront can reference it.
  if (request.nextUrl.searchParams.get("asset") === "manifest") {
    const manifest = {
      name: storeName,
      short_name: storeName,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000",
      icons: iconUrl
        ? [
            { src: iconUrl, sizes: "192x192", type: "image/png", purpose: "any" },
            { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" }
          ]
        : []
    };
    return new NextResponse(JSON.stringify(manifest), {
      headers: { "Content-Type": "application/manifest+json; charset=utf-8" }
    });
  }

  return NextResponse.json({
    ok: true,
    platform: "NotifyPilot",
    tenantSlug: tenant.tenantSlug,
    storeName,
    storeUrl,
    iconUrl,
    appUrl: publicEnv.appUrl,
    subscribeUrl: `${publicEnv.appUrl}/api/push/subscribe`,
    serviceWorkerPath: `${serverEnv.shopifyAppProxyPath}?asset=service-worker`,
    manifestPath: `${serverEnv.shopifyAppProxyPath}?asset=manifest`,
    vapidPublicKey: publicEnv.vapidPublicKey ?? ""
  });
}
