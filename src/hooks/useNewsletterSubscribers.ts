import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { newsletterATag, SUBSCRIBE_TAG, UNSUBSCRIBE_TAG, type SubscriberState } from '@/lib/newsletter';

export function useNewsletterSubscribers(pubkey: string, slug: string) {
  const { nostr } = useNostr();
  const aTag = newsletterATag(pubkey, slug);

  return useQuery({
    queryKey: ['newsletter-subscribers', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [
          {
            kinds: [1],
            '#a': [aTag],
            '#t': [SUBSCRIBE_TAG, UNSUBSCRIBE_TAG],
            limit: 500,
          },
        ],
        { signal: ctx.signal }
      );

      // Track latest subscribe/unsubscribe per pubkey
      const latestByPubkey = new Map<string, { subscribed: boolean; timestamp: number }>();

      for (const event of events) {
        const tags = event.tags.map(([, v]) => v);
        const isSubscribe = event.tags.some(([n, v]) => n === 't' && v === SUBSCRIBE_TAG);
        const isUnsubscribe = event.tags.some(([n, v]) => n === 't' && v === UNSUBSCRIBE_TAG);
        
        if (!isSubscribe && !isUnsubscribe) continue;
        
        const existing = latestByPubkey.get(event.pubkey);
        if (!existing || event.created_at > existing.timestamp) {
          latestByPubkey.set(event.pubkey, {
            subscribed: isSubscribe && !isUnsubscribe,
            timestamp: event.created_at,
          });
        }
        
        // suppress unused var
        void tags;
      }

      const subscribers: SubscriberState[] = [];
      for (const [pk, state] of latestByPubkey.entries()) {
        subscribers.push({ pubkey: pk, ...state });
      }

      return subscribers.filter((s) => s.subscribed);
    },
    staleTime: 60_000,
  });
}

export function useMySubscriptionState(newsletterPubkey: string, slug: string, myPubkey: string | undefined) {
  const { nostr } = useNostr();
  const aTag = newsletterATag(newsletterPubkey, slug);

  return useQuery({
    queryKey: ['my-subscription', newsletterPubkey, slug, myPubkey],
    enabled: !!newsletterPubkey && !!slug && !!myPubkey,
    queryFn: async (ctx) => {
      if (!myPubkey) return false;
      const events = await nostr.query(
        [
          {
            kinds: [1],
            authors: [myPubkey],
            '#a': [aTag],
            '#t': [SUBSCRIBE_TAG, UNSUBSCRIBE_TAG],
            limit: 20,
          },
        ],
        { signal: ctx.signal }
      );

      if (events.length === 0) return false;
      const latest = events.sort((a, b) => b.created_at - a.created_at)[0];
      return latest.tags.some(([n, v]) => n === 't' && v === SUBSCRIBE_TAG) &&
        !latest.tags.some(([n, v]) => n === 't' && v === UNSUBSCRIBE_TAG);
    },
    staleTime: 30_000,
  });
}
