/**
 * Pareto Pro Mail — Data Layer
 *
 * Three-layer architecture:
 *   1. PUBLICATION  — NIP-23 kind 30023 (issue) / kind 30024 (draft). Canonical, censorship-resistant.
 *   2. DELIVERY     — Fan-out concern layered on top (Nostr notifications, SMTP bridge). Phase 2+.
 *   3. SUBSCRIPTION — Derived from public events + Stablezap receipts. No subscriber database.
 *
 * Newsletter config: kind 35733 (addressable). Author's publication identity.
 * Delivery record:  kind 35647 (addressable, author-private). Per-issue send log.
 * Address book:     kind 13039 (replaceable, NIP-44 encrypted to self). Email contacts.
 */

// ─── Kind Numbers ──────────────────────────────────────────────────────────────

/** Newsletter publication config (addressable: pubkey + kind + d-tag) */
export const NEWSLETTER_CONFIG_KIND = 35733;

/** NIP-23 long-form published issue */
export const ISSUE_KIND = 30023;

/** NIP-23 draft (unpublished) */
export const DRAFT_KIND = 30024;

/** Delivery record — author-private (NIP-44 encrypted to self) */
export const DELIVERY_RECORD_KIND = 35647;

/** Encrypted email address book (replaceable, NIP-44 encrypted to self) */
export const ADDRESS_BOOK_KIND = 13039;

// ─── Subscription Tags ─────────────────────────────────────────────────────────

export const SUBSCRIBE_TAG = 'nostrmail-subscribe';
export const UNSUBSCRIBE_TAG = 'nostrmail-unsubscribe';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Newsletter {
  id: string;
  pubkey: string;
  slug: string;
  title: string;
  description?: string;
  image?: string;
  defaultRelays: string[];
  /** Minimum zap amount (in sats) for paid subscription */
  paidSats?: number;
  /** Stablezap offer address for paid tiers */
  stablezapOffer?: string;
  /** Refstr terms address */
  refstrTerms?: string;
  topics: string[];
  createdAt: number;
}

export interface Issue {
  id: string;
  pubkey: string;
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  publishedAt: number;
  content: string;
  topics: string[];
  /** The newsletter this issue belongs to (kind:d-tag from `a` tag) */
  newsletterSlug: string;
  /** Is this a draft (kind 30024) or published (kind 30023)? */
  isDraft: boolean;
  /** Is this a paid-only issue? */
  paidOnly: boolean;
}

export interface EmailContact {
  email: string;
  name?: string;
  subscribedAt: number;
  tags: string[];
  npub?: string;
  /** Double-opt-in consent timestamp (required for SMTP bridge) */
  consentAt?: number;
}

export interface DeliveryRecord {
  id: string;
  issueSlug: string;
  newsletterSlug: string;
  sentAt: number;
  nostrDelivered: number;
  nostrFailed: number;
  emailDelivered: number;
  emailFailed: number;
  channels: ('nostr' | 'smtp')[];
}

// ─── Parsers ───────────────────────────────────────────────────────────────────

type EventLike = {
  id: string;
  pubkey: string;
  kind: number;
  tags: string[][];
  content: string;
  created_at: number;
};

function tagValue(tags: string[][], name: string): string | undefined {
  return tags.find(([n]) => n === name)?.[1];
}

function tagValues(tags: string[][], name: string): string[] {
  return tags.filter(([n]) => n === name).map(([, v]) => v);
}

export function parseNewsletter(event: EventLike): Newsletter | null {
  const slug = tagValue(event.tags, 'd');
  const title = tagValue(event.tags, 'title');
  if (!slug || !title) return null;

  const paidSatsStr = tagValue(event.tags, 'paid_sats');
  const paidSats = paidSatsStr ? parseInt(paidSatsStr, 10) : undefined;

  return {
    id: event.id,
    pubkey: event.pubkey,
    slug,
    title,
    description: tagValue(event.tags, 'description') ?? tagValue(event.tags, 'summary'),
    image: tagValue(event.tags, 'image'),
    defaultRelays: tagValues(event.tags, 'relay'),
    paidSats: paidSats && !isNaN(paidSats) ? paidSats : undefined,
    stablezapOffer: tagValue(event.tags, 'stablezap'),
    refstrTerms: tagValue(event.tags, 'refstr'),
    topics: tagValues(event.tags, 't'),
    createdAt: event.created_at,
  };
}

export function parseIssue(event: EventLike): Issue | null {
  const slug = tagValue(event.tags, 'd');
  const title = tagValue(event.tags, 'title');
  if (!slug || !title) return null;

  // Derive newsletter slug from the `a` tag: "35733:<pubkey>:<slug>"
  const aRef = tagValue(event.tags, 'a') ?? '';
  const aParts = aRef.split(':');
  const newsletterSlug = aParts.length >= 3 ? aParts[2] : '';

  return {
    id: event.id,
    pubkey: event.pubkey,
    slug,
    title,
    summary: tagValue(event.tags, 'summary'),
    image: tagValue(event.tags, 'image'),
    publishedAt: parseInt(tagValue(event.tags, 'published_at') ?? String(event.created_at), 10),
    content: event.content,
    topics: tagValues(event.tags, 't'),
    newsletterSlug,
    isDraft: event.kind === DRAFT_KIND,
    paidOnly: tagValue(event.tags, 'paid') === 'true',
  };
}

// ─── Tag Builders ──────────────────────────────────────────────────────────────

export function newsletterATag(pubkey: string, slug: string): string {
  return `${NEWSLETTER_CONFIG_KIND}:${pubkey}:${slug}`;
}

export function buildIssueTags(opts: {
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  topics: string[];
  newsletterPubkey: string;
  newsletterSlug: string;
  /** Mark this issue as paid-only content */
  paidOnly?: boolean;
}): string[][] {
  const tags: string[][] = [
    ['d', opts.slug],
    ['title', opts.title],
    ['published_at', String(Math.floor(Date.now() / 1000))],
    ['a', newsletterATag(opts.newsletterPubkey, opts.newsletterSlug)],
    ['alt', `Newsletter issue: ${opts.title}`],
  ];
  if (opts.summary) tags.push(['summary', opts.summary]);
  if (opts.image) tags.push(['image', opts.image]);
  if (opts.paidOnly) tags.push(['paid', 'true']);
  for (const t of opts.topics) tags.push(['t', t]);
  return tags;
}

export function buildNewsletterTags(opts: {
  slug: string;
  title: string;
  description?: string;
  image?: string;
  topics: string[];
  relays?: string[];
  paidSats?: number;
  stablezapOffer?: string;
  refstrTerms?: string;
}): string[][] {
  const tags: string[][] = [
    ['d', opts.slug],
    ['title', opts.title],
    ['alt', `Pareto Pro Mail Newsletter: ${opts.title}`],
  ];
  if (opts.description) tags.push(['description', opts.description]);
  if (opts.image) tags.push(['image', opts.image]);
  for (const t of opts.topics) tags.push(['t', t]);
  if (opts.relays) {
    for (const r of opts.relays) tags.push(['relay', r]);
  }
  if (opts.paidSats && opts.paidSats > 0) tags.push(['paid_sats', String(opts.paidSats)]);
  if (opts.stablezapOffer) tags.push(['stablezap', opts.stablezapOffer]);
  if (opts.refstrTerms) tags.push(['refstr', opts.refstrTerms]);
  return tags;
}

// ─── Slug Helpers ──────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export function issueSlug(newsletterSlug: string, title: string): string {
  const base = slugify(title).slice(0, 50);
  return `${newsletterSlug}-${base}`;
}
