# Pareto Pro Mail — Custom Event Kinds

This document describes the custom Nostr event kinds used by Pareto Pro Mail.

## Kind 35733 — Newsletter Publication Config (addressable)

The author's publication identity. Addressable by `pubkey + kind + d-tag`
(the `d` tag is the newsletter slug). Public metadata only.

Tags: `d`, `title`, `description`/`summary`, `image`, `relay`, `t` (topics),
`paid_sats`, `stablezap`, `refstr`, `alt`.

## Kind 30023 / 30024 — Issues / Drafts (NIP-23)

Published long-form issues (30023) and drafts (30024) per NIP-23. Linked to a
publication via an `a` tag referencing the `35733:<pubkey>:<slug>` coordinate.

## Kind 35647 — Delivery Record (addressable, author-private)

Per-issue send log. NIP-44 encrypted to self.

## Kind 13039 — Email Address Book (replaceable, author-private)

Encrypted email contacts. NIP-44 encrypted to self.

## Kind 36697 — Audience Vault Contact (addressable, author-private)

**Added for the Audience Vault feature.**

A privacy-first alternative to a conventional CRM. One event per contact,
addressable by `pubkey + kind + d-tag` where the `d` tag is a randomly
generated internal relationship ID (e.g. `c_a1b2c3…`). Latest event per
`d` tag wins.

### Privacy model

All personally identifying information (name, email, npub, NIP-05, notes,
referral, consent, preferences, lists, audit trail) lives in the
**NIP-44-encrypted `content`**, encrypted to the author's own pubkey. Nothing
identifying is ever published in cleartext. The publisher is the only party
who can decrypt their vault.

Public tags carry **only non-identifying** metadata so relays can index/filter
without learning anything about the person:

| Tag          | Meaning                                                             |
| ------------ | ------------------------------------------------------------------- |
| `d`          | Internal relationship ID (random, non-sequential)                   |
| `status`     | Subscription status (subscribed, unsubscribed, pending, suppressed, bounced, follower, paid, founding) |
| `ctype`      | Reachable channel type (`email`, `nostr`, `hybrid`)                 |
| `membership` | Membership tier (`none`, `free`, `paid`, `founding`, `cancelled`)   |
| `payment`    | Payment lifecycle (`none`, `active`, `cancelled`)                   |
| `joined`     | Unix timestamp the relationship began                               |
| `vault`      | Always `encrypted` — explicit privacy marker                        |
| `alt`        | NIP-31 human-readable description                                   |

### Decrypted `content` schema (JSON)

```jsonc
{
  "displayName": "Anna Keller",        // optional
  "email": "anna@example.com",          // optional
  "npub": "npub1…",                     // optional
  "nip05": "anna@nostr.example",        // optional
  "tags": ["Research", "Bitcoin"],
  "source": "referral",                 // referral | direct | nostr | import | manual
  "referredBy": "…",                    // optional
  "notes": "…",                         // optional, publisher-authored
  "consentAt": 1757635200,              // optional unix ts
  "consentNote": "Double opt-in confirmed",
  "lists": ["weekly-brief"],
  "prefs": { "email": true, "nostr": true, "frequency": "all" },
  "paymentMethod": "lightning",         // lightning | onchain | card | none
  "audit": [                            // append-only status-change log
    { "at": 1757635200, "change": "created", "note": "Contact added to vault" },
    { "at": 1757635200, "change": "status:subscribed" }
  ]
}
```

### Design principles

The Audience Vault deliberately records **the relationship, not the person**:

- No engagement scores, open/click tracking, device fingerprints, location
  history, or behavioral/predictive profiling.
- No field is required except the internal ID. A contact may be email-only,
  Nostr-only, both, or fully pseudonymous (name only).
- Fully publisher-controlled: exportable (CSV) and deletable at any time.
