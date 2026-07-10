import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowLeft, BookOpen, PenLine, Calendar, ExternalLink, Settings, Users, Loader2, Check, UserPlus, UserMinus } from 'lucide-react';
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
import { nip19 } from 'nostr-tools';
import { NEWSLETTER_CONFIG_KIND, ISSUE_KIND, SUBSCRIBE_TAG, UNSUBSCRIBE_TAG, newsletterATag, type Issue } from '@/lib/pareto';

function IssueCard({ issue }: { issue: Issue }) {
  const date = new Date(issue.publishedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const naddr = nip19.naddrEncode({ kind: ISSUE_KIND, pubkey: issue.pubkey, identifier: issue.slug });

  return (
    <Card className="hover:shadow-sm transition-all">
      {issue.image && (
        <div className="w-full h-36 overflow-hidden rounded-t-xl bg-muted">
          <img src={issue.image} alt={issue.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-base leading-snug">{issue.title}</CardTitle>
        {issue.summary && <CardDescription className="text-sm">{issue.summary}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />{date}
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <a href={`https://njump.me/${naddr}`} target="_blank" rel="noopener noreferrer">
            Read on Nostr <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </a>
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
  const authorName = author.data?.metadata?.name ?? nip19.npubEncode(pubkey).slice(0, 16) + '…';
  const isOwner = user?.pubkey === pubkey;
  const [subLoading, setSubLoading] = useState(false);

  useSeoMeta({
    title: newsletter ? `${newsletter.title} — Pareto Pro Mail` : 'Newsletter — Pareto Pro Mail',
    description: newsletter?.description,
  });

  const aTag = newsletterATag(pubkey, slug);

  async function handleSubscribe() {
    if (!user) return;
    setSubLoading(true);
    try {
      const nlNaddr = nip19.naddrEncode({ kind: NEWSLETTER_CONFIG_KIND, pubkey, identifier: slug });
      await publish({
        kind: 1,
        content: `Subscribed to nostr:${nlNaddr}`,
        tags: [['a', aTag], ['t', SUBSCRIBE_TAG]],
      });
      toast({ title: 'Subscribed!', description: `You'll be notified when new issues are published.` });
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
      const nlNaddr = nip19.naddrEncode({ kind: NEWSLETTER_CONFIG_KIND, pubkey, identifier: slug });
      await publish({
        kind: 1,
        content: `Unsubscribed from nostr:${nlNaddr}`,
        tags: [['a', aTag], ['t', UNSUBSCRIBE_TAG]],
      });
      toast({ title: 'Unsubscribed' });
      queryClient.invalidateQueries({ queryKey: ['my-subscription', pubkey, slug, user.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers', pubkey, slug] });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSubLoading(false);
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!newsletter) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Newsletter not found.</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/">Go Home</Link></Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const naddr = nip19.naddrEncode({ kind: NEWSLETTER_CONFIG_KIND, pubkey, identifier: slug });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          {newsletter.image && (
            <div className="w-full h-48 rounded-2xl overflow-hidden bg-muted mb-6">
              <img src={newsletter.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-1">{newsletter.title}</h1>
              {newsletter.description && (
                <p className="text-muted-foreground text-lg">{newsletter.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>by {authorName}</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {subscribers?.length ?? 0} subscriber{(subscribers?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
              {newsletter.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {newsletter.topics.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs font-normal">#{t}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {isOwner ? (
                <>
                  <Button asChild size="sm">
                    <Link to={`/compose?newsletter=${slug}`}><PenLine className="w-4 h-4 mr-1.5" />Write</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/newsletter/${pubkey}/${slug}/settings`}><Settings className="w-4 h-4 mr-1.5" />Settings</Link>
                  </Button>
                </>
              ) : user ? (
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
                <p className="text-xs text-muted-foreground">Sign in to subscribe</p>
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Issues */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold">Issues</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{issues?.length ?? 0} published</span>
        </div>

        {issuesLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardHeader><Skeleton className="h-4 w-3/4" /></CardHeader></Card>
            ))}
          </div>
        ) : issues && issues.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {isOwner ? 'No issues yet. Write your first one!' : 'No issues published yet.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* naddr */}
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Nostr Address</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs font-mono bg-muted rounded-lg p-3 break-all block">{naddr}</code>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
