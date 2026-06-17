# Re-open iOS Steps + Discount Abuse Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let iPhone shoppers re-open the dismissed 7-step install card via a small persistent pill, and harden opt-in discount issuance so abuse yields no value — all without changing the opt-in flow.

**Architecture:** Feature A is entirely in the storefront client (`public/shopify-push-client.js`): replace the hard dismiss of the 7-step card with a collapse-to-pill, gated by a localStorage flag. Feature B hardens the existing dedupe (verify/add a UNIQUE index for race-safety) and adds a long-window per-IP issuance cap in the subscribe route; redemption is already locked by Shopify code flags.

**Tech Stack:** Next.js (App Router) API routes, Supabase (Postgres via PostgREST), vanilla browser JS client, Shopify Admin API. No unit-test runner — verification via `node --check`, `npm run typecheck`, `npm run build`, deployed `curl`, and manual storefront checks.

---

## File Structure

- `public/shopify-push-client.js` — Feature A: pill + collapse logic + boot branch. (modify)
- `app/api/push/subscribe/route.ts` — Feature B: long-window per-IP issuance cap. (modify)
- `services/discounts/discounts.service.ts` — Feature B: confirm Shopify code flags (read-only check; no change expected). (verify)
- Production DB `oiqkjworpdigxtsnygik`, table `np_discount_codes` — Feature B: UNIQUE index on `(tenant_id, claim_fingerprint)`. (verify/add via SQL — user-assisted)

---

## Task 1: Collapse-to-pill state helpers (client)

**Files:**
- Modify: `public/shopify-push-client.js` (near the other localStorage helpers, ~line 173 `setDismissCooldown`)

- [ ] **Step 1: Add the seen-flag + pill helpers**

Add a config key in `DEFAULT_CONFIG` (near `popupDismissedKey`, ~line 16):

```js
    iosStepsSeenKey: "notifypilot_ios_steps_seen",
```

Add these functions next to `setDismissCooldown`/`hasDismissCooldown`:

```js
  function markIosStepsSeen() {
    try { localStorage.setItem(config.iosStepsSeenKey, "1"); } catch (_) { /* ignore */ }
  }

  function hasSeenIosSteps() {
    try { return localStorage.getItem(config.iosStepsSeenKey) === "1"; } catch (_) { return false; }
  }

  function removeStepsPill() {
    var pill = document.getElementById("notifypilot-optin-pill");
    if (pill) pill.remove();
  }
```

- [ ] **Step 2: Verify syntax**

Run: `node --check public/shopify-push-client.js`
Expected: no output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add public/shopify-push-client.js
git commit -m "Add iOS steps-seen flag + pill helpers"
```

---

## Task 2: Render the pill + wire collapse (client)

**Files:**
- Modify: `public/shopify-push-client.js` (`renderIosHint` dismiss handler ~line 520; add `renderStepsPill` after `renderIosHint`)

- [ ] **Step 1: Add `renderStepsPill`**

Add immediately after the `renderIosHint` function closes:

```js
  function renderStepsPill() {
    if (document.getElementById("notifypilot-optin")) return;
    if (document.getElementById("notifypilot-optin-pill")) return;
    var pill = document.createElement("button");
    pill.id = "notifypilot-optin-pill";
    pill.type = "button";
    pill.style.cssText =
      "position:fixed;right:18px;bottom:18px;z-index:2147483000;" +
      "display:inline-flex;align-items:center;gap:8px;cursor:pointer;" +
      "padding:10px 14px;border-radius:999px;border:1px solid " + COLORS.border + ";" +
      "background:" + COLORS.ink + ";color:" + COLORS.bg + ";" +
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;" +
      "font-size:13px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,0.18);";
    pill.innerHTML = "🎁 Get 10% off";
    pill.addEventListener("click", function () {
      removeStepsPill();
      renderIosHint();
    });
    document.body.appendChild(pill);
  }
```

- [ ] **Step 2: Change the card dismiss to collapse to the pill**

In `renderIosHint`, replace the dismiss listener line:

```js
    wrapper.querySelector("[data-np-dismiss]").addEventListener("click", dismissPopup);
```

with:

```js
    wrapper.querySelector("[data-np-dismiss]").addEventListener("click", function () {
      markIosStepsSeen();
      removePopup();
      renderStepsPill();
    });
```

- [ ] **Step 3: Verify syntax**

Run: `node --check public/shopify-push-client.js`
Expected: no output (exit 0).

- [ ] **Step 4: Commit**

```bash
git add public/shopify-push-client.js
git commit -m "Collapse 7-step card to a re-openable pill"
```

---

## Task 3: Boot uses pill as resting state (client)

**Files:**
- Modify: `public/shopify-push-client.js` (`boot`, the `iosDevice && !standalone` branch ~line 656)

- [ ] **Step 1: Branch on whether steps were already seen**

Replace:

```js
    if (iosDevice && !standalone) {
      // Instagram/Facebook/etc in-app browser can't install or push: bounce to Safari.
      if (isInAppBrowser()) {
        openInSafari();
        window.setTimeout(renderSafariPrompt, delayMs);
      } else {
        window.setTimeout(renderIosHint, delayMs);
      }
      return;
    }
```

with:

```js
    if (iosDevice && !standalone) {
      // Instagram/Facebook/etc in-app browser can't install or push: bounce to Safari.
      if (isInAppBrowser()) {
        openInSafari();
        window.setTimeout(renderSafariPrompt, delayMs);
      } else if (hasSeenIosSteps()) {
        // Already saw the full steps: keep them one tap away via the pill.
        window.setTimeout(renderStepsPill, delayMs);
      } else {
        window.setTimeout(renderIosHint, delayMs);
      }
      return;
    }
```

- [ ] **Step 2: Verify syntax**

Run: `node --check public/shopify-push-client.js`
Expected: no output (exit 0).

- [ ] **Step 3: Commit**

```bash
git add public/shopify-push-client.js
git commit -m "Show steps pill as resting state once steps seen"
```

---

## Task 4: Verify / add the discount race-safety index (prod DB)

**Files:**
- Production project `oiqkjworpdigxtsnygik`, table `public.np_discount_codes`

> The MCP supabase tools point at the wrong project and lack permission on this
> one. This step is **user-assisted**: the user runs the SQL in the Supabase SQL
> Editor for the `oiqkj` project (or grants read SQL access).

- [ ] **Step 1: Check whether the unique index/constraint exists**

SQL to run:

```sql
select indexname, indexdef
from pg_indexes
where tablename = 'np_discount_codes'
  and indexdef ilike '%claim_fingerprint%';
```

Expected: a UNIQUE index on `(tenant_id, claim_fingerprint)`. If a row is returned and it says `UNIQUE`, skip Step 2.

- [ ] **Step 2: Add it if missing (idempotent, partial — ignores NULL fingerprints)**

```sql
create unique index if not exists idx_np_discount_codes_claim_fingerprint
  on public.np_discount_codes (tenant_id, claim_fingerprint)
  where claim_fingerprint is not null;
```

- [ ] **Step 3: Confirm**

Re-run the Step 1 query; confirm the unique index now appears.

- [ ] **Step 4: No code change / commit** — this is a DB-only task.

---

## Task 5: Long-window per-IP issuance cap (subscribe route)

**Files:**
- Modify: `app/api/push/subscribe/route.ts` (after the existing `ipLimit`/`claimLimit` block, ~line 82-89)

- [ ] **Step 1: Add a per-day per-IP issuance cap**

After the existing rate-limit block that sets `ipLimit` and `claimLimit`, add:

```ts
  const dailyIpLimit = checkRateLimit(`push-subscribe-ip-day:${ipHash}`, 6, 24 * 60 * 60 * 1000);
  if (!dailyIpLimit.allowed) {
    return NextResponse.json(
      { error: "Discount claim limit reached. Please try again later." },
      { status: 429, headers: cors }
    );
  }
```

(`checkRateLimit` is already imported from `@/lib/security/rate-limit`.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/push/subscribe/route.ts
git commit -m "Add per-day per-IP cap on opt-in discount issuance"
```

---

## Task 6: Confirm Shopify redemption flags (verification only)

**Files:**
- Read: `services/discounts/discounts.service.ts` (`issueOptInDiscount`, the `createDiscountCode` call ~line 112-119)

- [ ] **Step 1: Confirm the flags are present**

Run: `grep -n "usageLimit\|appliesOncePerCustomer" services/discounts/discounts.service.ts`
Expected: shows `usageLimit: 1` and `appliesOncePerCustomer: true` in the `createDiscountCode` call. No change needed if present (they are, as of this plan).

- [ ] **Step 2: No commit** — verification only. If a flag were missing, add it and commit `fix: enforce single-use once-per-customer on opt-in codes`.

---

## Task 7: Build, deploy, verify live

**Files:** none (deploy + verification)

- [ ] **Step 1: Local production build**

Run: `npm run build`
Expected: completes; `/api/push/subscribe` and `/dashboard/subscribers` listed as dynamic.

- [ ] **Step 2: Commit any remaining, push master + main**

```bash
git push origin master
git push origin master:main
```

- [ ] **Step 3: Deploy (VPS clones master, builds, starts)**

```bash
ssh -i ~/.ssh/grindctrl_vps root@72.62.39.167 "cd /docker/notifypilot && docker compose up -d --force-recreate"
```

- [ ] **Step 4: Verify client live**

Run: `curl -sS https://notify.grindctrl.cloud/shopify-push-client.js | grep -c "notifypilot-optin-pill"`
Expected: `>= 1`.

- [ ] **Step 5: Manual storefront checks**

- iPhone Safari → 7-step card → tap "Got it" → pill appears → tap pill → steps reopen. Reload → pill is resting state. Subscribe → neither shows.
- Reinstall test: logged-in customer opts in, deletes app, reinstalls, opts in again → same code returned (no new Shopify code).

---

## Self-Review

- **Spec coverage:** A pill + collapse (Tasks 1-3) ✓; permanent claim / unique index (Task 4) ✓; redemption lock confirm (Task 6) ✓; per-IP cap (Task 5) ✓; honest residual documented in spec (no task needed) ✓.
- **Placeholders:** none — all code shown.
- **Type/name consistency:** `iosStepsSeenKey`, `markIosStepsSeen`, `hasSeenIosSteps`, `renderStepsPill`, `removeStepsPill` used consistently across Tasks 1-3; `checkRateLimit` signature matches existing usage in the route.
