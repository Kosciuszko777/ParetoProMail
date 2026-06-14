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
