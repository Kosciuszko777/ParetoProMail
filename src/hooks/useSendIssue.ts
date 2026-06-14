import { useCallback, useRef } from 'react';
import { useNostr } from '@nostrify/react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import type { SubscriberState } from '@/lib/newsletter';

export interface SendProgress {
  total: number;
  done: number;
  failed: number;
}

export interface SendIssueOptions {
  issueEvent: NostrEvent;
  subscribers: SubscriberState[];
  onProgress?: (progress: SendProgress) => void;
}

export interface SendIssueResult {
  delivered: number;
  failed: number;
  total: number;
}

/**
 * Provides a `sendIssue` function that gift-wraps the given NIP-23 issue
 * event (as a NIP-59 kind:1059) and publishes it to every subscriber.
 */
export function useSendIssue() {
  const { nostr } = useNostr();
  const { mutateAsync: publish } = useNostrPublish();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const abortRef = useRef<boolean>(false);

  const sendIssue = useCallback(
    async ({ issueEvent, subscribers, onProgress }: SendIssueOptions): Promise<SendIssueResult> => {
      if (!user?.signer?.nip44) {
        throw new Error('NIP-44 signer required. Please upgrade your Nostr signer.');
      }

      abortRef.current = false;
      let delivered = 0;
      let failed = 0;
      const total = subscribers.length;

      // Build the rumor (unsigned version of the issue event)
      const rumor = {
        kind: issueEvent.kind,
        pubkey: issueEvent.pubkey,
        created_at: issueEvent.created_at,
        tags: issueEvent.tags,
        content: issueEvent.content,
      };

      for (let i = 0; i < subscribers.length; i++) {
        if (abortRef.current) break;
        const subscriber = subscribers[i];

        try {
          // NIP-59: encrypt the rumor JSON to the recipient with NIP-44
          const ciphertext = await user.signer.nip44.encrypt(
            subscriber.pubkey,
            JSON.stringify(rumor)
          );

          // Publish gift wrap (kind 1059) addressed to the subscriber
          await publish({
            kind: 1059,
            content: ciphertext,
            tags: [
              ['p', subscriber.pubkey],
              // Reference the original issue so recipients can correlate
              ['e', issueEvent.id],
            ],
          });

          delivered++;
        } catch {
          failed++;
        }

        onProgress?.({ total, done: i + 1, failed });
      }

      // Invalidate subscriber queries so counts refresh
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });

      void nostr; // keep nostr in scope for future relay targeting

      return { delivered, failed, total };
    },
    [user, publish, queryClient, nostr]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { sendIssue, abort };
}
