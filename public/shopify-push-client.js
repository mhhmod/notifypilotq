(function () {
  "use strict";

  var DEFAULT_CONFIG = {
    tenantSlug: "store",
    storeUrl: "",
    apiBaseUrl: "https://notify.grindctrl.cloud",
    configUrl: "/apps/notifypilot",
    vapidPublicKey: "",
    serviceWorkerPath: "/apps/notifypilot?asset=service-worker",
    manifestPath: "/apps/notifypilot?asset=manifest",
    iconUrl: "",
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
      if (remote.manifestPath) mapped.manifestPath = remote.manifestPath;
      if (remote.iconUrl) mapped.iconUrl = remote.iconUrl;
      // Proxy values are server-owned and authoritative (VAPID key, slug, URLs):
      // they override theme-provided config, which can drift or be mistyped.
      // Theme keeps control only of fields the proxy does not return (UX copy).
      config = Object.assign({}, DEFAULT_CONFIG, themeConfig, mapped);
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
    return /iPhone|iPad|iPod/i.test(ua) && /WebKit/i.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
  }

  function isIosDevice() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
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

  function waitForActiveWorker(registration) {
    if (registration.active) return Promise.resolve(registration);
    return new Promise(function (resolve) {
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve(registration);
      }
      // Safety timeout: never hang the sign-up flow.
      setTimeout(finish, 10000);
      var poll = setInterval(function () {
        if (registration.active) {
          clearInterval(poll);
          finish();
        }
      }, 100);
      var worker = registration.installing || registration.waiting;
      if (worker) {
        worker.addEventListener("statechange", function () {
          if (worker.state === "activated") {
            clearInterval(poll);
            finish();
          }
        });
      }
    });
  }

  function subscriptionKeyMatches(subscription, vapidKey) {
    try {
      var existing = subscription.options && subscription.options.applicationServerKey;
      if (!existing) return false;
      var a = new Uint8Array(existing);
      var b = urlBase64ToUint8Array(vapidKey);
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  // "AbortError: Registration failed - push service error" is frequently a
  // transient failure to reach Google's FCM endpoint; retry with backoff.
  async function subscribeWithRetry(registration, attempts) {
    var lastError;
    for (var i = 0; i < attempts; i += 1) {
      try {
        return await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
        });
      } catch (error) {
        lastError = error;
        if (error && error.name === "AbortError" && i < attempts - 1) {
          await delay(1500 * (i + 1));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async function syncSubscription() {
    if (!canUsePush() || !config.vapidPublicKey) {
      throw new Error("Push channel is not available.");
    }
    var registration = await navigator.serviceWorker.register(config.serviceWorkerPath);
    // pushManager.subscribe needs an ACTIVE worker; register() can resolve
    // before activation (common on Android), which silently fails the subscribe.
    await waitForActiveWorker(registration);
    var subscription = await registration.pushManager.getSubscription();
    // A subscription left over from a previous (e.g. mistyped) VAPID key cannot
    // receive our pushes and makes re-subscribe throw InvalidStateError. Drop it.
    if (subscription && !subscriptionKeyMatches(subscription, config.vapidPublicKey)) {
      try {
        await subscription.unsubscribe();
      } catch (_) {
        /* ignore */
      }
      subscription = null;
    }
    if (!subscription) {
      subscription = await subscribeWithRetry(registration, 3);
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

  function showError(message) {
    var wrapper = document.getElementById("notifypilot-optin");
    if (!wrapper) return;
    var msg = wrapper.querySelector("[data-np-message]");
    if (msg) msg.textContent = message || "Notifications are not available right now. Please try again later.";
  }

  async function completeUnlock() {
    try {
      var result = await syncSubscription();
      showSuccess(result);
    } catch (error) {
      console.error("[NotifyPilot] subscribe failed", error);
      var detail = error && (error.name || error.message)
        ? (error.name || "") + (error.message ? ": " + error.message : "")
        : "Unknown error";
      showError("Sign-up failed — " + detail);
    }
  }

  async function unlockDiscount() {
    var permission;
    try {
      permission = await Notification.requestPermission();
    } catch (error) {
      console.error("[NotifyPilot] requestPermission failed", error);
      showError("Your browser blocked the notification prompt.");
      return;
    }
    if (permission !== "granted") {
      dismissPopup();
      return;
    }
    await completeUnlock();
  }

  // Shown when permission is already granted but registration never finished
  // (e.g. an earlier failed attempt), so the shopper still sees their code.
  function renderProcessing() {
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
        '<div data-np-message style="margin-top:6px;font-size:13px;line-height:1.5;color:' + COLORS.inkDim + ';">Unlocking your discount…</div>' +
      '</div>';
    document.body.appendChild(wrapper);
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

  /* ── iOS / PWA install tags ───────────────────────────────────────────── */

  function addMetaOnce(name, content) {
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var meta = document.createElement("meta");
    meta.name = name;
    meta.content = content;
    meta.setAttribute("data-np", "1");
    (document.head || document.documentElement).appendChild(meta);
  }

  // Inject a web app manifest + Apple meta so the site is installable to the
  // Home Screen, which is the prerequisite for web push on iOS 16.4+.
  function injectPwaTags() {
    try {
      var head = document.head || document.getElementsByTagName("head")[0];
      if (!head) return;
      if (config.manifestPath && !document.querySelector('link[rel="manifest"]')) {
        var manifest = document.createElement("link");
        manifest.rel = "manifest";
        manifest.href = config.manifestPath;
        manifest.setAttribute("data-np", "1");
        head.appendChild(manifest);
      }
      addMetaOnce("apple-mobile-web-app-capable", "yes");
      addMetaOnce("mobile-web-app-capable", "yes");
      addMetaOnce("apple-mobile-web-app-status-bar-style", "default");
      if (config.iconUrl && !document.querySelector('link[rel="apple-touch-icon"]')) {
        var icon = document.createElement("link");
        icon.rel = "apple-touch-icon";
        icon.href = config.iconUrl;
        icon.setAttribute("data-np", "1");
        head.appendChild(icon);
      }
    } catch (_) {
      /* non-fatal */
    }
  }

  /* ── Info + debug cards ───────────────────────────────────────────────── */

  function makeCard(innerHtml) {
    if (document.getElementById("notifypilot-optin")) return null;
    var wrapper = document.createElement("div");
    wrapper.id = "notifypilot-optin";
    wrapper.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483000;" +
      "max-width:min(360px,calc(100vw - 32px));" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;" +
      "color:" + COLORS.ink + ";";
    wrapper.innerHTML = innerHtml;
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function renderInfo(title, message) {
    var wrapper = makeCard(
      '<div style="' + card + '">' +
        '<div style="font-size:15px;font-weight:700;line-height:1.3;">' + escapeHtml(title) + '</div>' +
        '<div style="margin-top:6px;font-size:13px;line-height:1.5;color:' + COLORS.inkDim + ';">' + escapeHtml(message) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;"><button data-np-dismiss style="' + btnSecondary + '">Got it</button></div>' +
      '</div>'
    );
    if (wrapper) wrapper.querySelector("[data-np-dismiss]").addEventListener("click", removePopup);
  }

  function renderDebug() {
    var info = {
      iosSafari: isIosSafari(),
      standalone: isStandalone(),
      canUsePush: canUsePush(),
      permission: (window.Notification && Notification.permission) || "n/a",
      Notification: "Notification" in window,
      serviceWorker: "serviceWorker" in navigator,
      PushManager: "PushManager" in window,
      vapid: config.vapidPublicKey ? config.vapidPublicKey.slice(0, 12) + "…" : "(none)",
      ua: navigator.userAgent
    };
    var rows = Object.keys(info).map(function (k) {
      return (
        '<div style="display:flex;gap:8px;justify-content:space-between;border-bottom:1px solid ' + COLORS.border + ';padding:5px 0;font-size:12px;">' +
        '<span style="color:' + COLORS.inkDim + ';">' + escapeHtml(k) + '</span>' +
        '<span style="font-family:' + COLORS.mono + ';font-weight:700;text-align:right;word-break:break-all;max-width:62%;">' + escapeHtml(String(info[k])) + '</span></div>'
      );
    }).join("");
    var wrapper = makeCard(
      '<div style="' + card + '"><div style="font-size:14px;font-weight:800;margin-bottom:6px;">NotifyPilot debug</div>' +
      rows +
      '<div style="margin-top:12px;"><button data-np-dismiss style="' + btnSecondary + '">Close</button></div></div>'
    );
    if (wrapper) wrapper.querySelector("[data-np-dismiss]").addEventListener("click", removePopup);
  }

  /* ── Boot ─────────────────────────────────────────────────────────────── */

  async function boot() {
    await loadRemoteConfig();
    injectPwaTags();

    var delayMs = Number(config.popupDelaySeconds || 0) * 1000;

    var debug = false;
    try { debug = /[?&]np-debug=1/.test(window.location.search); } catch (_) {}
    if (debug) {
      window.setTimeout(renderDebug, 300);
      return;
    }

    var iosSafari = isIosSafari();
    var standalone = isStandalone();

    // iPhone Safari, not yet installed → guide to Home Screen.
    if (iosSafari && !standalone) {
      window.setTimeout(renderIosHint, delayMs);
      return;
    }

    // Push channel unavailable. On iOS this means iOS < 16.4 or the page was
    // opened outside the installed app — tell the shopper instead of going silent.
    if (!canUsePush()) {
      if (iosSafari) {
        window.setTimeout(function () {
          renderInfo(
            "One more step on iPhone",
            "Open this store from its Home Screen icon on iOS 16.4 or later to turn on notifications and unlock your discount."
          );
        }, delayMs);
      } else if (isIosDevice()) {
        // Chrome/Firefox/Edge on iOS cannot do web push (Apple restriction).
        window.setTimeout(function () {
          renderInfo(
            "Open in Safari to get 10% off",
            "On iPhone, notifications only work in Safari. Open sn2studios.co in Safari, then Add to Home Screen to unlock your discount."
          );
        }, delayMs);
      }
      return;
    }

    if (Notification.permission === "denied") {
      window.setTimeout(function () {
        renderInfo(
          "Notifications are turned off",
          "Enable notifications for this site in your settings, then reopen to unlock your discount."
        );
      }, delayMs);
      return;
    }

    if (Notification.permission === "granted") {
      if (localStorage.getItem(config.registeredKey) === "true") {
        syncSubscription().catch(function () {});
      } else {
        renderProcessing();
        completeUnlock();
      }
      return;
    }

    window.setTimeout(renderPopup, delayMs);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
