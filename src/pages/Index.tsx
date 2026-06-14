import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { PenSquare, Rss, Users, Zap, Lock, Globe, Plus, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useNewsletterSubscribers } from '@/hooks/useNewsletterSubscribers';
import { useAuthor } from '@/hooks/useAuthor';
import { nip19 } from 'nostr-tools';
import type { NewsletterDefinition } from '@/lib/newsletter';

function NewsletterCard({ newsletter }: { newsletter: NewsletterDefinition }) {
  const { data: subscribers } = useNewsletterSubscribers(newsletter.pubkey, newsletter.slug);

  return (
    <Card className="group hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200">
      <CardHeader className="pb-3">
        {newsletter.image && (
          <div className="w-full h-28 rounded-lg overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
            <img
              src={newsletter.image}
              alt={newsletter.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {newsletter.title}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 text-xs">
            <Rss className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
        {newsletter.summary && (
          <CardDescription className="text-sm">{newsletter.summary}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {subscribers ? `${subscribers.length} subscribers` : '—'}
          </span>
          {newsletter.email && (
            <span className="flex items-center gap-1 truncate">
              <Globe className="w-4 h-4 shrink-0" />
              <span className="truncate">{newsletter.email}</span>
            </span>
          )}
        </div>

        {newsletter.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {newsletter.topics.slice(0, 4).map((t) => (
              <Badge key={t} variant="outline" className="text-xs px-2 py-0">#{t}</Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button asChild size="sm" variant="default" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            <Link to={`/compose?newsletter=${newsletter.slug}`}>
              <PenSquare className="w-4 h-4 mr-1.5" />
              New Issue
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

function HeroSection() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white p-8 md:p-12 mb-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
            <Zap className="w-3 h-3 mr-1" />
            Powered by Nostr
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
          Decentralized Newsletters for Everyone
        </h1>
        <p className="text-indigo-100 text-lg mb-6 leading-relaxed">
          NostrMail lets you create, send, and subscribe to newsletters using your Nostr identity.
          No central server. No email service. Your audience, your keys, your freedom.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { icon: Lock, text: 'Email contacts encrypted with your key' },
            { icon: Globe, text: 'Deliver via Nostr or traditional email' },
            { icon: Rss, text: 'Subscribe with npub — no email needed' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-indigo-100">
              <Icon className="w-4 h-4 text-indigo-200" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoggedOutDashboard() {
  return (
    <div>
      <HeroSection />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            icon: Rss,
            title: 'Create Your Newsletter',
            desc: 'Publish a newsletter identity linked to your Nostr npub. Use it as your mailing address.',
          },
          {
            icon: Lock,
            title: 'Private by Design',
            desc: 'Email contacts are encrypted with NIP-44 and stored on decentralized relays. Only you can read them.',
          },
          {
            icon: Users,
            title: 'Nostr-native Subscriptions',
            desc: 'Subscribers can opt in using just their npub. No email address required for Nostr users.',
          },
          {
            icon: Globe,
            title: 'Email Bridge Support',
            desc: 'Link a traditional email address for subscribers who prefer classic email delivery.',
          },
          {
            icon: PenSquare,
            title: 'Rich Newsletter Issues',
            desc: 'Write issues in Markdown, published as NIP-23 long-form events — permanent and censorship-resistant.',
          },
          {
            icon: Zap,
            title: 'Open Protocol',
            desc: 'Based on a new Nostr NIP (kind 38973). Any app can implement compatible newsletters.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-2">
                <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-dashed mt-8">
        <CardContent className="py-12 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">Login with your Nostr account to create and manage newsletters</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Use the Login button in the top right to get started</p>
        </CardContent>
      </Card>
    </div>
  );
}

function LoggedInDashboard() {
  const { user } = useCurrentUser();
  const { data: newsletters, isLoading } = useMyNewsletters();
  const author = useAuthor(user?.pubkey ?? '');
  const displayName = author.data?.metadata?.name ?? (user?.pubkey ? nip19.npubEncode(user.pubkey).slice(0, 12) + '…' : 'You');

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {displayName}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your decentralized newsletters</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
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
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
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
            <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
              <Rss className="w-7 h-7 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">No newsletters yet</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
              Create your first newsletter and start building your decentralized audience on Nostr.
            </p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <Link to="/newsletter/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Newsletter
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* NIP info card */}
      <Card className="mt-10 border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30">
        <CardHeader>
          <CardTitle className="text-base text-indigo-700 dark:text-indigo-300">About the NostrMail Protocol</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
          <p>
            NostrMail is built on a new open Nostr NIP. Newsletters are published as <strong>kind 38973</strong> addressable events.
            Issues are <strong>kind 30023</strong> long-form events (NIP-23). Subscriptions use <strong>kind 1</strong> notes tagged
            with <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">nostrmail-subscribe</code>.
          </p>
          <p>
            Email contacts are stored as <strong>kind 13039</strong> replaceable events, encrypted with{' '}
            <strong>NIP-44</strong> (encrypt-to-self). No relay or third party can read your subscriber list.
          </p>
          <p>
            Deliveries to Nostr subscribers use <strong>NIP-59 gift wraps</strong>. Traditional email delivery is
            handled by optional bridge services that verify Nostr event signatures.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const Index = () => {
  useSeoMeta({
    title: 'NostrMail — Decentralized Newsletter System',
    description: 'Create and send newsletters using your Nostr identity. Encrypted, decentralized, censorship-resistant.',
  });

  const { user } = useCurrentUser();

  return (
    <AppLayout>
      {user ? <LoggedInDashboard /> : <LoggedOutDashboard />}
    </AppLayout>
  );
};

export default Index;
