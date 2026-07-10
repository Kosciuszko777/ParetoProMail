import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NEWSLETTER_CONFIG_KIND, parseNewsletter, type Newsletter } from '@/lib/pareto';

export function useMyNewsletters() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['my-newsletters', user?.pubkey],
    enabled: !!user?.pubkey,
    queryFn: async (ctx) => {
      if (!user?.pubkey) return [];
      const events = await nostr.query(
        [{ kinds: [NEWSLETTER_CONFIG_KIND], authors: [user.pubkey], limit: 50 }],
        { signal: ctx.signal },
      );
      return events
        .map(parseNewsletter)
        .filter((n): n is Newsletter => n !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 30_000,
  });
}
