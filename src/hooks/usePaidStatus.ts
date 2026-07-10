import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { nip57 } from 'nostr-tools';

/**
 * Check if a specific pubkey has zapped the newsletter author enough
 * sats to qualify as a paid subscriber.
 *
 * Looks for kind 9735 zap receipts where:
 * - The zap recipient is the newsletter author
 * - The zap sender is the user in question
 *
 * Returns the total sats zapped and whether it meets the threshold.
 */
export function usePaidStatus(
  authorPubkey: string,
  userPubkey: string | undefined,
  requiredSats: number | undefined,
) {
  const { nostr } = useNostr();

  const { data: zapReceipts, isLoading } = useQuery({
    queryKey: ['paid-status', authorPubkey, userPubkey],
    enabled: !!authorPubkey && !!userPubkey && !!requiredSats && requiredSats > 0,
    queryFn: async (ctx) => {
      if (!userPubkey) return [];
      // Query zap receipts sent TO the author BY the user
      const events = await nostr.query(
        [{
          kinds: [9735],
          '#p': [authorPubkey],
          limit: 200,
        }],
        { signal: ctx.signal },
      );
      return events;
    },
    staleTime: 120_000, // 2 minutes
  });

  const { totalSats, isPaid } = useMemo(() => {
    if (!zapReceipts || !userPubkey || !requiredSats) {
      return { totalSats: 0, isPaid: false };
    }

    let sats = 0;

    for (const zap of zapReceipts) {
      // Extract the zap request from the description tag
      const descriptionTag = zap.tags.find(([n]) => n === 'description')?.[1];
      if (!descriptionTag) continue;

      try {
        const zapRequest = JSON.parse(descriptionTag);
        // Check if this zap was sent by the user we're checking
        if (zapRequest.pubkey !== userPubkey) continue;

        // Extract amount
        const amountTag = zap.tags.find(([n]) => n === 'amount')?.[1];
        if (amountTag) {
          sats += Math.floor(parseInt(amountTag, 10) / 1000);
          continue;
        }

        const bolt11Tag = zap.tags.find(([n]) => n === 'bolt11')?.[1];
        if (bolt11Tag) {
          try {
            sats += nip57.getSatoshisAmountFromBolt11(bolt11Tag);
          } catch {
            // skip
          }
          continue;
        }

        const reqAmountTag = zapRequest.tags?.find(([n]: string[]) => n === 'amount')?.[1];
        if (reqAmountTag) {
          sats += Math.floor(parseInt(reqAmountTag, 10) / 1000);
        }
      } catch {
        // invalid JSON, skip
      }
    }

    return {
      totalSats: sats,
      isPaid: sats >= requiredSats,
    };
  }, [zapReceipts, userPubkey, requiredSats]);

  return { totalSats, isPaid, isLoading };
}

/**
 * Get all paid subscribers for a newsletter by analyzing zap receipts.
 * Returns a map of pubkey → total sats zapped.
 */
export function usePaidSubscribers(authorPubkey: string, requiredSats: number | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['paid-subscribers', authorPubkey, requiredSats],
    enabled: !!authorPubkey && !!requiredSats && requiredSats > 0,
    queryFn: async (ctx) => {
      const events = await nostr.query(
        [{
          kinds: [9735],
          '#p': [authorPubkey],
          limit: 500,
        }],
        { signal: ctx.signal },
      );

      const satsPerPubkey = new Map<string, number>();

      for (const zap of events) {
        const descriptionTag = zap.tags.find(([n]) => n === 'description')?.[1];
        if (!descriptionTag) continue;

        try {
          const zapRequest = JSON.parse(descriptionTag);
          const senderPubkey = zapRequest.pubkey as string;
          if (!senderPubkey) continue;

          let amount = 0;

          const amountTag = zap.tags.find(([n]) => n === 'amount')?.[1];
          if (amountTag) {
            amount = Math.floor(parseInt(amountTag, 10) / 1000);
          } else {
            const bolt11Tag = zap.tags.find(([n]) => n === 'bolt11')?.[1];
            if (bolt11Tag) {
              try {
                amount = nip57.getSatoshisAmountFromBolt11(bolt11Tag);
              } catch {
                // skip
              }
            }
          }

          if (amount > 0) {
            satsPerPubkey.set(senderPubkey, (satsPerPubkey.get(senderPubkey) ?? 0) + amount);
          }
        } catch {
          // skip
        }
      }

      // Filter to only those who meet the threshold
      const paidSubscribers: Array<{ pubkey: string; totalSats: number }> = [];
      for (const [pk, total] of satsPerPubkey) {
        if (requiredSats && total >= requiredSats) {
          paidSubscribers.push({ pubkey: pk, totalSats: total });
        }
      }

      return paidSubscribers.sort((a, b) => b.totalSats - a.totalSats);
    },
    staleTime: 120_000,
  });
}
