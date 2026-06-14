import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NEWSLETTER_KIND, parseNewsletterDefinition } from '@/lib/newsletter';

export function useNewsletter(pubkey: string, slug: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['newsletter', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [NEWSLETTER_KIND], authors: [pubkey], '#d': [slug], limit: 1 }],
        { signal: ctx.signal }
      );
      const event = events[0];
      if (!event) return null;
      return parseNewsletterDefinition(event);
    },
    staleTime: 30_000,
  });
}
