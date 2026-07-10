import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { ISSUE_KIND, DRAFT_KIND, parseIssue, newsletterATag, type Issue } from '@/lib/pareto';

/** Published issues for a specific newsletter. */
export function useNewsletterIssues(pubkey: string, slug: string) {
  const { nostr } = useNostr();
  const aTag = newsletterATag(pubkey, slug);

  return useQuery({
    queryKey: ['newsletter-issues', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [ISSUE_KIND], authors: [pubkey], '#a': [aTag], limit: 100 }],
        { signal: ctx.signal },
      );
      return events
        .map(parseIssue)
        .filter((i): i is Issue => i !== null && !i.isDraft)
        .sort((a, b) => b.publishedAt - a.publishedAt);
    },
    staleTime: 30_000,
  });
}

/** All published issues by the current user (across newsletters). */
export function useAllMyIssues(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['all-my-issues', pubkey],
    enabled: !!pubkey,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [ISSUE_KIND], authors: [pubkey], limit: 200 }],
        { signal: ctx.signal },
      );
      return events
        .map(parseIssue)
        .filter((i): i is Issue => i !== null)
        .sort((a, b) => b.publishedAt - a.publishedAt);
    },
    staleTime: 30_000,
  });
}

/** Drafts (kind 30024) by the current user for a specific newsletter. */
export function useMyDrafts(pubkey: string, slug: string) {
  const { nostr } = useNostr();
  const aTag = newsletterATag(pubkey, slug);

  return useQuery({
    queryKey: ['my-drafts', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [DRAFT_KIND], authors: [pubkey], '#a': [aTag], limit: 50 }],
        { signal: ctx.signal },
      );
      return events
        .map(parseIssue)
        .filter((i): i is Issue => i !== null)
        .sort((a, b) => b.publishedAt - a.publishedAt);
    },
    staleTime: 15_000,
  });
}

/** All drafts by the current user (across all newsletters). */
export function useAllMyDrafts(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['all-my-drafts', pubkey],
    enabled: !!pubkey,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [DRAFT_KIND], authors: [pubkey], limit: 100 }],
        { signal: ctx.signal },
      );
      return events
        .map(parseIssue)
        .filter((i): i is Issue => i !== null)
        .sort((a, b) => b.publishedAt - a.publishedAt);
    },
    staleTime: 15_000,
  });
}
