# NIP-NN: Nostr Newsletter Protocol (Pareto Pro Mail)

## Abstract

This NIP defines a decentralized, censorship-resistant newsletter and bulk mailing system built entirely on Nostr. It enables any Nostr user to:

1. **Publish** a newsletter identity and associate it with their `npub` or a traditional email address
2. **Compose & send** newsletter issues to subscribers, delivered as encrypted gift-wrapped Nostr events
3. **Subscribe / unsubscribe** from newsletters publicly via a signed event
4. **Store** their private email contact list in an encrypted, self-owned replaceable event (NIP-44, encrypt-to-self)

All data is stored on Nostr relays. No central mail server or database is required.

---

## Event Kinds

| Kind    | Type        | Name                           | Description |
|---------|-------------|--------------------------------|-------------|
| `38973` | Addressable | Newsletter Definition          | Newsletter profile / identity published by the author |
| `13039` | Replaceable | Encrypted Email Contact List   | Author's private email contact list, encrypted with NIP-44 to self |

> Standard Nostr kinds reused:
> - `kind:30023` (NIP-23) — Newsletter issue content (long-form article per issue)
> - `kind:1059` (NIP-59) — Gift wrap delivery of an issue to a specific subscriber's npub
> - `kind:1` — Public subscription announcement (opt-in)

---

## Kind 38973 — Newsletter Definition (Addressable)

Published by the newsletter **author**. Identified by `pubkey + kind + d-tag`. Updating this event replaces the previous definition.

### Event Structure

```json
{
  "kind": 38973,
  "pubkey": "<author-pubkey-hex>",
  "created_at": "<unix-timestamp>",
  "tags": [
    ["d", "<newsletter-slug>"],
    ["title", "My Newsletter Title"],
    ["summary", "A short description of this newsletter"],
    ["image", "https://example.com/banner.jpg"],
    ["email", "newsletter@example.com"],
    ["website", "https://example.com/newsletter"],
    ["lang", "en"],
    ["t", "bitcoin"],
    ["t", "freedom"],
    ["alt", "Nostr Newsletter: My Newsletter Title"]
  ],
  "content": "Extended description / about text for this newsletter (markdown supported)",
  "sig": "<signature>"
}
```

### Tags

| Tag         | Required | Description |
|-------------|----------|-------------|
| `d`         | YES      | URL-safe slug identifying this newsletter (e.g. `my-newsletter`) |
| `title`     | YES      | Human-readable newsletter name |
| `summary`   | NO       | Short one-liner description |
| `image`     | NO       | Banner/logo image URL |
| `email`     | NO       | Associated email address (for email-bridge delivery) |
| `website`   | NO       | Associated website / landing page |
| `lang`      | NO       | BCP-47 language code (default `en`) |
| `t`         | NO       | Topic/hashtag (repeatable) |
| `alt`       | YES      | Human-readable fallback (NIP-31 compliance) |

> The `npub` of the author acts as the primary mailing address. Subscribers can address emails to `<npub>@paretomail.example`.

---

## Kind 13039 — Encrypted Email Contact List (Replaceable)

A **private, self-encrypted** contact list stored on relays. Only the author can decrypt it (NIP-44 encrypt-to-self: the shared key is derived from `author_privkey × author_pubkey`).

This event stores the author's email subscriber list — people who provided an email address outside of Nostr. Nostr-native subscribers are handled via `kind:1` subscription events (see below).

### Event Structure

```json
{
  "kind": 13039,
  "pubkey": "<author-pubkey-hex>",
  "created_at": "<unix-timestamp>",
  "tags": [
    ["alt", "Encrypted newsletter email contact list"]
  ],
  "content": "<NIP-44 encrypted JSON>",
  "sig": "<signature>"
}
```

### Plaintext Content (before encryption)

The `content` field, once decrypted, is a JSON array of contact objects:

```json
[
  {
    "email": "alice@example.com",
    "name": "Alice",
    "subscribedAt": 1700000000,
    "tags": ["vip", "beta-reader"],
    "npub": "npub1..."
  },
  {
    "email": "bob@example.org",
    "name": "Bob",
    "subscribedAt": 1700001000,
    "tags": []
  }
]
```

Each contact object:

| Field         | Type     | Description |
|---------------|----------|-------------|
| `email`       | string   | Email address (required) |
| `name`        | string   | Display name (optional) |
| `subscribedAt`| number   | Unix timestamp of subscription |
| `tags`        | string[] | Custom label tags (e.g. `"vip"`, `"segment-A"`) |
| `npub`        | string   | Associated Nostr npub if known (optional) |

> **Privacy guarantee**: this event's `content` is opaque ciphertext. No relay or third party can read the email addresses. Only the author, holding their private key, can decrypt and use this data.

---

## Newsletter Issues — Kind 30023 (NIP-23 Long-form Content)

Each newsletter **issue** is a standard NIP-23 addressable long-form event. Issues are authored under the newsletter author's pubkey.

```json
{
  "kind": 30023,
  "pubkey": "<author-pubkey-hex>",
  "tags": [
    ["d", "<newsletter-slug>-<issue-number>"],
    ["title", "Issue #42: The Future of Decentralization"],
    ["summary", "This week we cover..."],
    ["published_at", "1700000000"],
    ["a", "38973:<pubkey>:<newsletter-slug>"],
    ["t", "bitcoin"],
    ["alt", "Newsletter issue: The Future of Decentralization"]
  ],
  "content": "# The Future of Decentralization\n\n...",
  "sig": "<signature>"
}
```

The `a` tag links the issue to its parent Newsletter Definition (`kind:38973`).

---

## Subscription Events — Kind 1 (Public)

A Nostr-native user subscribes to a newsletter by publishing a `kind:1` note with a specific structure:

```json
{
  "kind": 1,
  "content": "Subscribed to nostr:naddr1...",
  "tags": [
    ["a", "38973:<author-pubkey>:<newsletter-slug>", "<relay-hint>"],
    ["t", "nostrmail-subscribe"]
  ]
}
```

### Unsubscribe

To unsubscribe, the user publishes another `kind:1` event with `t: nostrmail-unsubscribe`:

```json
{
  "kind": 1,
  "content": "Unsubscribed from nostr:naddr1...",
  "tags": [
    ["a", "38973:<author-pubkey>:<newsletter-slug>", "<relay-hint>"],
    ["t", "nostrmail-unsubscribe"]
  ]
}
```

Clients SHOULD treat the most recent subscription or unsubscription event from a given pubkey as the current state.

---

## Sending / Delivery

When the author sends an issue, the client:

1. Fetches all `kind:1` events with `t: nostrmail-subscribe` referencing the newsletter's `a`-tag, filtering out pubkeys with a more recent `t: nostrmail-unsubscribe`.
2. For each **Nostr subscriber** (known npub):
   - Wraps the `kind:30023` issue event in a **NIP-59 Gift Wrap** (`kind:1059`) addressed to the subscriber's pubkey.
   - Publishes the gift wrap to the subscriber's preferred DM relays (kind 10050) if known, else the default relay set.
3. For each **email subscriber** (from the encrypted contact list):
   - An optional email bridge service (self-hosted or third-party) reads the plaintext issue and sends a traditional email. The bridge authenticates the author via NIP-42 or NIP-98 HTTP Auth.
   - Email bridge implementations MUST verify the `kind:30023` event signature before delivery.
4. The `kind:30023` issue itself is also published publicly to relays (it is unencrypted, publicly readable long-form content, just like a blog post).

---

## Using npub as a Mailing Address

Any newsletter can be addressed as:

```
<npub>@paretomail.example
```

Or more precisely, using a custom NIP-05-like syntax:

```
<newsletter-slug>@<nip05-domain>
```

The resolver maps the slug to the `kind:38973` event and the author's pubkey. The `email` tag on the Newsletter Definition provides an alternative traditional email address for bridge delivery.

---

## Privacy Model

| Data                           | Visibility     | Encryption        |
|-------------------------------|----------------|-------------------|
| Newsletter definition (title, description) | Public | None |
| Newsletter issues              | Public          | None (like a blog) |
| Nostr subscriptions            | Public          | None              |
| Email contact list             | Private (relay sees ciphertext) | NIP-44 encrypt-to-self |
| Gift-wrapped deliveries        | Addressed only  | NIP-44 (NIP-59 gift wrap) |

---

## Summary of Kind Numbers

| Kind    | Purpose |
|---------|---------|
| `38973` | Newsletter Definition (addressable, one per slug per author) |
| `13039` | Encrypted Email Contact List (replaceable, one per author) |
| `30023` | Newsletter Issue (standard NIP-23 long-form, reused) |
| `1059`  | Gift Wrap delivery to Nostr subscribers (standard NIP-59, reused) |
| `1`     | Subscribe / Unsubscribe announcement (standard, tagged with `nostrmail-subscribe` / `nostrmail-unsubscribe`) |
