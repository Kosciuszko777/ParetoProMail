import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  Check, ArrowRight, Shield, Lock, KeyRound, Crown, Sparkles, Server,
  Gift, Megaphone, Layers, Mail as MailIcon, Zap, Bitcoin, Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import AuthDialog from '@/components/auth/AuthDialog';
import { PricingConfigurator } from '@/components/pricing/PricingConfigurator';
import { ICON_MAP } from '@/components/pricing/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePlan } from '@/hooks/usePlan';
import { cn } from '@/lib/utils';
import {
  PLANS, BUSINESS_PLAN, SOVEREIGN_PLAN, BUSINESS_USE_CASES, ADD_ONS, BUNDLES,
  SPECIAL_SOLUTIONS, REFERRAL_TIERS, formatCHF, annualMonthly, type Plan, type PlanId,
} from '@/lib/pricing';

// ─── Plan price display ────────────────────────────────────────────────────────
function PlanPrice({ plan, annual }: { plan: Plan; annual: boolean }) {
  if (plan.priceMonthly === null) {
    return <div className="font-serif text-4xl font-bold">Custom</div>;
  }
  const monthly = annual && plan.priceMonthly > 0 ? annualMonthly(plan.priceMonthly) : plan.priceMonthly;
  return (
    <div className="flex items-baseline gap-1.5">
      {plan.pricePrefix && <span className="text-sm text-muted-foreground font-medium">{plan.pricePrefix}</span>}
      <span className="font-serif text-4xl font-bold tabular-nums">{formatCHF(monthly)}</span>
      <span className="text-sm text-muted-foreground">/ month</span>
    </div>
  );
}

// ─── Primary plan card (Free / Creator / Pro) ──────────────────────────────────
function PlanCard({
  plan, annual, onChoose, highlight,
}: {
  plan: Plan; annual: boolean; onChoose: (id: PlanId) => void; highlight?: boolean;
}) {
  return (
    <Card className={cn(
      'relative flex flex-col h-full',
      highlight && 'border-primary shadow-lg ring-1 ring-primary/20',
    )}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-sm px-3 py-0.5">{plan.badge}</Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm font-medium text-foreground/80">{plan.tagline}</CardDescription>
        <div className="pt-3"><PlanPrice plan={plan} annual={annual} /></div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <Button
          className="w-full mb-4"
          variant={highlight ? 'default' : 'outline'}
          onClick={() => onChoose(plan.id)}
        >
          {plan.cta}
        </Button>

        {plan.inheritsFrom && (
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Everything in {plan.inheritsFrom}, plus:
          </p>
        )}

        <ul className="space-y-2 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t italic">{plan.supporting}</p>
      </CardContent>
    </Card>
  );
}

// ─── Section heading helper ─────────────────────────────────────────────────────
function SectionTag({ children }: { children: React.ReactNode }) {
  return <Badge variant="outline" className="mb-4 bg-card">{children}</Badge>;
}

export default function PricingPage() {
  useSeoMeta({
    title: 'Pricing — Pareto Pro Mail',
    description: 'Start free with up to 5,000 contacts. We charge for infrastructure — not ownership. Modular plans, usage boosts, private relays and sovereign infrastructure. Priced in CHF.',
  });

  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { choosePlan, needsPlan } = usePlan(user?.pubkey);
  const [annual, setAnnual] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  // Choosing a plan: if logged in, record it and go to dashboard; else open auth.
  function handleChoose(planId: PlanId) {
    if (user) {
      choosePlan(planId);
      navigate('/');
    } else {
      setAuthOpen(true);
    }
  }

  function handleStartFree() {
    if (user) {
      choosePlan('free');
      navigate('/');
    } else {
      setAuthOpen(true);
    }
  }

  return (
    <AppLayout fullWidth>
      <div>
        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background" />
          <div className="max-w-5xl mx-auto px-4 pt-14 pb-16 md:pt-20 text-center">
            {needsPlan && (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Sparkles className="w-4 h-4" />
                Your keypair is ready — choose how you want to start.
              </div>
            )}

            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              Start free.<br />
              <span className="text-primary">Build what’s yours.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              <strong className="text-foreground">Up to 5,000 contacts free.</strong> Own your audience
              from day one. Add professional publishing, distribution and private infrastructure as you grow.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button size="lg" className="rounded-full px-8" onClick={handleStartFree}>
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
                <a href="#business">Explore Business Solutions</a>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              No phone required · No mandatory email identity · Full audience export · Encrypted ·
              Nostr-native · Fiat + Bitcoin
            </p>
          </div>
        </section>

        {/* ── PRICING PRINCIPLE ──────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-14 md:py-16">
          <div className="rounded-2xl border bg-accent/30 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl md:text-2xl font-bold mb-2">
                  We charge for infrastructure — not ownership.
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your identity, audience, content, subscriber data, payments, publications and export
                  stay yours at every tier. We separate <strong className="text-foreground">features</strong> from{' '}
                  <strong className="text-foreground">usage</strong> from{' '}
                  <strong className="text-foreground">infrastructure</strong> — so you add more emails,
                  contacts, publications, storage, team members, a dedicated IP or a private relay
                  without being forced to change your whole subscription.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Identity', 'Audience', 'Content', 'Subscriber data', 'Payments', 'Publications', 'Export'].map((x) => (
                    <span key={x} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                      <Check className="w-3 h-3 text-primary" />{x}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BILLING TOGGLE + PRIMARY TIERS ─────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 pb-6">
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={cn('text-sm font-medium', !annual && 'text-foreground', annual && 'text-muted-foreground')}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual((v) => !v)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                annual ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                annual && 'translate-x-6',
              )} />
            </button>
            <span className={cn('text-sm font-medium', annual && 'text-foreground', !annual && 'text-muted-foreground')}>
              Annual
            </span>
            <Badge variant="secondary" className="ml-1 text-xs">Save 20%</Badge>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-5 max-w-5xl mx-auto">
            <PlanCard plan={PLANS.free} annual={annual} onChoose={handleChoose} />
            <PlanCard plan={PLANS.creator} annual={annual} onChoose={handleChoose} />
            <PlanCard plan={PLANS.pro} annual={annual} onChoose={handleChoose} highlight />
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6 max-w-xl mx-auto">
            Free users retain full ownership and exportability. We never create artificial data lock-in.
          </p>
        </section>

        {/* ── CONFIGURATOR ───────────────────────────────────────────────────── */}
        <section id="configurator" className="bg-accent/30 border-y mt-14">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionTag>Build your own stack</SectionTag>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
                <Wand2 className="w-7 h-7 text-primary" />
                Configure your Pareto
              </h2>
              <p className="text-muted-foreground text-lg">
                Start with the plan you need. Add infrastructure as you grow.
              </p>
            </div>
            <PricingConfigurator annual={annual} onStart={handleChoose} />
          </div>
        </section>

        {/* ── ADD-ON MARKETPLACE ─────────────────────────────────────────────── */}
        <section id="add-ons" className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <SectionTag>Add-on marketplace</SectionTag>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">Build your own stack.</h2>
            <p className="text-muted-foreground text-lg">
              Start with the plan you need. Add infrastructure as you grow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADD_ONS.map((addon) => {
              const Icon = ICON_MAP[addon.icon] ?? Layers;
              return (
                <Card key={addon.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      {addon.badge && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700">
                          {addon.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2">{addon.name}</CardTitle>
                    <CardDescription className="text-sm">{addon.copy}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    {addon.packages && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {addon.packages.map((p) => (
                          <span key={p} className="text-xs rounded-md bg-muted px-2 py-1 font-medium">{p}</span>
                        ))}
                      </div>
                    )}
                    {addon.features && (
                      <ul className="space-y-1.5 mb-3">
                        {addon.features.slice(0, 6).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    )}
                    {addon.positioning && (
                      <p className="text-xs text-muted-foreground italic mb-3">{addon.positioning}</p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                      {addon.fromPrice !== undefined ? (
                        <span className="text-sm font-semibold">from {formatCHF(addon.fromPrice)}</span>
                      ) : <span />}
                      <Button size="sm" variant="ghost" className="text-primary" onClick={() => handleChoose('pro')}>
                        {addon.cta}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ── BUSINESS SOLUTIONS ─────────────────────────────────────────────── */}
        <section id="business" className="bg-primary text-primary-foreground border-y">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-xs font-medium mb-6">
                <Shield className="w-3.5 h-3.5" /> Business Solutions
              </div>
              <h2 className="font-serif text-3xl md:text-5xl font-bold leading-[1.1] mb-5">
                Your audience can be critical infrastructure.
              </h2>
              <p className="text-lg text-primary-foreground/70 leading-relaxed">
                For organizations where subscriber relationships, confidentiality and communication
                independence have economic value. Pareto Business combines professional publishing with
                shielded audience infrastructure, dedicated distribution options and Nostr-native redundancy.
              </p>
            </div>

            {/* use case cards */}
            <div className="flex flex-wrap gap-2 mb-14">
              {BUSINESS_USE_CASES.map((uc) => (
                <span key={uc} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/[0.04] px-4 py-2 text-sm font-medium">
                  {uc}
                </span>
              ))}
            </div>

            {/* Business + Sovereign cards */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Business */}
              <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.04] p-7">
                <h3 className="font-serif text-2xl font-bold mb-1">{BUSINESS_PLAN.name}</h3>
                <p className="text-primary-foreground/70 text-sm mb-4">{BUSINESS_PLAN.tagline}</p>
                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-sm text-primary-foreground/70">from</span>
                  <span className="font-serif text-4xl font-bold">{formatCHF(450)}</span>
                  <span className="text-sm text-primary-foreground/70">/ month</span>
                </div>
                <Button variant="secondary" className="w-full mb-5" asChild>
                  <a href="mailto:hello@pareto.space?subject=Pareto%20Business">{BUSINESS_PLAN.cta}</a>
                </Button>
                <p className="text-xs font-medium text-primary-foreground/60 mb-3">Everything in Pro, plus:</p>
                <ul className="space-y-1.5 columns-1 sm:columns-2 gap-x-6">
                  {BUSINESS_PLAN.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm break-inside-avoid mb-1.5">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary-foreground/80" />
                      <span className="text-primary-foreground/70 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs italic text-primary-foreground/60 mt-5 pt-4 border-t border-primary-foreground/10">
                  {BUSINESS_PLAN.supporting}
                </p>
              </div>

              {/* Sovereign */}
              <div className="rounded-2xl border-2 border-primary-foreground/30 bg-gradient-to-b from-primary-foreground/[0.08] to-transparent p-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5" />
                    <h3 className="font-serif text-2xl font-bold">{SOVEREIGN_PLAN.name}</h3>
                  </div>
                  <p className="text-primary-foreground/70 text-sm mb-4">{SOVEREIGN_PLAN.tagline}</p>
                  <div className="font-serif text-4xl font-bold mb-2">Custom</div>
                  <p className="text-lg font-serif font-semibold mb-4">Pareto — on your terms.</p>
                  <Button variant="secondary" className="w-full mb-5" asChild>
                    <a href="mailto:hello@pareto.space?subject=Pareto%20Sovereign">{SOVEREIGN_PLAN.cta}</a>
                  </Button>
                  <p className="text-xs font-medium text-primary-foreground/60 mb-3">
                    Everything can be customized. Possible components:
                  </p>
                  <ul className="space-y-1.5 columns-1 sm:columns-2 gap-x-6">
                    {SOVEREIGN_PLAN.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm break-inside-avoid mb-1.5">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary-foreground/80" />
                        <span className="text-primary-foreground/70 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs italic text-primary-foreground/60 mt-5 pt-4 border-t border-primary-foreground/10">
                    {SOVEREIGN_PLAN.supporting}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BUNDLES ────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <SectionTag>Pre-configured bundles</SectionTag>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">Stacks for every mission.</h2>
            <p className="text-muted-foreground text-lg">Common combinations to make the modular system easy to grasp.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BUNDLES.map((b) => (
              <Card key={b.id} className={cn('flex flex-col', b.accent && 'border-primary/40 bg-primary/[0.03]')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <CardTitle className="font-serif text-lg">{b.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {b.components.map((c, i) => (
                      <li key={c} className="flex items-center gap-2 text-sm">
                        {i === 0
                          ? <Check className="w-4 h-4 text-primary shrink-0" />
                          : <span className="w-4 text-center text-primary/60 shrink-0">+</span>}
                        <span className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>{c}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm italic text-muted-foreground pt-3 border-t">{b.tagline}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── SPECIAL SOLUTIONS ──────────────────────────────────────────────── */}
        <section className="bg-accent/30 border-y">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionTag>Specialized solutions</SectionTag>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">Built for sensitive audiences.</h2>
              <p className="text-muted-foreground text-lg">
                Tailored infrastructure for organizations that treat their audience as an asset.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {SPECIAL_SOLUTIONS.map((s) => {
                const Icon = ICON_MAP[s.icon] ?? Shield;
                return (
                  <Card key={s.id} className="bg-card flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="font-serif text-lg">{s.name}</CardTitle>
                      <CardDescription className="text-sm font-medium text-foreground/80 italic">
                        {s.tagline}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {s.points.map((p) => (
                          <span key={p} className="text-xs rounded-md bg-muted px-2 py-1 text-muted-foreground">{p}</span>
                        ))}
                      </div>
                      {s.disclaimer && (
                        <p className="text-[11px] text-muted-foreground/70 italic mb-3">{s.disclaimer}</p>
                      )}
                      <Button variant="outline" size="sm" className="mt-auto w-fit" asChild>
                        <a href="mailto:hello@pareto.space">{s.cta}<ArrowRight className="w-3.5 h-3.5 ml-1.5" /></a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── COMING NEXT: NOSTR-NATIVE MAIL ─────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <Card className="overflow-hidden border-primary/30">
            <CardContent className="p-8 md:p-12">
              <Badge className="mb-5 bg-primary/10 text-primary border-0 hover:bg-primary/10">Coming Next</Badge>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Beyond email.</h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mb-8">
                Pareto is building toward a native distribution layer where messages can travel directly
                through Nostr relays rather than depending entirely on conventional email infrastructure.
              </p>

              {/* flow diagram */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                {['Author', 'Signs message', 'Nostr relay network', 'Subscriber'].map((node, i, arr) => (
                  <div key={node} className="flex items-center gap-3">
                    <span className="rounded-xl border bg-card px-4 py-2 text-sm font-medium">{node}</span>
                    {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {['npub', 'NIP-05 identity', 'human-readable Nostr address'].map((x) => (
                  <span key={x} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                    {x}
                  </span>
                ))}
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                Email remains fully supported. Nostr-native delivery becomes an additional sovereign
                distribution rail.
              </p>
              <p className="font-serif text-lg font-semibold">Email is a channel. Your network is the asset.</p>
            </CardContent>
          </Card>
        </section>

        {/* ── REFERRAL + AMBASSADOR ──────────────────────────────────────────── */}
        <section className="bg-primary text-primary-foreground border-y">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="grid lg:grid-cols-2 gap-10">
              {/* Referral */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-xs font-medium mb-5">
                  <Gift className="w-3.5 h-3.5" /> Referral program · all tiers (incl. Free)
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight mb-3">
                  Grow the network.<br />Participate in the upside.
                </h2>
                <p className="text-primary-foreground/70 mb-8">
                  Recurring commissions, paid in fiat or Bitcoin / Lightning. Track clicks, signups,
                  conversions, and lifetime commission in your referral dashboard.
                </p>
                <div className="flex items-center gap-3">
                  {REFERRAL_TIERS.map((t, i, arr) => (
                    <div key={t.year} className="flex items-center gap-3">
                      <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.04] px-5 py-4 text-center">
                        <div className="font-serif text-3xl font-bold">{t.rate}</div>
                        <div className="text-xs text-primary-foreground/60 mt-1">{t.year}</div>
                      </div>
                      {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-primary-foreground/40" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambassador */}
              <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.04] p-7">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="w-5 h-5" />
                  <h3 className="font-serif text-2xl font-bold">Pareto Ambassador</h3>
                </div>
                <p className="text-primary-foreground/70 italic mb-5">
                  Don’t just use the network. Help build it.
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6">
                  {[
                    'Enhanced referral terms', 'Early product access', 'Partner materials',
                    'Co-marketing', 'Beta features', 'Community access',
                    'Dedicated referral campaigns', 'Ambassador badge',
                  ].map((x) => (
                    <div key={x} className="flex items-start gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary-foreground/80" />
                      <span className="text-primary-foreground/70 leading-snug">{x}</span>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" asChild>
                  <a href="mailto:hello@pareto.space?subject=Pareto%20Ambassador">Become an Ambassador</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── PAYMENTS NOTE ──────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="rounded-2xl border bg-gradient-to-br from-card to-accent/30 p-8 md:p-10 flex flex-col md:flex-row items-start gap-6">
            <div className="flex gap-2 shrink-0">
              <div className="w-11 h-11 rounded-xl bg-[#F7931A]/15 flex items-center justify-center"><Bitcoin className="w-5 h-5 text-[#F7931A]" /></div>
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold mb-2">Your money doesn’t sit with us.</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pay for Pareto with fiat or Bitcoin / Lightning — and monetize through the same rails.
                Publisher funds flow directly through your connected payment infrastructure wherever
                technically possible. Pareto verifies payment state and manages access —{' '}
                <strong className="text-foreground">we don’t unnecessarily custody your funds.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ── CORE COMMERCIAL MODEL ──────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 pb-8">
          <div className="rounded-2xl border bg-card p-6 md:p-8">
            <h3 className="font-serif text-lg font-bold mb-5 text-center">The Pareto model</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { k: 'Pareto Software', v: 'CHF 0 / 9 / 15 / 450+', icon: Layers },
                { k: 'Distribution', v: 'Email volume', icon: MailIcon },
                { k: 'Capacity', v: 'Audience / publications / users', icon: Sparkles },
                { k: 'Sovereign Infrastructure', v: 'Private relays / clusters / dedicated IP / Vault+ / backups', icon: Server },
                { k: 'Monetization', v: 'Fiat / Bitcoin / Lightning', icon: Bitcoin },
              ].map(({ k, v, icon: Icon }, i, arr) => (
                <div key={k}>
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3">
                    <span className="flex items-center gap-2.5 font-medium text-sm">
                      <Icon className="w-4 h-4 text-primary" />{k}
                    </span>
                    <span className="text-sm text-muted-foreground text-right">{v}</span>
                  </div>
                  {i < arr.length - 1 && <div className="text-center text-muted-foreground/50 text-sm py-0.5">+</div>}
                </div>
              ))}
              <div className="text-center text-muted-foreground/50 text-sm py-0.5">=</div>
              <div className="rounded-xl bg-primary text-primary-foreground px-4 py-3 text-center font-semibold">
                Your custom Pareto stack
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL POSITIONING ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="rounded-3xl bg-primary text-primary-foreground p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
            <div className="relative">
              <KeyRound className="w-10 h-10 mx-auto mb-5 opacity-80" />
              <h2 className="font-serif text-3xl md:text-5xl font-bold mb-5 leading-[1.1] max-w-2xl mx-auto">
                Software scales.<br />Sovereignty doesn’t get paywalled.
              </h2>
              <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                Start with up to 5,000 contacts for free. Add the distribution, automation and
                infrastructure you need as you grow. Your identity, audience and content remain yours
                at every level.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="secondary" className="rounded-full px-8" onClick={handleStartFree}>
                  Start Free
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                  <a href="#configurator">Configure Your Stack</a>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                  <a href="#business">Explore Business</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </AppLayout>
  );
}
