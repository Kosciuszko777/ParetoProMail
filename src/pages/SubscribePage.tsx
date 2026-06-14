import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Rss, Check, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useNewsletterSubscribers, useMySubscriptionState } from '@/hooks/useNewsletterSubscribers';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { nip19 } from 'nostr-tools';
import { newsletterATag, SUBSCRIBE_TAG, UNSUBSCRIBE_TAG } from '@/lib/newsletter';

export default function SubscribePage() {
  const { pubkey = '', slug = '' } = useParams<{ pubkey: string; slug: string }>();
  const { data: newsletter, isLoading } = useNewsletter(pubkey, slug);
  const { data: subscribers } = useNewsletterSubscribers(pubkey, slug);
  const { user } = useCurrentUser();
  const { data: isSubscribed } = useMySubscriptionState(pubkey, slug, user?.pubkey);
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const author = useAuthor(pubkey);
  const [subLoading, setSubLoading] = useState(false);

  useSeoMeta({
    title: newsletter ? `Subscribe to ${newsletter.title} — Pareto Pro Mail` : 'Subscribe — Pareto Pro Mail',
    description: newsletter?.summary,
  });

  const authorName = author.data?.metadata?.name ?? nip19.npubEncode(pubkey).slice(0, 16) + '…';
  const aTag = newsletterATag(pubkey, slug);

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
      toast({ title: 'Subscribed!', description: `You're subscribed to ${newsletter?.title}.` });
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

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/newsletter/${pubkey}/${slug}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 space-y-4">
              <Skeleton className="h-8 w-2/3 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ) : !newsletter ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Newsletter not found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center overflow-hidden">
            {newsletter.image && (
              <div className="w-full h-40 bg-slate-100 dark:bg-slate-800">
                <img src={newsletter.image} alt={newsletter.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="py-10 px-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
                {isSubscribed ? (
                  <Check className="w-7 h-7 text-white" />
                ) : (
                  <Rss className="w-7 h-7 text-white" />
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {isSubscribed ? 'You\'re subscribed!' : `Subscribe to ${newsletter.title}`}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">by {authorName}</p>

              {newsletter.summary && (
                <p className="text-slate-600 dark:text-slate-400 mt-3 mb-4">{newsletter.summary}</p>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-6">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {subscribers?.length ?? 0} subscribers
                </span>
              </div>

              {newsletter.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mb-6">
                  {newsletter.topics.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
                  ))}
                </div>
              )}

              {!user ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">Login with Nostr to subscribe</p>
                  <p className="text-xs text-slate-400">
                    Subscriptions are signed with your private key and stored on decentralized relays.
                    No email address required.
                  </p>
                </div>
              ) : isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-medium">
                    <Check className="w-4 h-4" />
                    Subscribed
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                    onClick={handleUnsubscribe}
                    disabled={subLoading}
                  >
                    Unsubscribe
                  </Button>
                  <p className="text-xs text-slate-400">
                    You'll receive new issues delivered directly via Nostr.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={handleSubscribe}
                    disabled={subLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Subscribe with Nostr
                  </Button>
                  <p className="text-xs text-slate-400">
                    Your subscription is a signed Nostr event — verifiable, portable, and private.
                    New issues will be delivered as encrypted gift wraps (NIP-59) to your Nostr inbox.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
