import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { PenLine, Plus, BookOpen, ExternalLink, Settings, Rss, FileText, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useNewsletterIssues } from '@/hooks/useNewsletterIssues';
import { useAuthor } from '@/hooks/useAuthor';
import { nip19 } from 'nostr-tools';
import type { Newsletter } from '@/lib/pareto';

function NewsletterCard({ newsletter }: { newsletter: Newsletter }) {
  const { data: issues } = useNewsletterIssues(newsletter.pubkey, newsletter.slug);

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      {newsletter.image && (
        <div className="w-full h-32 rounded-t-xl overflow-hidden bg-muted">
          <img src={newsletter.image} alt={newsletter.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-serif text-lg group-hover:text-primary/80 transition-colors">
            {newsletter.title}
          </CardTitle>
        </div>
        {newsletter.description && (
          <CardDescription className="text-sm line-clamp-2">{newsletter.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {issues ? `${issues.length} issue${issues.length !== 1 ? 's' : ''}` : '—'}
          </span>
        </div>

        {newsletter.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {newsletter.topics.slice(0, 4).map((t) => (
              <Badge key={t} variant="outline" className="text-xs px-2 py-0 font-normal">#{t}</Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/compose?newsletter=${newsletter.slug}`}>
              <PenLine className="w-4 h-4 mr-1.5" />
              Write
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`/newsletter/${newsletter.pubkey}/${newsletter.slug}`}>
              <ExternalLink className="w-4 h-4 mr-1.5" />
              View
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/newsletter/${newsletter.pubkey}/${newsletter.slug}/settings`}>
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LoggedOutView() {
  return (
    <div>
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16 pt-8">
        <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Your words, your keys,<br />your audience.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          Pareto Pro Mail is a newsletter engine built on Nostr. Every issue is a signed NIP-23 event
          — censorship-resistant, portable, and readable in any compatible client. Delivery is layered on top;
          the publication is yours forever.
        </p>
        <p className="text-sm text-muted-foreground">Sign in with Nostr to start writing.</p>
      </div>

      {/* Three pillars */}
      <div className="grid sm:grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: FileText,
            title: 'Publication',
            desc: 'Every issue is a NIP-23 long-form event (kind 30023). Canonical, signed, readable in Habla, Highlighter, Yakihonne — no lock-in.',
          },
          {
            icon: Rss,
            title: 'Delivery',
            desc: 'Fan out to Nostr subscribers via notifications/DMs or to email subscribers via an isolated SMTP bridge. The same issue, two channels.',
          },
          {
            icon: Shield,
            title: 'Honest Boundary',
            desc: 'The canonical issue on Nostr is self-owned. Email delivery is standard email — normal metadata, no E2E. We never pretend otherwise.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-2">
                <Icon className="w-5 h-5 text-accent-foreground" />
              </div>
              <CardTitle className="font-serif text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* NIP-23 interop */}
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Every published issue resolves by <code className="bg-muted px-1 rounded text-xs">naddr</code> and renders
            in any NIP-23 client. Pareto Pro Mail adds delivery, subscriptions, and monetization on top
            — without breaking the canonical artifact.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoggedInView() {
  const { user } = useCurrentUser();
  const { data: newsletters, isLoading } = useMyNewsletters();
  const author = useAuthor(user?.pubkey ?? '');
  const displayName = author.data?.metadata?.name ?? (user?.pubkey ? nip19.npubEncode(user.pubkey).slice(0, 14) + '…' : 'Writer');

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-2xl font-bold">Welcome, {displayName}</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">Your newsletters and publications</p>
        </div>
        <Button asChild>
          <Link to="/newsletter/new">
            <Plus className="w-4 h-4 mr-2" />
            New Newsletter
          </Link>
        </Button>
      </div>

      {isLoading ? (
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
      ) : newsletters && newsletters.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsletters.map((n) => (
            <NewsletterCard key={n.id} newsletter={n} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <PenLine className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-lg font-semibold mb-2">No newsletters yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
              Create your first newsletter and start publishing NIP-23 issues to the world.
            </p>
            <Button asChild>
              <Link to="/newsletter/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Newsletter
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Protocol info */}
      <Card className="mt-12 bg-accent/30">
        <CardHeader>
          <CardTitle className="font-serif text-sm text-muted-foreground">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            Newsletters are <strong className="text-foreground">kind 35733</strong> config events.
            Issues are standard <strong className="text-foreground">NIP-23 kind 30023</strong> long-form events
            — readable in Habla, Highlighter, Yakihonne, and any NIP-23 client.
            Drafts autosave as <strong className="text-foreground">kind 30024</strong>.
          </p>
          <p>
            Subscriber state is derived from public events and Stablezap receipts — no database.
            Email contacts are <strong className="text-foreground">NIP-44 encrypted to self</strong> (kind 13039).
            The SMTP bridge is isolated and optional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const Index = () => {
  useSeoMeta({
    title: 'Pareto Pro Mail — Decentralized Newsletter Engine',
    description: 'Publish NIP-23 newsletters on Nostr. Censorship-resistant, self-owned, delivered everywhere.',
  });

  const { user } = useCurrentUser();

  return (
    <AppLayout>
      {user ? <LoggedInView /> : <LoggedOutView />}
    </AppLayout>
  );
};

export default Index;
