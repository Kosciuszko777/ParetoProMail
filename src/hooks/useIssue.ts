import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { ISSUE_KIND, DRAFT_KIND, parseIssue } from '@/lib/pareto';

/** Fetch a single published issue by pubkey + slug. Returns both parsed data and raw event. */
export function useIssue(pubkey: string, slug: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['issue', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [ISSUE_KIND], authors: [pubkey], '#d': [slug], limit: 1 }],
        { signal: ctx.signal },
      );
      if (!events[0]) return null;
      const parsed = parseIssue(events[0]);
      if (!parsed) return null;
      return { ...parsed, event: events[0] };
    },
    staleTime: 60_000,
  });
}

/** Fetch a single draft by pubkey + slug. */
export function useDraft(pubkey: string, slug: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['draft', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [DRAFT_KIND], authors: [pubkey], '#d': [slug], limit: 1 }],
        { signal: ctx.signal },
      );
      if (!events[0]) return null;
      return parseIssue(events[0]);
    },
    staleTime: 15_000,
  });
}
