import { useSeoMeta } from '@unhead/react';
import { Users, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useNewsletterSubscribers, type Subscriber } from '@/hooks/useNewsletterSubscribers';
import { usePaidSubscribers } from '@/hooks/usePaidStatus';
import { useAuthor } from '@/hooks/useAuthor';
import { nip19 } from 'nostr-tools';
import type { Newsletter } from '@/lib/pareto';

function SubscriberRow({ subscriber, paidSats }: { subscriber: Subscriber; paidSats?: number }) {
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
        {paidSats && paidSats > 0 ? (
          <Badge variant="default" className="text-xs font-normal bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
            <Zap className="w-3 h-3 mr-0.5" />
            {paidSats.toLocaleString()} sats
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs font-normal">Free</Badge>
        )}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  );
}

function PaidSubscriberRow({ pubkey, totalSats }: { pubkey: string; totalSats: number }) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const name = meta?.name ?? nip19.npubEncode(pubkey).slice(0, 16) + '…';

  return (
    <div className="flex items-center gap-3 py-3">
      {meta?.picture ? (
        <img src={meta.picture} alt={name} className="w-9 h-9 rounded-full object-cover bg-muted" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300">
          {name[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{nip19.npubEncode(pubkey)}</p>
      </div>
      <Badge variant="default" className="text-xs font-normal bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shrink-0">
        <Zap className="w-3 h-3 mr-0.5" />
        {totalSats.toLocaleString()} sats
      </Badge>
    </div>
  );
}

function PaidSubscribersBlock({ newsletter }: { newsletter: Newsletter }) {
  const { data: paidSubs, isLoading } = usePaidSubscribers(newsletter.pubkey, newsletter.paidSats);

  if (!newsletter.paidSats || newsletter.paidSats <= 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <CardTitle className="font-serif text-base">{newsletter.title} — Paid</CardTitle>
          </div>
          {!isLoading && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {paidSubs?.length ?? 0} paid
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Readers who have zapped ≥ {newsletter.paidSats.toLocaleString()} sats
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : paidSubs && paidSubs.length > 0 ? (
          <div className="divide-y">
            {paidSubs.map((s) => (
              <PaidSubscriberRow key={s.pubkey} pubkey={s.pubkey} totalSats={s.totalSats} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No paid subscribers yet. Readers unlock paid content by zapping you ≥ {newsletter.paidSats.toLocaleString()} sats.
          </p>
        )}
      </CardContent>
    </Card>
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

  const hasPaidTier = newsletters?.some((nl) => nl.paidSats && nl.paidSats > 0);

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
            Derived from public events and zap receipts. No database — subscriber status is computed live from Nostr.
          </p>
        </div>

        {/* How subscriptions work */}
        <Card className="mb-6 bg-accent/30 border-dashed">
          <CardContent className="py-4 px-5 text-sm text-muted-foreground leading-relaxed space-y-1">
            <p>
              <strong className="text-foreground">Free subscribers:</strong> Readers subscribe by publishing a signed <code className="bg-muted px-1 rounded text-xs">kind 1</code> note
              tagged with <code className="bg-muted px-1 rounded text-xs">nostrmail-subscribe</code>.
              The most recent subscribe/unsubscribe event per pubkey wins.
            </p>
            <p>
              <strong className="text-foreground">Paid subscribers:</strong> Readers who zap you at least the configured sats threshold are
              automatically recognized as paid subscribers. Status is derived from public zap receipts (kind 9735) — no payment processor needed.
            </p>
          </CardContent>
        </Card>

        {nlLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}><CardContent className="py-8"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : newsletters && newsletters.length > 0 ? (
          <div className="space-y-6">
            {/* Paid subscribers section */}
            {hasPaidTier && (
              <>
                {newsletters.filter((nl) => nl.paidSats && nl.paidSats > 0).map((nl) => (
                  <PaidSubscribersBlock key={`paid-${nl.slug}`} newsletter={nl} />
                ))}
                <Separator />
              </>
            )}

            {/* Free/all subscribers */}
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
      </div>
    </AppLayout>
  );
}
