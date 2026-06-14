import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowLeft, Users, PenSquare, Calendar, ExternalLink, Globe, Mail, Hash, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useNewsletterIssues } from '@/hooks/useNewsletterIssues';
import { useNewsletterSubscribers, useMySubscriptionState } from '@/hooks/useNewsletterSubscribers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { nip19 } from 'nostr-tools';
import { newsletterATag, SUBSCRIBE_TAG, UNSUBSCRIBE_TAG, type NewsletterIssue } from '@/lib/newsletter';

function IssueCard({ issue }: { issue: NewsletterIssue }) {
  const date = new Date(issue.publishedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <Card className="hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200">
      {issue.image && (
        <div className="w-full h-40 overflow-hidden rounded-t-xl bg-slate-100 dark:bg-slate-800">
          <img src={issue.image} alt={issue.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-snug">{issue.title}</CardTitle>
        {issue.summary && <CardDescription className="text-sm">{issue.summary}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          {date}
        </div>
        {issue.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issue.topics.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
            ))}
          </div>
        )}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/issue/${issue.id}`}>Read Issue</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function NewsletterPage() {
  const { pubkey = '', slug = '' } = useParams<{ pubkey: string; slug: string }>();
  const { data: newsletter, isLoading } = useNewsletter(pubkey, slug);
  const { data: issues, isLoading: issuesLoading } = useNewsletterIssues(pubkey, slug);
  const { data: subscribers } = useNewsletterSubscribers(pubkey, slug);
  const { user } = useCurrentUser();
  const { data: isSubscribed } = useMySubscriptionState(pubkey, slug, user?.pubkey);
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const author = useAuthor(pubkey);
  const [subLoading, setSubLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useSeoMeta({
    title: newsletter ? `${newsletter.title} — NostrMail` : 'Newsletter — NostrMail',
    description: newsletter?.summary,
  });

  const authorName = author.data?.metadata?.name ?? nip19.npubEncode(pubkey).slice(0, 16) + '…';
  const aTag = newsletterATag(pubkey, slug);
  const isOwner = user?.pubkey === pubkey;

  async function handleSubscribe() {
    if (!user) return;
    setSubLoading(true);
    try {
      await publish({
        kind: 1,
        content: `Subscribed to nostr:${nip19.naddrEncode({ kind: 38973, pubkey, identifier: slug })}`,
        tags: [
          ['a', aTag],
          ['t', SUBSCRIBE_TAG],
        ],
      });
      toast({ title: 'Subscribed!', description: `You're now subscribed to ${newsletter?.title}.` });
      queryClient.invalidateQueries({ queryKey: ['my-subscription', pubkey, slug, user.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers', pubkey, slug] });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSubLoading(false);
    }
  }

  async function handleUnsubscribe() {
    if (!user) return;
    setSubLoading(true);
    try {
      await publish({
        kind: 1,
        content: `Unsubscribed from nostr:${nip19.naddrEncode({ kind: 38973, pubkey, identifier: slug })}`,
        tags: [
          ['a', aTag],
          ['t', UNSUBSCRIBE_TAG],
        ],
      });
      toast({ title: 'Unsubscribed', description: `You've unsubscribed from ${newsletter?.title}.` });
      queryClient.invalidateQueries({ queryKey: ['my-subscription', pubkey, slug, user.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers', pubkey, slug] });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSubLoading(false);
    }
  }

  function copySubscribeLink() {
    const url = `${window.location.origin}/subscribe/${pubkey}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!newsletter) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Newsletter not found.</p>
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 mb-8">
          {newsletter.image && (
            <div className="absolute inset-0 opacity-20">
              <img src={newsletter.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{newsletter.title}</h1>
              {newsletter.summary && (
                <p className="text-indigo-100 text-lg mb-4">{newsletter.summary}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-indigo-100">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {subscribers?.length ?? 0} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <PenSquare className="w-4 h-4" />
                  {issues?.length ?? 0} issues
                </span>
                <span>by {authorName}</span>
              </div>
              {newsletter.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {newsletter.topics.map((t) => (
                    <Badge key={t} className="bg-white/20 text-white border-white/30 text-xs">#{t}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {isOwner ? (
                <>
                  <Button asChild size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50">
                    <Link to={`/compose?newsletter=${slug}`}>
                      <PenSquare className="w-4 h-4 mr-1.5" />
                      New Issue
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/40 text-white hover:bg-white/10 bg-transparent"
                    onClick={copySubscribeLink}
                  >
                    {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copied ? 'Copied!' : 'Share Subscribe Link'}
                  </Button>
                </>
              ) : (
                <>
                  {user ? (
                    isSubscribed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/40 text-white hover:bg-white/10 bg-transparent"
                        onClick={handleUnsubscribe}
                        disabled={subLoading}
                      >
                        Unsubscribe
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-white text-indigo-700 hover:bg-indigo-50"
                        onClick={handleSubscribe}
                        disabled={subLoading}
                      >
                        Subscribe
                      </Button>
                    )
                  ) : (
                    <p className="text-sm text-indigo-100">Login to subscribe</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Links */}
        {(newsletter.website || newsletter.email) && (
          <div className="flex flex-wrap gap-3 mb-6">
            {newsletter.website && (
              <a
                href={newsletter.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Globe className="w-4 h-4" />
                {newsletter.website.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {newsletter.email && (
              <a
                href={`mailto:${newsletter.email}`}
                className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Mail className="w-4 h-4" />
                {newsletter.email}
              </a>
            )}
          </div>
        )}

        {/* About */}
        {newsletter.content && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base">About this newsletter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap text-sm leading-relaxed">
                {newsletter.content}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator className="mb-8" />

        {/* Issues */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Issues</h2>
          {isOwner && (
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Link to={`/compose?newsletter=${slug}`}>
                <PenSquare className="w-4 h-4 mr-1.5" />
                New Issue
              </Link>
            </Button>
          )}
        </div>

        {issuesLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent><Skeleton className="h-8 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : issues && issues.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {isOwner ? 'No issues yet. Compose your first one!' : 'No issues published yet.'}
              </p>
              {isOwner && (
                <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                  <Link to={`/compose?newsletter=${slug}`}>
                    <PenSquare className="w-4 h-4 mr-1.5" />
                    Compose Issue
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Nostr address info */}
        <Card className="mt-10 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500 flex items-center gap-1.5">
              <Hash className="w-4 h-4" />
              Nostr Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs font-mono bg-slate-50 dark:bg-slate-900 rounded-lg p-3 break-all text-slate-600 dark:text-slate-400">
              {nip19.naddrEncode({ kind: 38973, pubkey, identifier: slug })}
            </div>
            <p className="text-xs text-slate-400">
              This newsletter's permanent Nostr address. Anyone can look it up on any Nostr client.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
