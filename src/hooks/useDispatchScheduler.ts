import { useEffect, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQueryClient } from '@tanstack/react-query';
import {
  loadDispatches,
  saveDispatches,
  NEWSLETTER_ISSUE_KIND,
  type MailDispatch,
} from '@/lib/newsletter';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Background scheduler: polls every 30 s and fires any dispatches whose
 * scheduledAt has passed and whose status is still 'scheduled'.
 *
 * Mount this once near the top of the tree (e.g. in AppLayout).
 */
export function useDispatchScheduler() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const queryClient = useQueryClient();
  const runningRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.pubkey) return;

    async function tick() {
      const pubkey = user!.pubkey;
      const now = Math.floor(Date.now() / 1000);
      const all = loadDispatches(pubkey);

      const due = all.filter(
        (d) =>
          d.status === 'scheduled' &&
          d.scheduledAt <= now &&
          !runningRef.current.has(d.id)
      );

      if (due.length === 0) return;

      for (const dispatch of due) {
        runningRef.current.add(dispatch.id);

        // Mark as sending
        const updated = loadDispatches(pubkey);
        const idx = updated.findIndex((d) => d.id === dispatch.id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], status: 'sending', sentAt: now };
          saveDispatches(pubkey, updated);
        }

        try {
          await executeDispatch(dispatch, pubkey, nostr, publish, user!.signer);

          const after = loadDispatches(pubkey);
          const i2 = after.findIndex((d) => d.id === dispatch.id);
          if (i2 >= 0) {
            after[i2] = { ...after[i2], status: 'sent', sentAt: now };
            saveDispatches(pubkey, after);
          }
        } catch (err) {
          const after = loadDispatches(pubkey);
          const i2 = after.findIndex((d) => d.id === dispatch.id);
          if (i2 >= 0) {
            after[i2] = {
              ...after[i2],
              status: 'failed',
              note: String(err),
            };
            saveDispatches(pubkey, after);
          }
        } finally {
          runningRef.current.delete(dispatch.id);
          queryClient.invalidateQueries({ queryKey: ['mail-dispatches', pubkey] });
        }
      }
    }

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [user?.pubkey, nostr, publish, queryClient, user]);
}

async function executeDispatch(
  dispatch: MailDispatch,
  _pubkey: string,
  nostr: ReturnType<typeof useNostr>['nostr'],
  publish: (event: Partial<NostrEvent>) => Promise<NostrEvent>,
  signer: NonNullable<ReturnType<typeof useCurrentUser>['user']>['signer']
) {
  if (!signer.nip44) throw new Error('NIP-44 signer not available');

  // Fetch the issue event
  const events = await nostr.query([
    { ids: [dispatch.issueEventId], kinds: [NEWSLETTER_ISSUE_KIND], limit: 1 },
  ]);
  const issueEvent = events[0];
  if (!issueEvent) throw new Error('Issue event not found on relays');

  // Fetch subscribers
  const aTagValue = issueEvent.tags.find(([n]) => n === 'a')?.[1] ?? '';
  const [, issuePubkey = '', issueSlug = ''] = aTagValue.split(':');

  const subEvents = await nostr.query([
    {
      kinds: [1],
      '#a': [`38973:${issuePubkey}:${issueSlug}`],
      '#t': ['nostrmail-subscribe'],
      limit: 500,
    },
  ]);

  // Deduplicate to current subscribers
  const latestByPubkey = new Map<string, { subscribed: boolean; timestamp: number }>();
  for (const ev of subEvents) {
    const isSub = ev.tags.some(([n, v]) => n === 't' && v === 'nostrmail-subscribe');
    const isUnsub = ev.tags.some(([n, v]) => n === 't' && v === 'nostrmail-unsubscribe');
    if (!isSub && !isUnsub) continue;
    const existing = latestByPubkey.get(ev.pubkey);
    if (!existing || ev.created_at > existing.timestamp) {
      latestByPubkey.set(ev.pubkey, { subscribed: isSub && !isUnsub, timestamp: ev.created_at });
    }
  }
  const subscribers = [...latestByPubkey.entries()]
    .filter(([, v]) => v.subscribed)
    .map(([pk]) => pk);

  const rumor = {
    kind: issueEvent.kind,
    pubkey: issueEvent.pubkey,
    created_at: issueEvent.created_at,
    tags: issueEvent.tags,
    content: issueEvent.content,
  };

  let delivered = 0;
  for (const recipientPubkey of subscribers) {
    try {
      const ciphertext = await signer.nip44.encrypt(recipientPubkey, JSON.stringify(rumor));
      await publish({
        kind: 1059,
        content: ciphertext,
        tags: [['p', recipientPubkey], ['e', issueEvent.id]],
      });
      delivered++;
    } catch {
      // skip individual failures
    }
  }

  // Patch the dispatch with final counts
  const all = loadDispatches(_pubkey);
  const idx = all.findIndex((d) => d.id === dispatch.id);
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      recipientCount: subscribers.length,
      deliveredCount: delivered,
    };
    saveDispatches(_pubkey, all);
  }
}
