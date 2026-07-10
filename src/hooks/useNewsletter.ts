import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NEWSLETTER_CONFIG_KIND, parseNewsletter } from '@/lib/pareto';

export function useNewsletter(pubkey: string, slug: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['newsletter', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [NEWSLETTER_CONFIG_KIND], authors: [pubkey], '#d': [slug], limit: 1 }],
        { signal: ctx.signal },
      );
      if (!events[0]) return null;
      return parseNewsletter(events[0]);
    },
    staleTime: 30_000,
  });
}
