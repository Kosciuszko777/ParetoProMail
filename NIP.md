# Pareto Pro Mail — Nostr Newsletter Protocol

## Overview

Pareto Pro Mail is a three-layer newsletter architecture built on Nostr:

1. **Publication (source of truth)** — every issue is a **NIP-23 kind 30023** long-form event. Canonical, censorship-resistant, visible in every NIP-23 client (Habla, Highlighter, Yakihonne). Drafts use **kind 30024**.
2. **Delivery (reach)** — the same issue fans out to subscribers via Nostr notifications/DMs and optionally via SMTP email. Delivery is layered *on top of* the canonical publication.
3. **Subscription & growth** — subscriber status is derived from public events and (for paid tiers) Stablezap payment receipts. No separate subscriber database.

## Event Kinds

| Kind    | Type        | Name                        | Description |
|---------|-------------|-----------------------------|-------------|
| `35733` | Addressable | Newsletter Config           | Publication identity: title, description, relays, Stablezap/Refstr config |
| `30023` | Addressable | Published Issue (NIP-23)    | Canonical long-form article (standard, reused) |
| `30024` | Addressable | Draft Issue (NIP-23)        | Unpublished draft (standard, reused) |
| `35647` | Addressable | Delivery Record             | Author-private send log, NIP-44 encrypted to self |
| `13039` | Replaceable | Encrypted Address Book      | Email contacts, NIP-44 encrypted to self |

---

## Kind 35733 — Newsletter Config (Addressable)

The author's publication identity. One author may run several newsletters (different `d` tags).

```json
{
  "kind": 35733,
  "pubkey": "<author-hex>",
  "tags": [
    ["d", "<newsletter-slug>"],
    ["title", "My Newsletter"],
    ["description", "A short description"],
    ["image", "https://example.com/banner.jpg"],
    ["relay", "wss://relay.example.com"],
    ["t", "bitcoin"],
    ["t", "journalism"],
    ["stablezap", "<offer-naddr>"],
    ["refstr", "<terms-naddr>"],
    ["alt", "Pareto Pro Mail Newsletter: My Newsletter"]
  ],
  "content": "",
  "sig": "<sig>"
}
```

### Tags

| Tag           | Required | Description |
|---------------|----------|-------------|
| `d`           | YES      | URL-safe slug |
| `title`       | YES      | Newsletter name |
| `description` | NO       | Short description |
| `image`       | NO       | Banner/logo URL |
| `relay`       | NO       | Default relay(s) for this newsletter (repeatable) |
| `t`           | NO       | Topic hashtag (repeatable) |
| `paid_sats`   | NO       | Minimum cumulative zap sats for paid subscriber status |
| `stablezap`   | NO       | Stablezap offer address for paid subscriptions |
| `refstr`      | NO       | Refstr terms address for referrals |
| `alt`         | YES      | Human-readable fallback |

---

## Kind 30023 — Published Issue (NIP-23)

Standard NIP-23 long-form event. The canonical artifact — exists independently of delivery.

```json
{
  "kind": 30023,
  "pubkey": "<author-hex>",
  "tags": [
    ["d", "<newsletter-slug>-<issue-slug>"],
    ["title", "Issue Title"],
    ["summary", "Brief preview..."],
    ["published_at", "1700000000"],
    ["image", "https://example.com/cover.jpg"],
    ["a", "35733:<author-hex>:<newsletter-slug>"],
    ["t", "bitcoin"],
    ["alt", "Newsletter issue: Issue Title"]
  ],
  "content": "# Issue Title\n\nMarkdown content...",
  "sig": "<sig>"
}
```

The `a` tag links the issue to its parent newsletter config (`kind 35733`).

Issues may include a `["paid", "true"]` tag to indicate the content is gated behind a paid subscription. The reader client checks the author's cumulative zap receipts (kind 9735) against the newsletter's `paid_sats` threshold to determine access.

Drafts use **kind 30024** with the same structure. Publishing converts a draft to kind 30023.

---

## Kind 13039 — Encrypted Address Book (Replaceable)

Author's private email subscriber list. NIP-44 encrypted to self.

The plaintext JSON is an array of contacts with double-opt-in consent timestamps:

```json
[
  { "email": "alice@example.com", "name": "Alice", "subscribedAt": 1700000000, "consentAt": 1700000000, "tags": ["vip"] },
  { "email": "bob@example.org", "name": "Bob", "subscribedAt": 1700001000, "consentAt": 1700001000, "tags": [] }
]
```

**No email is added without recorded consent. No plaintext PII is ever stored unencrypted.**

---

## Kind 35647 — Delivery Record (Addressable, Author-Private)

Per-issue send log, NIP-44 encrypted to self. Used for the author's dashboard.

```json
{
  "kind": 35647,
  "tags": [["d", "<issue-slug>"], ["alt", "Pareto Pro Mail delivery record"]],
  "content": "<NIP-44 encrypted JSON: { nostrDelivered, nostrFailed, emailDelivered, emailFailed, sentAt, channels }>"
}
```

---

## Honest Boundary

The canonical issue on Nostr is censorship-resistant and self-owned. **Email delivery is standard email after the SMTP bridge** — normal metadata, no end-to-end encryption. We never imply otherwise. Readers who want privacy read via a Nostr client; readers who want convenience get email. The author owns the list either way.

---

## Subscription Model

- **Free Nostr subscribers**: npubs who have opted in via a signed event (`t: nostrmail-subscribe`).
- **Paid subscribers**: derived from cumulative zap receipts (kind 9735) sent to the newsletter author. If the author's newsletter config includes a `paid_sats` tag, any reader whose total zaps to the author ≥ that threshold is recognized as a paid subscriber. No subscriber database — status is computed from public zap receipts.
- **Email subscribers**: stored in the encrypted address book (kind 13039) with double-opt-in consent.

---

## Interoperability

Every published issue is a standard NIP-23 event. It resolves by `naddr` and renders in any NIP-23 client — Habla, Highlighter, Yakihonne, or any future client. Pareto Pro Mail adds delivery, subscription, and monetization on top without breaking the canonical artifact.
