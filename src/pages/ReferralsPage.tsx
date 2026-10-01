import { useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Gift, Users, Share2, Lock, Copy } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAudienceVault } from '@/hooks/useAudienceVault';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Gift; label: string; value: string; tone?: string }) {
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

export default function ReferralsPage() {
  useSeoMeta({ title: 'Referrals — Pareto Pro Mail' });
  const { user } = useCurrentUser();
  const { data: contacts } = useAudienceVault();
  const { toast } = useToast();

  const referred = useMemo(
    () => (contacts ?? []).filter((c) => c.source === 'referral'),
    [contacts],
  );

  const refLink = useMemo(() => {
    if (!user) return '';
    try {
      const npub = nip19.npubEncode(user.pubkey);
      return `${location.origin}/?ref=${npub}`;
    } catch {
      return `${location.origin}/`;
    }
  }, [user]);

  const copy = () => {
    navigator.clipboard?.writeText(refLink);
    toast({ title: 'Copied', description: 'Referral link copied to clipboard.' });
  };

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Sign in to view referrals.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-6 h-6 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold">Referrals</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Grow the network bottom-up. Share your link, earn rewards, and track who you brought in —
          all without tracking the people themselves.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8 max-w-md">
          <Stat icon={Users} label="Referred contacts" value={String(referred.length)} tone="bg-pink-500/10" />
          <Stat icon={Share2} label="Your referral code" value={user.pubkey ? nip19.npubEncode(user.pubkey).slice(5, 9) : '—'} />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-serif text-base">Your referral link</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input readOnly value={refLink} className="font-mono text-xs" />
            <Button variant="outline" onClick={copy} className="gap-1.5 shrink-0">
              <Copy className="w-4 h-4" /> Copy
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-base">Referred relationships</CardTitle>
          </CardHeader>
          <CardContent>
            {referred.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No referred contacts yet. Share your link to start growing.
              </p>
            ) : (
              <div className="divide-y">
                {referred.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium truncate">
                      {c.displayName || c.nip05 || c.email || c.id}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.referredBy || 'via link'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
