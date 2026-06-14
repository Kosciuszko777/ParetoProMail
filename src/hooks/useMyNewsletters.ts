import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NEWSLETTER_KIND, parseNewsletterDefinition, type NewsletterDefinition } from '@/lib/newsletter';

export function useMyNewsletters() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['my-newsletters', user?.pubkey],
    enabled: !!user?.pubkey,
    queryFn: async (ctx) => {
      if (!user?.pubkey) return [];
      const events = await nostr.query(
        [{ kinds: [NEWSLETTER_KIND], authors: [user.pubkey], limit: 50 }],
        { signal: ctx.signal }
      );
      return events
        .map(parseNewsletterDefinition)
        .filter((n): n is NewsletterDefinition => n !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 30_000,
  });
}
