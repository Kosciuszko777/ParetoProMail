import { useSeoMeta } from '@unhead/react';
import { Users, Shield, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useNewsletterSubscribers, type Subscriber } from '@/hooks/useNewsletterSubscribers';
import { useAuthor } from '@/hooks/useAuthor';
import { nip19 } from 'nostr-tools';

function SubscriberRow({ subscriber }: { subscriber: Subscriber }) {
  const author = useAuthor(subscriber.pubkey);
  const meta = author.data?.metadata;
  const name = meta?.name ?? nip19.npubEncode(subscriber.pubkey).slice(0, 16) + '…';
  const date = new Date(subscriber.subscribedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 py-3">
      {meta?.picture ? (
        <img src={meta.picture} alt={name} className="w-9 h-9 rounded-full object-cover bg-muted" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
          {name[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{nip19.npubEncode(subscriber.pubkey)}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-xs font-normal">
          {subscriber.tier === 'free' ? 'Free' : 'Paid'}
        </Badge>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  );
}

function NewsletterSubscriberBlock({ pubkey, slug, title }: { pubkey: string; slug: string; title: string }) {
  const { data: subscribers, isLoading } = useNewsletterSubscribers(pubkey, slug);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-base">{title}</CardTitle>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {subscribers?.length ?? 0} subscriber{(subscribers?.length ?? 0) !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : subscribers && subscribers.length > 0 ? (
          <div className="divide-y">
            {subscribers.map((s) => <SubscriberRow key={s.pubkey} subscriber={s} />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No Nostr subscribers yet. Share your newsletter page to grow your audience.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubscribersPage() {
  useSeoMeta({ title: 'Subscribers — Pareto Pro Mail' });

  const { user } = useCurrentUser();
  const { data: newsletters, isLoading: nlLoading } = useMyNewsletters();

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Sign in to view your subscribers.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-muted-foreground" />
            <h1 className="font-serif text-2xl font-bold">Subscribers</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Derived from public opt-in events. No database — subscriber status is computed live from Nostr.
          </p>
        </div>

        {/* How subscriptions work */}
        <Card className="mb-6 bg-accent/30 border-dashed">
          <CardContent className="py-4 px-5 text-sm text-muted-foreground leading-relaxed space-y-1">
            <p>
              <strong className="text-foreground">How it works:</strong> A reader subscribes by publishing a signed <code className="bg-muted px-1 rounded text-xs">kind 1</code> note
              tagged with <code className="bg-muted px-1 rounded text-xs">nostrmail-subscribe</code> referencing your newsletter.
              To unsubscribe, they publish one tagged <code className="bg-muted px-1 rounded text-xs">nostrmail-unsubscribe</code>.
              The most recent event wins.
            </p>
            <p>
              <strong className="text-foreground">No subscriber database.</strong> This list is derived live from public relay queries.
              You own the data because you can always re-query it — no platform can take it away.
            </p>
          </CardContent>
        </Card>

        {/* Subscriber lists per newsletter */}
        {nlLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}><CardContent className="py-8"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : newsletters && newsletters.length > 0 ? (
          <div className="space-y-6">
            {newsletters.map((nl) => (
              <NewsletterSubscriberBlock key={nl.slug} pubkey={nl.pubkey} slug={nl.slug} title={nl.title} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Create a newsletter first to see subscribers.</p>
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {/* Phase 4 placeholders */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-dashed bg-accent/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <CardTitle className="font-serif text-sm text-muted-foreground">Paid Subscribers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Phase 4: Paid tier status will be derived from Stablezap payment receipts — no subscriber database needed.
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed bg-accent/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <CardTitle className="font-serif text-sm text-muted-foreground">Email Contacts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Phase 3: Email contacts will be stored in an NIP-44 encrypted address book. Only you can read them.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
