import { Lock, Zap, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZapDialog } from '@/components/ZapDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

interface PaywallProps {
  /** The raw Nostr event for the issue (needed for ZapDialog) */
  event: NostrEvent;
  /** Newsletter title */
  newsletterTitle: string;
  /** Required sats to unlock */
  requiredSats: number;
  /** User's current zap total */
  currentSats: number;
  /** Whether the paid status is still loading */
  isLoading: boolean;
}

export function Paywall({
  event,
  newsletterTitle,
  requiredSats,
  currentSats,
  isLoading,
}: PaywallProps) {
  const { user } = useCurrentUser();
  const remaining = Math.max(0, requiredSats - currentSats);

  return (
    <div className="relative">
      {/* Blurred preview overlay */}
      <div className="h-48 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10" />
        <div className="blur-sm opacity-50 text-muted-foreground text-sm leading-relaxed">
          <p>This content is available exclusively to paid subscribers. Support the author by sending a zap to unlock this and all future paid issues.</p>
          <p className="mt-4">Paid subscribers get access to premium content, deeper analysis, and exclusive insights that aren't available to free readers.</p>
        </div>
      </div>

      {/* Paywall card */}
      <Card className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20">
        <CardContent className="py-8 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>

          <h3 className="font-serif text-xl font-bold mb-2">
            Paid Content
          </h3>

          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 leading-relaxed">
            This issue is exclusively for paid subscribers of <strong className="text-foreground">{newsletterTitle}</strong>.
            {' '}Zap the author to unlock this and all paid content.
          </p>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Checking payment status…</div>
          ) : user ? (
            <div className="space-y-4">
              {/* Progress bar */}
              {currentSats > 0 && (
                <div className="max-w-xs mx-auto">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{currentSats.toLocaleString()} sats</span>
                    <span>{requiredSats.toLocaleString()} sats</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (currentSats / requiredSats) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {remaining.toLocaleString()} sats remaining
                  </p>
                </div>
              )}

              <ZapDialog target={event}>
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Zap className="w-5 h-5 mr-2" />
                  {currentSats > 0
                    ? `Zap ${remaining.toLocaleString()} sats to unlock`
                    : `Zap ${requiredSats.toLocaleString()} sats to unlock`
                  }
                </Button>
              </ZapDialog>

              <p className="text-xs text-muted-foreground">
                Paid status is derived from public zap receipts — no accounts, no payment processor.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in with Nostr to unlock paid content via Lightning zaps.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Requires {requiredSats.toLocaleString()} sats via zap</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
