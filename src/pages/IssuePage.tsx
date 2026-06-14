import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowLeft, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import { MailDispatchPanel } from '@/components/MailDispatchPanel';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { parseNewsletterIssue } from '@/lib/newsletter';
import { nip19 } from 'nostr-tools';

export default function IssuePage() {
  const { id = '' } = useParams<{ id: string }>();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  const { data: event, isLoading } = useQuery({
    queryKey: ['issue-event', id],
    enabled: !!id,
    queryFn: async (ctx) => {
      const events = await nostr.query([{ ids: [id], kinds: [30023], limit: 1 }], { signal: ctx.signal });
      return events[0] ?? null;
    },
    staleTime: 60_000,
  });

  const issue = event ? parseNewsletterIssue(event) : null;

  useSeoMeta({
    title: issue ? `${issue.title} — NostrMail` : 'Issue — NostrMail',
    description: issue?.summary,
  });

  // Derive newsletter coordinates from the issue's `a` tag
  const aTagValue = event?.tags.find(([n]) => n === 'a')?.[1] ?? '';
  const [, issuePubkey = '', issueSlug = ''] = aTagValue.split(':');

  const isOwner = user?.pubkey === event?.pubkey;

  const date = issue
    ? new Date(issue.publishedAt * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!issue || !event) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Issue not found.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back nav */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to={issueSlug ? `/newsletter/${issuePubkey}/${issueSlug}` : '/'}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>

        {/* Header image */}
        {issue.image && (
          <div className="w-full h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-8">
            <img src={issue.image} alt={issue.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Title block */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
            {issue.title}
          </h1>

          {issue.summary && (
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">{issue.summary}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {date}
            </span>
            {issueSlug && (
              <Link
                to={`/newsletter/${issuePubkey}/${issueSlug}`}
                className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Hash className="w-4 h-4" />
                {issueSlug}
              </Link>
            )}
          </div>

          {issue.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {issue.topics.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* ── Mail Dispatch Panel (owner only) ── */}
        {isOwner && (
          <div className="mb-8">
            <MailDispatchPanel
              issueEvent={event}
              issueTitle={issue.title}
              newsletterPubkey={issuePubkey}
              newsletterSlug={issueSlug}
            />
          </div>
        )}

        {/* Article content */}
        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-xl leading-relaxed">
          {issue.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) {
              return <h1 key={i}>{line.slice(2)}</h1>;
            } else if (line.startsWith('## ')) {
              return <h2 key={i}>{line.slice(3)}</h2>;
            } else if (line.startsWith('### ')) {
              return <h3 key={i}>{line.slice(4)}</h3>;
            } else if (line.startsWith('---')) {
              return <hr key={i} />;
            } else if (line === '') {
              return <br key={i} />;
            } else {
              const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
              return (
                <p key={i}>
                  {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j}>{part.slice(2, -2)}</strong>;
                    } else if (part.startsWith('*') && part.endsWith('*')) {
                      return <em key={j}>{part.slice(1, -1)}</em>;
                    }
                    return part;
                  })}
                </p>
              );
            }
          })}
        </div>

        {/* Nostr event ID */}
        <Card className="mt-10 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-400 flex items-center gap-1.5">
              <Hash className="w-4 h-4" />
              Nostr Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono bg-slate-50 dark:bg-slate-900 rounded-lg p-3 break-all text-slate-500 dark:text-slate-400">
              {nip19.noteEncode(event.id)}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
