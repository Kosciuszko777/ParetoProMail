import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowLeft, Calendar, Clock, Copy, ExternalLink, UserPlus, UserMinus,
  Loader2, BookOpen, Share2, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';
import { useIssue } from '@/hooks/useIssue';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMySubscriptionState } from '@/hooks/useNewsletterSubscribers';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { nip19 } from 'nostr-tools';
import { NEWSLETTER_CONFIG_KIND, ISSUE_KIND, SUBSCRIBE_TAG, UNSUBSCRIBE_TAG, newsletterATag } from '@/lib/pareto';
import { renderMarkdown } from '@/lib/markdown';
import { ZapDialog } from '@/components/ZapDialog';
import { Paywall } from '@/components/Paywall';
import { usePaidStatus } from '@/hooks/usePaidStatus';
import { Zap } from 'lucide-react';

function ReadingTime({ content }: { content: string }) {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 230));
  return (
    <span className="flex items-center gap-1">
      <Clock className="w-3.5 h-3.5" />
      {mins} min read
    </span>
  );
}

export default function IssuePage() {
  const { pubkey = '', slug = '' } = useParams<{ pubkey: string; slug: string }>();
  const { data: issue, isLoading } = useIssue(pubkey, slug);
  const author = useAuthor(pubkey);
  const authorMeta = author.data?.metadata;
  const authorName = authorMeta?.name ?? nip19.npubEncode(pubkey).slice(0, 16) + '…';

  // Derive newsletter slug from the issue's newsletterSlug field
  const nlSlug = issue?.newsletterSlug ?? '';
  const { data: newsletter } = useNewsletter(pubkey, nlSlug);

  const { user } = useCurrentUser();
  const { data: isSubscribed } = useMySubscriptionState(pubkey, nlSlug, user?.pubkey);
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subLoading, setSubLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const naddr = pubkey && slug
    ? nip19.naddrEncode({ kind: ISSUE_KIND, pubkey, identifier: slug })
    : '';

  useSeoMeta({
    title: issue ? `${issue.title} — Pareto Pro Mail` : 'Issue — Pareto Pro Mail',
    description: issue?.summary,
  });

  const isOwner = user?.pubkey === pubkey;
  const aTag = newsletterATag(pubkey, nlSlug);

  // Check paid status
  const requiredSats = newsletter?.paidSats;
  const { totalSats: userZappedSats, isPaid, isLoading: paidLoading } = usePaidStatus(
    pubkey,
    user?.pubkey,
    requiredSats,
  );

  // Content is gated if: issue is paid-only, newsletter has a paid tier, user is not the owner, and user hasn't paid
  const isGated = !!(issue?.paidOnly && requiredSats && requiredSats > 0 && !isOwner && !isPaid);

  async function handleSubscribe() {
    if (!user || !nlSlug) return;
    setSubLoading(true);
    try {
      const nlNaddr = nip19.naddrEncode({ kind: NEWSLETTER_CONFIG_KIND, pubkey, identifier: nlSlug });
      await publish({
        kind: 1,
        content: `Subscribed to nostr:${nlNaddr}`,
        tags: [['a', aTag], ['t', SUBSCRIBE_TAG]],
      });
      toast({ title: 'Subscribed!', description: `You'll be notified when new issues are published.` });
      queryClient.invalidateQueries({ queryKey: ['my-subscription', pubkey, nlSlug, user.pubkey] });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSubLoading(false);
    }
  }

  async function handleUnsubscribe() {
    if (!user || !nlSlug) return;
    setSubLoading(true);
    try {
      const nlNaddr = nip19.naddrEncode({ kind: NEWSLETTER_CONFIG_KIND, pubkey, identifier: nlSlug });
      await publish({
        kind: 1,
        content: `Unsubscribed from nostr:${nlNaddr}`,
        tags: [['a', aTag], ['t', UNSUBSCRIBE_TAG]],
      });
      toast({ title: 'Unsubscribed' });
      queryClient.invalidateQueries({ queryKey: ['my-subscription', pubkey, nlSlug, user.pubkey] });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSubLoading(false);
    }
  }

  function handleCopyNaddr() {
    navigator.clipboard.writeText(naddr);
    setCopied(true);
    toast({ title: 'Copied!' });
    setTimeout(() => setCopied(false), 2000);
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <article className="max-w-3xl mx-auto">
          <Skeleton className="h-6 w-32 mb-6" />
          <Skeleton className="h-48 w-full rounded-2xl mb-6" />
          <Skeleton className="h-10 w-3/4 mb-3" />
          <Skeleton className="h-5 w-1/2 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </article>
      </AppLayout>
    );
  }

  // Not found
  if (!issue) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h2 className="font-serif text-lg font-semibold mb-2">Issue not found</h2>
            <p className="text-muted-foreground text-sm mb-4">This issue may have been removed or the address is incorrect.</p>
            <Button asChild variant="outline"><Link to="/">Go Home</Link></Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const date = new Date(issue.publishedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <AppLayout>
      <article className="max-w-3xl mx-auto">
        {/* Back navigation */}
        <div className="flex items-center gap-3 mb-6">
          {newsletter ? (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/newsletter/${pubkey}/${nlSlug}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                {newsletter.title}
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
            </Button>
          )}
        </div>

        {/* Cover image */}
        {issue.image && (
          <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden bg-muted mb-8">
            <img
              src={issue.image}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start gap-3 mb-3">
            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight flex-1">
              {issue.title}
            </h1>
            {issue.paidOnly && (
              <Badge variant="outline" className="shrink-0 mt-2 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700">
                <Zap className="w-3 h-3 mr-1" />
                Paid
              </Badge>
            )}
          </div>

          {issue.summary && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              {issue.summary}
            </p>
          )}

          {/* Author + meta */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to={`/newsletter/${pubkey}/${nlSlug}`}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              {authorMeta?.picture ? (
                <img
                  src={authorMeta.picture}
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover bg-muted"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
                  {authorName[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{authorName}</p>
                {newsletter && (
                  <p className="text-xs text-muted-foreground">{newsletter.title}</p>
                )}
              </div>
            </Link>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </span>
              <ReadingTime content={issue.content} />
            </div>
          </div>

          {/* Topics */}
          {issue.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {issue.topics.map((t) => (
                <Badge key={t} variant="outline" className="text-xs font-normal">#{t}</Badge>
              ))}
            </div>
          )}
        </header>

        <Separator className="mb-8" />

        {/* Article content — gated if paid-only */}
        {isGated && issue.event ? (
          <Paywall
            event={issue.event}
            newsletterTitle={newsletter?.title ?? 'this newsletter'}
            requiredSats={requiredSats ?? 0}
            currentSats={userZappedSats}
            isLoading={paidLoading}
          />
        ) : (
          <div
            className="prose-content font-sans text-[15px] md:text-base leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(issue.content) }}
          />
        )}

        <Separator className="my-10" />

        {/* Footer: subscribe CTA + share */}
        <footer className="space-y-6">
          {/* Subscribe CTA + Zap */}
          {newsletter && !isOwner && (
            <Card className="bg-accent/30">
              <CardContent className="py-6 px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold">
                      Enjoy this issue?
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Subscribe to <strong className="text-foreground">{newsletter.title}</strong> and never miss an update.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {issue.event && (
                      <ZapDialog target={issue.event}>
                        <Button variant="outline" size="sm">
                          <Zap className="w-4 h-4 mr-1.5" />
                          Zap
                        </Button>
                      </ZapDialog>
                    )}
                    {user ? (
                      isSubscribed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleUnsubscribe}
                          disabled={subLoading}
                        >
                          {subLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <UserMinus className="w-4 h-4 mr-1.5" />}
                          Unsubscribe
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleSubscribe}
                          disabled={subLoading}
                        >
                          {subLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1.5" />}
                          Subscribe
                        </Button>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">Sign in to subscribe</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Share / NIP-23 interop */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share this issue
              </CardTitle>
              <CardDescription>NIP-23 compatible — readable in any long-form Nostr client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted rounded-lg p-3 break-all">
                  {naddr}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyNaddr}
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Habla', url: `https://habla.news/a/${naddr}` },
                  { name: 'Highlighter', url: `https://highlighter.com/a/${naddr}` },
                  { name: 'Yakihonne', url: `https://yakihonne.com/article/${naddr}` },
                  { name: 'njump', url: `https://njump.me/${naddr}` },
                ].map(({ name, url }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border bg-card hover:bg-accent transition-colors"
                  >
                    {name}
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </footer>
      </article>
    </AppLayout>
  );
}
