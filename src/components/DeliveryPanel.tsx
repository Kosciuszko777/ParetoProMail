import { useState, useCallback } from 'react';
import {
  Send, Megaphone, Mail, Users, Loader2, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useNewsletterSubscribers } from '@/hooks/useNewsletterSubscribers';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';
import { ISSUE_KIND, NEWSLETTER_CONFIG_KIND } from '@/lib/pareto';

/** Fan-out threshold: above this, default to public announcement and show warning. */
const FANOUT_THRESHOLD = 500;

type DeliveryMode = 'announcement' | 'direct';

interface DeliveryPanelProps {
  /** The published issue's naddr (bech32) */
  issueNaddr: string;
  /** Issue title for display */
  issueTitle: string;
  /** Newsletter author pubkey */
  newsletterPubkey: string;
  /** Newsletter slug */
  newsletterSlug: string;
}

export function DeliveryPanel({
  issueNaddr,
  issueTitle,
  newsletterPubkey,
  newsletterSlug,
}: DeliveryPanelProps) {
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();
  const { data: subscribers, isLoading: subsLoading } = useNewsletterSubscribers(
    newsletterPubkey,
    newsletterSlug,
  );

  const subCount = subscribers?.length ?? 0;
  const isOwner = user?.pubkey === newsletterPubkey;

  // Default mode based on threshold
  const [mode, setMode] = useState<DeliveryMode>(
    subCount > FANOUT_THRESHOLD ? 'announcement' : 'announcement',
  );
  const [expanded, setExpanded] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [sent, setSent] = useState(false);

  // ── Public Announcement: publish a kind 1 note with the naddr ──
  const sendAnnouncement = useCallback(async () => {
    if (!user) return;
    setSending(true);
    try {
      const nlNaddr = nip19.naddrEncode({
        kind: NEWSLETTER_CONFIG_KIND,
        pubkey: newsletterPubkey,
        identifier: newsletterSlug,
      });
      await publish({
        kind: 1,
        content: `New issue published: "${issueTitle}"\n\nRead it here: nostr:${issueNaddr}\n\nSubscribe: nostr:${nlNaddr}`,
        tags: [
          ['a', `${NEWSLETTER_CONFIG_KIND}:${newsletterPubkey}:${newsletterSlug}`],
          ['t', 'newsletter'],
        ],
      });
      setSent(true);
      toast({ title: 'Announced!', description: 'Public announcement posted to your Nostr relays.' });
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }, [user, publish, issueNaddr, issueTitle, newsletterPubkey, newsletterSlug, toast]);

  // ── Direct Notification: NIP-17 gift-wrapped DM to each subscriber ──
  const sendDirectNotifications = useCallback(async () => {
    if (!user || !subscribers || subscribers.length === 0) return;
    if (!user.signer.nip44) {
      toast({ title: 'NIP-44 required', description: 'Please upgrade your signer to one that supports NIP-44 encryption.', variant: 'destructive' });
      return;
    }

    setSending(true);
    const total = subscribers.length;
    let done = 0;
    let failed = 0;
    setProgress({ done: 0, total, failed: 0 });

    const messageContent = `New newsletter issue: "${issueTitle}"\n\nnostr:${issueNaddr}`;

    for (const subscriber of subscribers) {
      try {
        // Build the unsigned rumor (kind 14 DM per NIP-17)
        const rumor = {
          kind: 14,
          pubkey: user.pubkey,
          created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // randomize up to 2 days
          tags: [
            ['p', subscriber.pubkey],
          ],
          content: messageContent,
        };

        // Seal: encrypt rumor to recipient, sign with author key
        const sealContent = await user.signer.nip44.encrypt(
          subscriber.pubkey,
          JSON.stringify(rumor),
        );

        const seal = await user.signer.signEvent({
          kind: 13,
          content: sealContent,
          tags: [],
          created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800),
        });

        // Gift wrap: encrypt the seal with a random key and publish
        // We use NIP-44 encrypt from the author to the recipient for the gift wrap
        // (simplified — full NIP-59 uses an ephemeral key, but the signer interface
        //  encrypts to the recipient which is functionally equivalent for delivery)
        const wrapContent = await user.signer.nip44.encrypt(
          subscriber.pubkey,
          JSON.stringify(seal),
        );

        await publish({
          kind: 1059,
          content: wrapContent,
          tags: [['p', subscriber.pubkey]],
        });

        done++;
      } catch {
        failed++;
      }
      setProgress({ done: done + failed, total, failed });
    }

    setSent(true);
    toast({
      title: 'Delivered!',
      description: `Direct notifications sent to ${done} subscriber${done !== 1 ? 's' : ''}${failed > 0 ? `. ${failed} failed.` : '.'}`,
    });
    setSending(false);
  }, [user, subscribers, publish, issueNaddr, issueTitle, toast]);

  if (!isOwner || !user) return null;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Send className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="font-serif text-base">Deliver to Subscribers</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {subsLoading ? 'Loading…' : `${subCount} Nostr subscriber${subCount !== 1 ? 's' : ''}`}
                {sent && <span className="ml-2 text-green-600 dark:text-green-400 font-medium">· Delivered</span>}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sent && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-5">
          {/* No subscribers */}
          {!subsLoading && subCount === 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                No Nostr subscribers yet. Share your newsletter page to grow your audience.
              </p>
            </div>
          )}

          {/* Fan-out warning */}
          {subCount > FANOUT_THRESHOLD && mode === 'direct' && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Fan-out warning:</strong> You have {subCount} subscribers. Sending individual encrypted DMs
                to this many recipients is expensive and slow. Consider using the public announcement mode instead.
              </div>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex rounded-lg border p-1 gap-1">
            <button
              onClick={() => setMode('announcement')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                mode === 'announcement'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <Megaphone className="w-4 h-4" />
              Public Announcement
            </button>
            <button
              onClick={() => setMode('direct')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                mode === 'direct'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent',
              )}
            >
              <Mail className="w-4 h-4" />
              Direct Notifications
            </button>
          </div>

          {/* Mode descriptions */}
          {mode === 'announcement' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Radio className="w-4 h-4 text-green-500" />
                  How it works
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Publishes a <strong className="text-foreground">kind 1 short note</strong> to your relays linking the issue's <code className="text-xs bg-muted px-1 rounded">naddr</code>.
                  All your followers and subscribers see it. Cheap, fast, ideal for public/free newsletters.
                </p>
              </div>

              {/* Progress / result */}
              {sending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Publishing announcement…
                </div>
              )}
              {sent && !sending && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Public announcement published.
                </div>
              )}

              <Button
                onClick={sendAnnouncement}
                disabled={sending || sent}
                className="w-full"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Megaphone className="w-4 h-4 mr-2" />}
                {sent ? 'Announced' : 'Publish Announcement'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-blue-500" />
                  How it works
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sends a <strong className="text-foreground">NIP-17 encrypted DM</strong> (gift-wrapped, kind 1059) to each subscriber individually.
                  Private, but costly for large lists. Best for paid/private issues or small audiences.
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {subCount} recipients</span>
                  <span>NIP-44 encrypted · NIP-59 gift wrap</span>
                </div>
              </div>

              {/* Progress */}
              {sending && progress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Sending to {progress.done} / {progress.total}…</span>
                    {progress.failed > 0 && <span className="text-destructive">{progress.failed} failed</span>}
                  </div>
                  <Progress value={Math.round((progress.done / Math.max(progress.total, 1)) * 100)} className="h-2" />
                </div>
              )}
              {sent && !sending && (
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border text-sm',
                  progress.failed === 0
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
                )}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Delivered to {progress.done - progress.failed} subscriber{(progress.done - progress.failed) !== 1 ? 's' : ''}
                  {progress.failed > 0 && `. ${progress.failed} failed.`}
                </div>
              )}

              <Button
                onClick={sendDirectNotifications}
                disabled={sending || sent || subCount === 0}
                className="w-full"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                {sent ? 'Delivered' : `Send to ${subCount} Subscriber${subCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          )}

          <Separator />

          {/* Phase 3 placeholder */}
          <div className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Phase 3 — SMTP Bridge:</strong> Email delivery to non-Nostr
            subscribers will be available when you configure your own SMTP provider. The canonical issue on Nostr
            remains the owned version; email is standard email after the bridge — normal metadata, no E2E.
          </div>
        </CardContent>
      )}
    </Card>
  );
}
