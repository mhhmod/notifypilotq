(function () {
  "use strict";

  var DEFAULT_CONFIG = {
    tenantSlug: "store",
    storeUrl: "",
    apiBaseUrl: "https://notify.grindctrl.cloud",
    configUrl: "/apps/notifypilot",
    vapidPublicKey: "",
    serviceWorkerPath: "/apps/notifypilot?asset=service-worker",
    popupDismissedKey: "notifypilot_push_prompt_dismissed_until",
    registeredKey: "notifypilot_push_registered",
    popupDelaySeconds: 2,
    reShowAfterDismissHours: 72,
    popupTitle: "Get 10% off your order",
    popupBody:
      "Allow notifications to receive your discount code, private drops, restock alerts, and limited-time offers.",
    primaryButtonText: "Unlock 10% Off",
    secondaryButtonText: "Maybe later",
    successTitle: "Your 10% discount is unlocked",
    successBody: "Use this code at checkout:",
    iosTitle: "Get 10% off — add to Home Screen",
    iosBody: "Add this site to your Home Screen to enable notifications and unlock your discount."
  };

  var themeConfig = window.NotifyPilotPushConfig || {};
  var config = Object.assign({}, DEFAULT_CONFIG, themeConfig);
  if (!config.storeUrl) config.storeUrl = window.location.origin;

  /* Fetch live config from the App Proxy (same-origin) so the storefront never
     has to hardcode the VAPID key or tenant slug. Theme-provided values still
     win over the proxy response. Falls back silently to defaults on error. */
  async function loadRemoteConfig() {
    if (!config.configUrl) return;
    try {
      var response = await fetch(config.configUrl, {
        headers: { Accept: "application/json" },
        credentials: "omit"
      });
      if (!response.ok) return;
      var remote = await response.json();
      if (!remote || remote.platform !== "NotifyPilot") return;
      var mapped = {};
      if (remote.vapidPublicKey) mapped.vapidPublicKey = remote.vapidPublicKey;
      if (remote.tenantSlug) mapped.tenantSlug = remote.tenantSlug;
      if (remote.storeUrl) mapped.storeUrl = remote.storeUrl;
      if (remote.appUrl) mapped.apiBaseUrl = remote.appUrl;
      if (remote.serviceWorkerPath) mapped.serviceWorkerPath = remote.serviceWorkerPath;
      config = Object.assign({}, DEFAULT_CONFIG, mapped, themeConfig);
      if (!config.storeUrl) config.storeUrl = window.location.origin;
    } catch (_) {
      /* keep existing config */
    }
  }

  /* ── Styles ─────────────────────────────────────────────────────────── */

  var COLORS = {
    bg: "oklch(0.99 0 0)",
    surface: "oklch(0.96 0 0)",
    border: "oklch(0.88 0 0)",
    ink: "oklch(0.18 0 0)",
    inkDim: "oklch(0.42 0 0)",
    primary: "oklch(0.18 0 0)",
    primaryFg: "oklch(0.99 0 0)",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace"
  };

  var card =
    "border:1px solid " + COLORS.border + ";" +
    "border-radius:12px;" +
    "background:" + COLORS.bg + ";" +
    "box-shadow:0 2px 8px oklch(0 0 0 / 0.06),0 12px 32px oklch(0 0 0 / 0.08);" +
    "padding:16px;";

  var btnPrimary =
    "border:0;border-radius:8px;" +
    "background:" + COLORS.primary + ";" +
    "color:" + COLORS.primaryFg + ";" +
    "font-size:13px;font-weight:700;padding:9px 14px;cursor:pointer;" +
    "letter-spacing:-0.01em;";

  var btnSecondary =
    "border:1px solid " + COLORS.border + ";border-radius:8px;" +
    "background:" + COLORS.bg + ";" +
    "color:" + COLORS.inkDim + ";" +
    "font-size:13px;font-weight:600;padding:9px 14px;cursor:pointer;";

  /* ── Helpers ─────────────────────────────────────────────────────────── */

  function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function detectBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf("Edg") >= 0) return "Edge";
    if (ua.indexOf("Firefox") >= 0) return "Firefox";
    if (ua.indexOf("Safari") >= 0 && ua.indexOf("Chrome") < 0) return "Safari";
    return "Chrome";
  }

  function detectDevice() {
    var ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Android/i.test(ua)) return "Android";
    if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
    if (/Windows/i.test(ua)) return "Windows";
    return "Desktop";
  }

  function isIosSafari() {
    var ua = navigator.userAgent;
    return /iPhone|iPad|iPod/i.test(ua) && /WebKit/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
  }

  function isStandalone() {
    return Boolean(window.navigator.standalone);
  }

  function apiUrl(path) {
    return config.apiBaseUrl.replace(/\/$/, "") + path;
  }

  function setDismissCooldown() {
    var cooldownMs = Number(config.reShowAfterDismissHours || 72) * 60 * 60 * 1000;
    localStorage.setItem(config.popupDismissedKey, String(Date.now() + cooldownMs));
  }

  function hasDismissCooldown() {
    return Number(localStorage.getItem(config.popupDismissedKey) || "0") > Date.now();
  }

  function removePopup() {
    var existing = document.getElementById("notifypilot-optin");
    if (existing) existing.remove();
  }

  function dismissPopup() {
    setDismissCooldown();
    removePopup();
  }

  function canUsePush() {
    return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch];
    });
  }

  /* ── Subscribe flow ───────────────────────────────────────────────────── */

  async function syncSubscription() {
    if (!canUsePush() || !config.vapidPublicKey) {
      throw new Error("Push channel is not available.");
    }
    var registration = await navigator.serviceWorker.register(config.serviceWorkerPath);
    var subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
      });
    }
    var response = await fetch(apiUrl("/api/push/subscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug: config.tenantSlug,
        storeUrl: config.storeUrl,
        browser: detectBrowser(),
        device: detectDevice(),
        subscription: subscription.toJSON()
      })
    });
    if (!response.ok) throw new Error("Subscriber sync failed.");
    localStorage.setItem(config.registeredKey, "true");
    return response.json();
  }

  function showSuccess(result) {
    var code = result.discountCode || "";
    var discountUrl = result.discountUrl || config.storeUrl;
    var wrapper = document.getElementById("notifypilot-optin");
    if (!wrapper) return;

    wrapper.innerHTML =
      '<div style="' + card + '">' +
        '<div style="font-size:15px;font-weight:700;line-height:1.3;color:' + COLORS.ink + ';">' + escapeHtml(config.successTitle) + '</div>' +
        '<div style="margin-top:6px;font-size:13px;line-height:1.5;color:' + COLORS.inkDim + ';">' + escapeHtml(config.successBody) + '</div>' +
        '<div style="margin-top:10px;border:1px solid ' + COLORS.border + ';border-radius:8px;background:' + COLORS.surface + ';padding:10px 12px;font-family:' + COLORS.mono + ';font-size:14px;font-weight:800;letter-spacing:0.04em;color:' + COLORS.ink + ';">' + escapeHtml(code) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' +
          '<button data-np-copy style="' + btnPrimary + '">Copy Code</button>' +
          '<button data-np-apply style="' + btnSecondary + '">Apply Discount</button>' +
        '</div>' +
      '</div>';

    wrapper.querySelector("[data-np-copy]").addEventListener("click", function () {
      navigator.clipboard.writeText(code);
    });
    wrapper.querySelector("[data-np-apply]").addEventListener("click", function () {
      window.location.href = discountUrl;
    });
  }

  function showError() {
    var wrapper = document.getElementById("notifypilot-optin");
    if (!wrapper) return;
    var msg = wrapper.querySelector("[data-np-message]");
    if (msg) msg.textContent = "Notifications are not available right now. Please try again later.";
  }

  async function unlockDiscount() {
    var permission = await Notification.requestPermission();
    if (permission !== "granted") {
      dismissPopup();
      return;
    }
    try {
      var result = await syncSubscription();
      showSuccess(result);
    } catch (_) {
      showError();
    }
  }

  /* ── iOS Add-to-Home-Screen hint ─────────────────────────────────────── */

  function renderIosHint() {
    if (hasDismissCooldown()) return;
    if (document.getElementById("notifypilot-optin")) return;

    var wrapper = document.createElement("div");
    wrapper.id = "notifypilot-optin";
    wrapper.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483000;" +
      "max-width:min(360px,calc(100vw - 32px));" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;" +
      "color:" + COLORS.ink + ";";

    wrapper.innerHTML =
      '<div style="' + card + '">' +
        '<div style="font-size:15px;font-weight:700;line-height:1.3;color:' + COLORS.ink + ';">' + escapeHtml(config.iosTitle) + '</div>' +
        '<div style="margin-top:6px;font-size:13px;line-height:1.5;color:' + COLORS.inkDim + ';">' + escapeHtml(config.iosBody) + '</div>' +
        '<div style="margin-top:10px;font-size:12px;line-height:1.5;color:' + COLORS.inkDim + ';">Tap <strong style="color:' + COLORS.ink + ';">Share</strong> then <strong style="color:' + COLORS.ink + ';">Add to Home Screen</strong>, then reopen from your home screen.</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;">' +
          '<button data-np-dismiss style="' + btnSecondary + '">Got it</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrapper);
    wrapper.querySelector("[data-np-dismiss]").addEventListener("click", dismissPopup);
  }

  /* ── Standard popup ───────────────────────────────────────────────────── */

  function renderPopup() {
    if (!canUsePush() || !config.vapidPublicKey) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission !== "default") return;
    if (hasDismissCooldown()) return;
    if (document.getElementById("notifypilot-optin")) return;

    var wrapper = document.createElement("div");
    wrapper.id = "notifypilot-optin";
    wrapper.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483000;" +
      "max-width:min(360px,calc(100vw - 32px));" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;" +
      "color:" + COLORS.ink + ";";

    wrapper.innerHTML =
      '<div style="' + card + '">' +
        '<div style="font-size:15px;font-weight:700;line-height:1.3;">' + escapeHtml(config.popupTitle) + '</div>' +
        '<div data-np-message style="margin-top:6px;font-size:13px;line-height:1.5;color:' + COLORS.inkDim + ';">' + escapeHtml(config.popupBody) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' +
          '<button data-np-allow style="' + btnPrimary + '">' + escapeHtml(config.primaryButtonText) + '</button>' +
          '<button data-np-dismiss style="' + btnSecondary + '">' + escapeHtml(config.secondaryButtonText) + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrapper);
    wrapper.querySelector("[data-np-allow]").addEventListener("click", unlockDiscount);
    wrapper.querySelector("[data-np-dismiss]").addEventListener("click", dismissPopup);
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */

  async function boot() {
    await loadRemoteConfig();

    if (isIosSafari() && !isStandalone()) {
      window.setTimeout(renderIosHint, Number(config.popupDelaySeconds || 0) * 1000);
      return;
    }

    if (!canUsePush()) return;

    if (Notification.permission === "granted") {
      syncSubscription().catch(function () {});
      return;
    }

    window.setTimeout(renderPopup, Number(config.popupDelaySeconds || 0) * 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
