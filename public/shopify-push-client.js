(function () {
  "use strict";

  var DEFAULT_CONFIG = {
    tenantSlug: "aurela",
    storeUrl: "https://aurelastudio.com",
    apiBaseUrl: "https://notify.grindctrl.cloud",
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
    successBody: "Use this code at checkout:"
  };

  var config = Object.assign({}, DEFAULT_CONFIG, window.NotifyPilotPushConfig || {});

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

    if (!response.ok) {
      throw new Error("Subscriber sync failed.");
    }

    localStorage.setItem(config.registeredKey, "true");
    return response.json();
  }

  function showSuccess(result) {
    var code = result.discountCode || "";
    var discountUrl = result.discountUrl || config.storeUrl;
    var wrapper = document.getElementById("notifypilot-optin");
    if (!wrapper) return;

    wrapper.innerHTML =
      '<div style="border:1px solid oklch(0.78 0.02 260 / 0.65);border-radius:12px;background:oklch(0.99 0.005 95);box-shadow:0 8px 24px oklch(0.22 0.03 260 / 0.14);padding:16px;">' +
      '<div style="font-size:15px;font-weight:750;line-height:1.3;color:oklch(0.2 0.02 260);">' +
      escapeHtml(config.successTitle) +
      "</div>" +
      '<div style="margin-top:6px;font-size:13px;line-height:1.45;color:oklch(0.42 0.02 260);">' +
      escapeHtml(config.successBody) +
      "</div>" +
      '<div style="margin-top:10px;border:1px solid oklch(0.86 0.02 260);border-radius:8px;background:oklch(0.96 0.01 95);padding:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;font-weight:800;color:oklch(0.22 0.03 260);">' +
      escapeHtml(code) +
      "</div>" +
      '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' +
      '<button data-np-copy style="border:0;border-radius:8px;background:oklch(0.53 0.16 276);color:oklch(0.99 0.005 95);font-weight:700;padding:9px 12px;cursor:pointer;">Copy Code</button>' +
      '<button data-np-apply style="border:1px solid oklch(0.78 0.02 260);border-radius:8px;background:oklch(0.99 0.005 95);color:oklch(0.24 0.03 260);font-weight:700;padding:9px 12px;cursor:pointer;">Apply Discount</button>' +
      "</div>" +
      "</div>";

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
    wrapper.querySelector("[data-np-message]").textContent =
      "Notifications are not available right now. Please try again later.";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character];
    });
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

  function renderPopup() {
    if (!canUsePush() || !config.vapidPublicKey) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission !== "default") return;
    if (hasDismissCooldown()) return;
    if (document.getElementById("notifypilot-optin")) return;

    var wrapper = document.createElement("div");
    wrapper.id = "notifypilot-optin";
    wrapper.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483000;max-width:min(360px,calc(100vw - 32px));font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:oklch(0.2 0.02 260);";
    wrapper.innerHTML =
      '<div style="border:1px solid oklch(0.78 0.02 260 / 0.65);border-radius:12px;background:oklch(0.99 0.005 95);box-shadow:0 8px 24px oklch(0.22 0.03 260 / 0.14);padding:16px;">' +
      '<div style="font-size:15px;font-weight:750;line-height:1.3;">' +
      escapeHtml(config.popupTitle) +
      "</div>" +
      '<div data-np-message style="margin-top:6px;font-size:13px;line-height:1.45;color:oklch(0.42 0.02 260);">' +
      escapeHtml(config.popupBody) +
      "</div>" +
      '<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">' +
      '<button data-np-allow style="border:0;border-radius:8px;background:oklch(0.53 0.16 276);color:oklch(0.99 0.005 95);font-weight:700;padding:9px 12px;cursor:pointer;">' +
      escapeHtml(config.primaryButtonText) +
      "</button>" +
      '<button data-np-dismiss style="border:1px solid oklch(0.78 0.02 260);border-radius:8px;background:oklch(0.99 0.005 95);color:oklch(0.42 0.02 260);font-weight:700;padding:9px 12px;cursor:pointer;">' +
      escapeHtml(config.secondaryButtonText) +
      "</button>" +
      "</div>" +
      "</div>";

    document.body.appendChild(wrapper);
    wrapper.querySelector("[data-np-allow]").addEventListener("click", unlockDiscount);
    wrapper.querySelector("[data-np-dismiss]").addEventListener("click", dismissPopup);
  }

  function boot() {
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
