import { useState, useMemo } from 'react';
import { Check, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  CONFIG_BASE_PLANS, CONFIG_AUDIENCE, CONFIG_EMAIL, CONFIG_MODULES,
  formatCHF, annualMonthly, type PlanId,
} from '@/lib/pricing';

function StepHeader({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
        {n}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium border transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function PricingConfigurator({
  annual,
  onStart,
}: {
  annual: boolean;
  onStart: (planId: PlanId) => void;
}) {
  const [planIdx, setPlanIdx] = useState(2); // default Pro
  const [audienceIdx, setAudienceIdx] = useState(0);
  const [emailIdx, setEmailIdx] = useState(0);
  const [modules, setModules] = useState<Set<string>>(new Set());

  const toggleModule = (id: string) => {
    setModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const basePlan = CONFIG_BASE_PLANS[planIdx];
  const audience = CONFIG_AUDIENCE[audienceIdx];
  const email = CONFIG_EMAIL[emailIdx];

  const { baseCost, usageCost, infraCost, total, isBusiness } = useMemo(() => {
    const base = annual ? annualMonthly(basePlan.priceMonthly) : basePlan.priceMonthly;
    const usage = audience.priceMonthly + email.priceMonthly;
    const infra = CONFIG_MODULES.filter((m) => modules.has(m.id)).reduce((s, m) => s + m.priceMonthly, 0);
    return {
      baseCost: base,
      usageCost: usage,
      infraCost: infra,
      total: base + usage + infra,
      isBusiness: basePlan.id === 'business',
    };
  }, [annual, basePlan, audience, email, modules]);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8">
      {/* Steps */}
      <div className="space-y-8">
        {/* Step 1: base plan */}
        <div>
          <StepHeader n={1} title="Choose base plan" />
          <div className="flex flex-wrap gap-2">
            {CONFIG_BASE_PLANS.map((p, i) => (
              <Pill key={p.id} active={planIdx === i} onClick={() => setPlanIdx(i)}>
                {p.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Step 2: audience */}
        <div>
          <StepHeader n={2} title="Choose audience size" hint="Encrypted contacts" />
          <div className="flex flex-wrap gap-2">
            {CONFIG_AUDIENCE.map((a, i) => (
              <Pill key={a.label} active={audienceIdx === i} onClick={() => setAudienceIdx(i)}>
                {a.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* Step 3: email volume */}
        <div>
          <StepHeader n={3} title="Choose monthly email volume" />
          <div className="flex flex-wrap gap-2">
            {CONFIG_EMAIL.map((e, i) => (
              <Pill key={e.label} active={emailIdx === i} onClick={() => setEmailIdx(i)}>
                {e.label}
              </Pill>
            ))}
            <Pill active={false} onClick={() => { /* custom handled via Talk to us */ }}>
              Custom
            </Pill>
          </div>
        </div>

        {/* Step 4: infrastructure */}
        <div>
          <StepHeader n={4} title="Choose infrastructure" hint="Add only what you need" />
          <div className="grid sm:grid-cols-2 gap-2">
            {CONFIG_MODULES.map((m) => {
              const active = modules.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleModule(m.id)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm text-left transition-all',
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      active ? 'bg-primary border-primary' : 'border-muted-foreground/40',
                    )}>
                      {active && <Check className="w-3 h-3 text-primary-foreground" />}
                    </span>
                    {m.label}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">+{formatCHF(m.priceMonthly)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estimate panel */}
      <div className="lg:sticky lg:top-24 h-fit">
        <Card className="border-primary/30 shadow-md">
          <CardContent className="p-6 space-y-4">
            <h4 className="font-serif text-lg font-bold">Your estimate</h4>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Base plan ({basePlan.label})</span>
                <span className="font-medium tabular-nums">{formatCHF(baseCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Usage ({audience.label} · {email.label} emails)</span>
                <span className="font-medium tabular-nums">{formatCHF(usageCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Infrastructure ({modules.size})</span>
                <span className="font-medium tabular-nums">{formatCHF(infraCost)}</span>
              </div>
            </div>

            <div className="border-t pt-4 flex items-end justify-between">
              <span className="text-sm font-medium">Monthly total</span>
              <div className="text-right">
                <div className="font-serif text-3xl font-bold tabular-nums">{formatCHF(total)}</div>
                <div className="text-xs text-muted-foreground">
                  {annual ? 'per month, billed annually' : 'per month'}
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={() => onStart(basePlan.id)}>
              Start with this configuration
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {isBusiness && (
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:hello@pareto.space?subject=Pareto%20Business%20configuration">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Talk to us
                </a>
              </Button>
            )}

            <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
              Estimate only. Base plan + usage + infrastructure. Your identity, audience & content
              stay yours at every level.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
