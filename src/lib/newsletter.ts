// Newsletter NIP constants and types

export const NEWSLETTER_KIND = 38973; // Addressable: Newsletter Definition
export const EMAIL_CONTACT_LIST_KIND = 13039; // Replaceable: Encrypted Email Contact List
export const NEWSLETTER_ISSUE_KIND = 30023; // NIP-23 Long-form Content (reused)

export const SUBSCRIBE_TAG = 'nostrmail-subscribe';
export const UNSUBSCRIBE_TAG = 'nostrmail-unsubscribe';

export interface NewsletterDefinition {
  id: string;
  pubkey: string;
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  email?: string;
  website?: string;
  lang?: string;
  topics: string[];
  content: string;
  createdAt: number;
}

export interface NewsletterIssue {
  id: string;
  pubkey: string;
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  publishedAt: number;
  newsletterSlug: string;
  content: string;
  topics: string[];
}

export interface EmailContact {
  email: string;
  name?: string;
  subscribedAt: number;
  tags: string[];
  npub?: string;
}

export interface SubscriberState {
  pubkey: string;
  subscribed: boolean;
  timestamp: number;
}

export function parseNewsletterDefinition(event: { id: string; pubkey: string; tags: string[][]; content: string; created_at: number }): NewsletterDefinition | null {
  const d = event.tags.find(([n]) => n === 'd')?.[1];
  const title = event.tags.find(([n]) => n === 'title')?.[1];
  if (!d || !title) return null;

  return {
    id: event.id,
    pubkey: event.pubkey,
    slug: d,
    title,
    summary: event.tags.find(([n]) => n === 'summary')?.[1],
    image: event.tags.find(([n]) => n === 'image')?.[1],
    email: event.tags.find(([n]) => n === 'email')?.[1],
    website: event.tags.find(([n]) => n === 'website')?.[1],
    lang: event.tags.find(([n]) => n === 'lang')?.[1] ?? 'en',
    topics: event.tags.filter(([n]) => n === 't').map(([, v]) => v),
    content: event.content,
    createdAt: event.created_at,
  };
}

export function parseNewsletterIssue(event: { id: string; pubkey: string; tags: string[][]; content: string; created_at: number }): NewsletterIssue | null {
  const d = event.tags.find(([n]) => n === 'd')?.[1];
  const title = event.tags.find(([n]) => n === 'title')?.[1];
  if (!d || !title) return null;

  const newsletterRef = event.tags.find(([n]) => n === 'a')?.[1] ?? '';
  const parts = newsletterRef.split(':');
  const newsletterSlug = parts[2] ?? '';

  return {
    id: event.id,
    pubkey: event.pubkey,
    slug: d,
    title,
    summary: event.tags.find(([n]) => n === 'summary')?.[1],
    image: event.tags.find(([n]) => n === 'image')?.[1],
    publishedAt: parseInt(event.tags.find(([n]) => n === 'published_at')?.[1] ?? String(event.created_at), 10),
    newsletterSlug,
    content: event.content,
    topics: event.tags.filter(([n]) => n === 't').map(([, v]) => v),
  };
}

export function newsletterATag(pubkey: string, slug: string): string {
  return `${NEWSLETTER_KIND}:${pubkey}:${slug}`;
}

// ─── Mail Dispatch ────────────────────────────────────────────────────────────

export type DispatchStatus = 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export interface MailDispatch {
  /** Unique local ID */
  id: string;
  /** Nostr event ID of the kind:30023 issue */
  issueEventId: string;
  /** Issue title (for display) */
  issueTitle: string;
  /** Newsletter slug */
  newsletterSlug: string;
  /** Author pubkey hex */
  pubkey: string;
  /** Unix timestamp when to send (for immediate: ~now) */
  scheduledAt: number;
  /** Actual send timestamp (set when sending begins) */
  sentAt?: number;
  /** Number of recipients */
  recipientCount?: number;
  /** How many were successfully delivered */
  deliveredCount?: number;
  status: DispatchStatus;
  /** Optional note / error message */
  note?: string;
}

export const MAIL_DISPATCH_STORAGE_KEY = 'nostrmail:dispatches';

export function loadDispatches(pubkey: string): MailDispatch[] {
  try {
    const raw = localStorage.getItem(`${MAIL_DISPATCH_STORAGE_KEY}:${pubkey}`);
    if (!raw) return [];
    return JSON.parse(raw) as MailDispatch[];
  } catch {
    return [];
  }
}

export function saveDispatches(pubkey: string, dispatches: MailDispatch[]): void {
  localStorage.setItem(
    `${MAIL_DISPATCH_STORAGE_KEY}:${pubkey}`,
    JSON.stringify(dispatches)
  );
}

export function upsertDispatch(pubkey: string, dispatch: MailDispatch): void {
  const existing = loadDispatches(pubkey);
  const idx = existing.findIndex((d) => d.id === dispatch.id);
  if (idx >= 0) {
    existing[idx] = dispatch;
  } else {
    existing.unshift(dispatch);
  }
  saveDispatches(pubkey, existing);
}
