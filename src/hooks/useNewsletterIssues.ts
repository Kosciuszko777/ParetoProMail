import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { NEWSLETTER_ISSUE_KIND, newsletterATag, parseNewsletterIssue, type NewsletterIssue } from '@/lib/newsletter';

export function useNewsletterIssues(pubkey: string, slug: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['newsletter-issues', pubkey, slug],
    enabled: !!pubkey && !!slug,
    queryFn: async (ctx) => {
      // Query all kind:30023 events authored by this pubkey that reference this newsletter
      const aTag = newsletterATag(pubkey, slug);
      const events = await nostr.query(
        [
          {
            kinds: [NEWSLETTER_ISSUE_KIND],
            authors: [pubkey],
            '#a': [aTag],
            limit: 100,
          },
          // Also try to fetch by author + kind (fallback if relay doesn't index `a`)
          {
            kinds: [NEWSLETTER_ISSUE_KIND],
            authors: [pubkey],
            limit: 100,
          },
        ],
        { signal: ctx.signal }
      );

      const issues = events
        .map(parseNewsletterIssue)
        .filter((i): i is NewsletterIssue => i !== null)
        .filter((i) => i.newsletterSlug === slug || i.newsletterSlug === '');

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = issues.filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });

      return unique.sort((a, b) => b.publishedAt - a.publishedAt);
    },
    staleTime: 30_000,
  });
}

export function useAllMyIssues(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['all-my-issues', pubkey],
    enabled: !!pubkey,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{ kinds: [NEWSLETTER_ISSUE_KIND], authors: [pubkey], limit: 200 }],
        { signal: ctx.signal }
      );
      return events
        .map(parseNewsletterIssue)
        .filter((i): i is NewsletterIssue => i !== null)
        .sort((a, b) => b.publishedAt - a.publishedAt);
    },
    staleTime: 30_000,
  });
}


