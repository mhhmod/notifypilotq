# Re-open iOS Steps + Discount Abuse Hardening — Design

Date: 2026-06-17
Status: Approved (design)

## Context

NotifyPilot storefront client (`public/shopify-push-client.js`) shows iPhone
shoppers a 7-step "Add to Home Screen" card so they can enable web push and
unlock a 10% opt-in discount. Discounts are issued by
`services/discounts/discounts.service.ts#issueOptInDiscount`, deduped by
subscriber, by customer email (logged-in, via theme config), and by a device
fingerprint (`lib/security/request-fingerprint.ts`). Codes are created in
Shopify with `usageLimit: 1` and `appliesOncePerCustomer: true`.

Two problems:
1. The 7-step card is long; once dismissed there is no way to bring it back, so a
   shopper who needs to re-read the steps is stuck.
2. Discount abuse: a shopper who deletes and reinstalls the PWA gets a new push
   endpoint → new subscriber → a fresh code. Per-email dedupe closes this for
   logged-in customers; anonymous shoppers on a new device/network can still mint.

Constraint from the user: **do not change the opt-in flow** — no login
requirement, no email requirement, no extra friction. Keep behavior identical;
only make abuse worthless.

## Feature A — "See steps again" pill

### Behavior
- The 7-step card (`renderIosHint`) gains a **collapse** action instead of a hard
  dismiss. "Got it" collapses the card to a small floating **pill** in the
  bottom corner: `🎁 Get 10% off`.
- Tapping the pill **re-opens the full 7-step card**.
- State persists across page loads (localStorage) so the pill is the default
  resting state once the shopper has seen the card; the big card only auto-opens
  the first time.
- Only rendered where the steps apply: iPhone/iPad, not standalone, not an
  in-app browser (Instagram still bounces to Safari first).
- Hidden entirely once the shopper has subscribed (registeredKey set).

### Implementation
- New `renderStepsPill()` builds the small chip (`id="notifypilot-optin-pill"`,
  separate from the main `notifypilot-optin` card so both can coexist logic-wise).
- `renderIosHint()`'s dismiss handler calls `collapseToPill()` instead of
  `dismissPopup()` (which sets a 72h cooldown). Collapsing sets a localStorage
  flag `notifypilot_ios_steps_seen` rather than a timed cooldown.
- Boot logic for `iosDevice && !standalone && !inApp`:
  - if `notifypilot_ios_steps_seen` is set → `renderStepsPill()`
  - else → `renderIosHint()` after the delay.
- Pill click → remove pill, `renderIosHint()`.
- Reduced-motion: pill appears without transition; with motion, a short fade/scale.

## Feature B — Abuse hardening (flow unchanged)

Layered so abuse yields no value, with no UX change.

1. **Dedupe before minting (existing, keep).** `issueOptInDiscount` returns an
   existing code (or "already_claimed") before any Shopify create call, keyed by:
   subscriberId, then `claimFingerprint`. `claimFingerprint` = email-based when a
   logged-in email is known, else device+network fingerprint.

2. **Permanent claim, not timed.** A fingerprint/email that has claimed must never
   mint a second code. Enforced by a UNIQUE index on
   `np_discount_codes(tenant_id, claim_fingerprint)`. **Action: verify this index
   exists in the production project (`oiqkjworpdigxtsnygik`); add it if missing.**
   This also makes the in-code dedupe race-safe (second concurrent insert hits
   23505 and returns the existing claim).

3. **Redemption lock (existing, confirm).** Every Shopify code is created with
   `usageLimit: 1` + `appliesOncePerCustomer: true` + expiry. A duplicate code,
   if ever minted, cannot stack for a logged-in customer at checkout.

4. **Hard per-IP issuance cap.** On top of the existing hourly subscribe (12/h)
   and claim (4/h) limits, add a longer-window cap (e.g. per-IP per-day) on
   discount issuance so anonymous farming across reinstalls is throttled.

### Honest residual
A logged-**out** shopper using **guest checkout** on a fresh device + network is
the only case that cannot be fully closed without an identity, which the user has
explicitly ruled out. Layers 1–4 make this impractical (each code is single-use,
once-per-customer, rate-capped, and fingerprint-deduped) but not theoretically
impossible. Documented, not hidden.

## Out of scope
- No login/email requirement.
- No change to the popup/permission/discount UX.
- No schema change beyond the (idempotent) unique index in B2.

## Testing
- A: On iPhone Safari, dismiss the 7-step card → pill appears → tap pill →
  steps reopen. Reload → pill is the resting state. Subscribe → pill gone.
- B: Verify the unique index exists. Issue a code, attempt a second claim with
  the same fingerprint → returns the same code, no new Shopify code. Confirm
  Shopify code flags (`usageLimit`, `appliesOncePerCustomer`).
