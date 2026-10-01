import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import {
  PenLine, Plus, BookOpen, ExternalLink, Settings,
  Shield, Lock, KeyRound, EyeOff, Bitcoin, Zap, Mail, UserCheck,
  Upload, Send, LayoutTemplate, ArrowRight, Check, Fingerprint,
  Building2, Coins, Users, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import AuthDialog from '@/components/auth/AuthDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useNewsletterIssues } from '@/hooks/useNewsletterIssues';
import { useAuthor } from '@/hooks/useAuthor';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';
import type { Newsletter } from '@/lib/pareto';

// ─── Shared CTA button that opens the auth dialog ──────────────────────────────
function GetStartedButton({
  children,
  className,
  variant = 'default',
  size = 'lg',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'lg';
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <AuthDialog isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ─── Dashboard card (logged-in) ────────────────────────────────────────────────
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
          {newsletter.paidSats && newsletter.paidSats > 0 && (
            <Badge variant="outline" className="shrink-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 text-xs">
              <Zap className="w-3 h-3 mr-0.5" />Paid
            </Badge>
          )}
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

// ─── Landing page (logged-out) ─────────────────────────────────────────────────
function LoggedOutView() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* ambient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Self-custodial newsletter platform
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                Own your audience.
                <br />
                <span className="text-primary">Trust no platform.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
                A newsletter &amp; client-relationship platform built for people who refuse to
                hand their subscriber list to someone else. Censorship-resistant, protected by
                cryptography, and entirely under your control.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <GetStartedButton className="rounded-full px-7 shadow-sm">
                  Get started free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </GetStartedButton>
                <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> No cookies</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-primary" /> Login with Nostr or email</span>
              </div>
            </div>

            {/* Right: hero image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border shadow-xl bg-card">
                <img
                  src="/hero.webp"
                  alt="Secure, sovereign newsletter platform"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* floating trust chip */}
              <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2.5 rounded-2xl border bg-card/95 backdrop-blur px-4 py-3 shadow-lg">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">End-to-end control</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your keys. Your list. Your rules.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY: the problem with the incumbents ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Your subscriber list is too valuable to leave on someone else's server.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The platforms you trust with your audience keep getting breached, locked, or
            weaponized against the people who built them.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            {
              name: 'Substack',
              desc: 'Writers deplatformed and payments frozen — your audience held hostage by someone else’s policy.',
            },
            {
              name: 'Mailchimp',
              desc: 'Repeated breaches exposed customer lists and API keys, handing attackers a direct line to your readers.',
            },
            {
              name: 'Brevo & friends',
              desc: 'Centralized ESPs store your contacts in plaintext — one phishing email to support staff can leak everything.',
            },
          ].map((item) => (
            <Card key={item.name} className="border-destructive/20 bg-destructive/[0.03]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <EyeOff className="w-4 h-4 text-destructive" />
                  </div>
                  <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-2xl border bg-accent/40 p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Fingerprint className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold mb-1">We can’t leak what we never hold.</h3>
            <p className="text-muted-foreground leading-relaxed">
              There is no central database of your contacts to hack, no plaintext list for a
              phisher to steal, and no account for a provider to freeze. Your list lives with you,
              secured by the same cryptography that protects billions in Bitcoin.
            </p>
          </div>
        </div>
      </section>

      {/* ── TRUST / SOVEREIGNTY PILLARS ──────────────────────────────────────── */}
      <section className="bg-accent/30 border-y">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 bg-card">Built on trust, not lock-in</Badge>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              A relationship with your readers — not a rented audience.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Everything is designed so you stay in control of who you reach and how they reach you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: KeyRound,
                title: 'Self-custodial',
                desc: 'You hold the keys to your identity and your audience. No platform can take them away.',
              },
              {
                icon: Shield,
                title: 'Censorship-resistant',
                desc: 'Published to an open network. No single company can silence you or your readers.',
              },
              {
                icon: Lock,
                title: 'Cryptographically secure',
                desc: 'Every message is signed. Readers always know it truly came from you — phishing-proof.',
              },
              {
                icon: EyeOff,
                title: 'Private by default',
                desc: 'No cookies. No tracking pixels. No hidden customer-data warehouse. Privacy is optional-total.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="font-serif text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE DISTILLED PROPOSITION (manifesto) ────────────────────────────── */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        {/* ambient texture */}
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,white,transparent_55%),radial-gradient(circle_at_80%_80%,white,transparent_55%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-xs font-medium text-primary-foreground/80 mb-8">
              <Shield className="w-3.5 h-3.5" />
              The distilled proposition
            </div>

            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] mb-6">
              Shielded newsletter infrastructure for those who cannot afford to lose control of their audience.
            </h2>

            <p className="text-lg md:text-xl text-primary-foreground/70 leading-relaxed">
              No phone number. No mandatory email identity. No advertising profile.
              No unnecessary tracking.
            </p>
          </div>

          {/* Declarative ownership list */}
          <div className="mt-12 grid sm:grid-cols-2 gap-x-10 gap-y-px rounded-2xl border border-primary-foreground/15 overflow-hidden">
            {[
              { k: 'Your identity', v: 'is a keypair.' },
              { k: 'Your subscriber list', v: 'is encrypted.' },
              { k: 'Your audience', v: 'belongs to you.' },
              { k: 'Your payment relationships', v: 'belong to you.' },
              { k: 'Your content', v: 'can be published across Nostr.' },
              { k: 'Your distribution', v: 'no longer depends on a conventional email provider.' },
            ].map(({ k, v }) => (
              <div
                key={k}
                className="flex items-baseline gap-2 flex-wrap px-5 py-5 bg-primary-foreground/[0.04] border-b border-primary-foreground/10"
              >
                <span className="font-serif text-lg md:text-xl font-semibold">{k}</span>
                <span className="text-primary-foreground/70 text-base md:text-lg">{v}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-primary-foreground/60 max-w-2xl leading-relaxed">
            And increasingly, your distribution itself will no longer depend on a conventional
            email provider — the audience you build here stays portable, signed, and sovereign.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Up and running in minutes.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            No technical knowledge required. If you can send an email, you can own your audience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              icon: UserCheck,
              title: 'Sign in your way',
              desc: 'One click with Nostr for full sovereignty — or just use your email if you prefer the familiar way.',
            },
            {
              step: '02',
              icon: Sparkles,
              title: 'Choose your plan',
              desc: 'Start free. Upgrade any time. Pay with a card, or with Bitcoin & Lightning if you’d rather.',
            },
            {
              step: '03',
              icon: Upload,
              title: 'Upload your list',
              desc: 'Bring your existing subscribers. Contacts are encrypted to you — never stored in the clear.',
            },
            {
              step: '04',
              icon: Send,
              title: 'Publish & grow',
              desc: 'Write issues, launch campaigns, and build lasting relationships with the people who matter.',
            },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-serif text-3xl font-bold text-muted-foreground/30">{step}</span>
              </div>
              <h3 className="font-semibold text-lg mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <GetStartedButton className="rounded-full px-8 shadow-sm">
            Create your first newsletter
            <ArrowRight className="w-4 h-4 ml-2" />
          </GetStartedButton>
        </div>
      </section>

      {/* ── TEMPLATES & CAMPAIGNS ────────────────────────────────────────────── */}
      <section className="bg-accent/30 border-y">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4 bg-card">Templates & campaigns</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Beautiful campaigns, built for your world.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Start from professionally designed templates and launch multi-issue campaigns —
                from product launches to market commentary — in a workspace built for discerning
                audiences.
              </p>
              <ul className="space-y-3">
                {[
                  'Drag-free editor with live preview',
                  'Reusable templates for recurring campaigns',
                  'Schedule issues and track your reach',
                  'Paid tiers unlocked by Lightning — no processor',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Coins,
                  title: 'Crypto & Web3',
                  desc: 'Token updates, research notes, and community briefings for crypto-native readers.',
                },
                {
                  icon: Building2,
                  title: 'Finance & Markets',
                  desc: 'Market letters and investor updates with the trust signals finance demands.',
                },
                {
                  icon: Shield,
                  title: 'Family Offices',
                  desc: 'Discreet, private communication for high-net-worth relationships.',
                },
                {
                  icon: Users,
                  title: 'Communities',
                  desc: 'Membership newsletters and campaigns that keep your community close.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="bg-card hover:shadow-md transition-all hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYMENTS ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="rounded-3xl border bg-gradient-to-br from-card to-accent/30 p-8 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
          <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F7931A]/15 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-[#F7931A]" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Get paid in the money of the internet.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6 max-w-xl">
                Accept subscriptions and tips in Bitcoin and Lightning — instant, global, and
                yours to keep. No chargebacks, no processor holding your funds. Prefer a card?
                That works too. The choice is always yours.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm">
                  <Zap className="w-4 h-4 text-primary" /> Lightning zaps
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm">
                  <Bitcoin className="w-4 h-4 text-[#F7931A]" /> On-chain Bitcoin
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Traditional billing
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Settlement', value: 'Instant' },
                { label: 'Platform cut on zaps', value: '0%' },
                { label: 'Custody of funds', value: 'You' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border bg-card/80 backdrop-blur px-4 py-3">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
          <div className="relative">
            <LayoutTemplate className="w-10 h-10 mx-auto mb-5 opacity-80" />
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 max-w-2xl mx-auto">
              Build a newsletter no one can take from you.
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Start free today. Own your audience, protect your readers, and communicate with
              total confidence.
            </p>
            <GetStartedButton variant="secondary" className="rounded-full px-8 shadow-md">
              Get started free
              <ArrowRight className="w-4 h-4 ml-2" />
            </GetStartedButton>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Dashboard (logged-in) ─────────────────────────────────────────────────────
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
              Create your first newsletter and start publishing — fully owned, fully yours.
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

      {/* Trust reminder */}
      <Card className="mt-12 bg-accent/30">
        <CardHeader>
          <CardTitle className="font-serif text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Your audience is yours
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            Every issue you publish is cryptographically signed and stored on an open network —
            censorship-resistant and portable. Your subscriber contacts are encrypted to you and
            never held in plaintext.
          </p>
          <p>
            Accept subscriptions in <strong className="text-foreground">Bitcoin &amp; Lightning</strong> with
            zero platform cut, or keep it simple. The choice is always yours.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const Index = () => {
  useSeoMeta({
    title: 'Pareto Pro Mail — Own Your Audience. Trust No Platform.',
    description: 'A self-custodial newsletter & CRM platform. Censorship-resistant, protected by cryptography, private by default. Login with Nostr or email. Accept Bitcoin & Lightning.',
  });

  const { user } = useCurrentUser();

  return (
    <AppLayout fullWidth={!user}>
      {user ? (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <LoggedInView />
        </div>
      ) : (
        <LoggedOutView />
      )}
    </AppLayout>
  );
};

export default Index;
