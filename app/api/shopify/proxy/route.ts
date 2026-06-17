import { NextRequest, NextResponse } from "next/server";
import { publicEnv, serverEnv } from "@/lib/config/env";
import { getSettingsFromData, getTenant } from "@/lib/data/supabase-repository";

const DEFAULT_APP_ICON = `${publicEnv.appUrl.replace(/\/$/, "")}/sn2-ios-icon-512.png`;

function buildServiceWorker(iconUrl: string) {
  return `
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
    icon: payload.icon || ${JSON.stringify(iconUrl)} || undefined,
    image: payload.image,
    badge: ${JSON.stringify(iconUrl)} || undefined,
    requireInteraction: true,
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
}

export async function GET(request: NextRequest) {
  const asset = request.nextUrl.searchParams.get("asset");

  const tenant = await getTenant();
  let storeName = tenant.tenantSlug;
  let storeUrl = serverEnv.shopifyPublicStoreUrl || tenant.storeUrl;
  let iconUrl = DEFAULT_APP_ICON;
  try {
    const settings = await getSettingsFromData();
    storeName = settings.brand.storeName || storeName;
    storeUrl = serverEnv.shopifyPublicStoreUrl || settings.brand.storeUrl || tenant.storeUrl;
    iconUrl = DEFAULT_APP_ICON || settings.brand.defaultNotificationIcon || "";
  } catch {
    /* fall back to tenant defaults */
  }

  if (asset === "service-worker") {
    return new NextResponse(buildServiceWorker(iconUrl), {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Service-Worker-Allowed": "/"
      }
    });
  }

  // Web app manifest enables Add-to-Home-Screen (and iOS 16.4+ web push).
  if (asset === "manifest") {
    const iconType = /\.png(\?|$)/i.test(iconUrl)
      ? "image/png"
      : /\.(jpe?g)(\?|$)/i.test(iconUrl)
        ? "image/jpeg"
        : /\.gif(\?|$)/i.test(iconUrl)
          ? "image/gif"
          : /\.svg(\?|$)/i.test(iconUrl)
            ? "image/svg+xml"
            : /\.webp(\?|$)/i.test(iconUrl)
              ? "image/webp"
              : "image/png";
    const manifest = {
      name: storeName,
      short_name: storeName,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000",
      icons: iconUrl ? [{ src: iconUrl, sizes: "any", type: iconType, purpose: "any" }] : []
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
