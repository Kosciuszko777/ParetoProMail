import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { newsletterATag, SUBSCRIBE_TAG, UNSUBSCRIBE_TAG } from '@/lib/pareto';

export interface Subscriber {
  pubkey: string;
  subscribedAt: number;
  /** Phase 4: will be 'free' | 'paid' once Stablezap receipts are integrated */
  tier: 'free';
}

/**
 * Derive the active subscriber list for a newsletter from public opt-in events.
 * Latest event per pubkey wins: subscribe overrides unsubscribe and vice versa.
 */
export function useNewsletterSubscribers(pubkey: string, slug: string) {
  const { nostr } = useNostr();
  const aTag = newsletterATag(pubkey, slug);

  return useQuery({
    queryKey: ['newsletter-subscribers', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{
          kinds: [1],
          '#a': [aTag],
          '#t': [SUBSCRIBE_TAG, UNSUBSCRIBE_TAG],
          limit: 500,
        }],
        { signal: ctx.signal },
      );

      const latest = new Map<string, { subscribed: boolean; at: number }>();

      for (const ev of events) {
        const isSub = ev.tags.some(([n, v]) => n === 't' && v === SUBSCRIBE_TAG);
        const isUnsub = ev.tags.some(([n, v]) => n === 't' && v === UNSUBSCRIBE_TAG);
        if (!isSub && !isUnsub) continue;

        const existing = latest.get(ev.pubkey);
        if (!existing || ev.created_at > existing.at) {
          latest.set(ev.pubkey, { subscribed: isSub && !isUnsub, at: ev.created_at });
        }
      }

      const subscribers: Subscriber[] = [];
      for (const [pk, state] of latest) {
        if (state.subscribed) {
          subscribers.push({ pubkey: pk, subscribedAt: state.at, tier: 'free' });
        }
      }

      return subscribers.sort((a, b) => b.subscribedAt - a.subscribedAt);
    },
    staleTime: 60_000,
  });
}

/** Check if the current user is subscribed to a specific newsletter. */
export function useMySubscriptionState(newsletterPubkey: string, slug: string, myPubkey: string | undefined) {
  const { nostr } = useNostr();
  const aTag = newsletterATag(newsletterPubkey, slug);

  return useQuery({
    queryKey: ['my-subscription', newsletterPubkey, slug, myPubkey],
    enabled: !!newsletterPubkey && !!slug && !!myPubkey,
    queryFn: async (ctx) => {
      if (!myPubkey) return false;
      const events = await nostr.query(
        [{
          kinds: [1],
          authors: [myPubkey],
          '#a': [aTag],
          '#t': [SUBSCRIBE_TAG, UNSUBSCRIBE_TAG],
          limit: 10,
        }],
        { signal: ctx.signal },
      );
      if (events.length === 0) return false;
      const newest = events.sort((a, b) => b.created_at - a.created_at)[0];
      return newest.tags.some(([n, v]) => n === 't' && v === SUBSCRIBE_TAG)
        && !newest.tags.some(([n, v]) => n === 't' && v === UNSUBSCRIBE_TAG);
    },
    staleTime: 30_000,
  });
}
