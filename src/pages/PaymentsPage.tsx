import { useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { CreditCard, Zap, Bitcoin, Crown, Lock } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAudienceVault } from '@/hooks/useAudienceVault';
import { cn } from '@/lib/utils';

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Zap; label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', tone ?? 'bg-primary/10')}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  useSeoMeta({ title: 'Payments — Pareto Pro Mail' });
  const { user } = useCurrentUser();
  const { data: contacts } = useAudienceVault();

  const stats = useMemo(() => {
    const list = contacts ?? [];
    return {
      activePaid: list.filter((c) => c.payment === 'active').length,
      lightning: list.filter((c) => c.paymentMethod === 'lightning').length,
      onchain: list.filter((c) => c.paymentMethod === 'onchain').length,
      founding: list.filter((c) => c.membership === 'founding').length,
    };
  }, [contacts]);

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Sign in to view payments.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-6 h-6 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold">Payments</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Non-custodial by design. Pareto never holds your funds — you get paid directly in
          Bitcoin, Lightning, or fiat.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Stat icon={Crown} label="Active paid" value={String(stats.activePaid)} tone="bg-amber-500/10" />
          <Stat icon={Zap} label="Lightning" value={String(stats.lightning)} tone="bg-purple-500/10" />
          <Stat icon={Bitcoin} label="On-chain" value={String(stats.onchain)} tone="bg-[#F7931A]/15" />
          <Stat icon={Crown} label="Founding" value={String(stats.founding)} />
        </div>

        <Card className="bg-accent/30 border-dashed">
          <CardHeader>
            <CardTitle className="font-serif text-base">Direct, sovereign monetization</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              Membership and payment status live in your encrypted Audience Vault. Record how each
              reader pays — Lightning, on-chain Bitcoin, or card — without storing card numbers or
              surrendering custody.
            </p>
            <p>
              Set up paid tiers from your publication settings. Zap-based access is derived from
              public receipts, so no payment processor sits between you and your readers.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
