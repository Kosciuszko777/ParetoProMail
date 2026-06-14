import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { EMAIL_CONTACT_LIST_KIND, type EmailContact } from '@/lib/newsletter';

export function useEmailContacts() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['email-contacts', user?.pubkey],
    enabled: !!user?.pubkey,
    queryFn: async (ctx) => {
      if (!user?.pubkey) return [];
      const events = await nostr.query(
        [{ kinds: [EMAIL_CONTACT_LIST_KIND], authors: [user.pubkey], limit: 1 }],
        { signal: ctx.signal }
      );
      const event = events[0];
      if (!event || !event.content) return [];

      try {
        if (!user.signer.nip44) return [];
        // Encrypted to self: peer pubkey is our own pubkey
        const plaintext = await user.signer.nip44.decrypt(user.pubkey, event.content);
        const contacts: EmailContact[] = JSON.parse(plaintext);
        return Array.isArray(contacts) ? contacts : [];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });
}

export function useSaveEmailContacts() {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contacts: EmailContact[]) => {
      if (!user?.pubkey || !user.signer.nip44) {
        throw new Error('Login required and NIP-44 signer support needed');
      }
      const plaintext = JSON.stringify(contacts);
      const ciphertext = await user.signer.nip44.encrypt(user.pubkey, plaintext);

      await publishEvent({
        kind: EMAIL_CONTACT_LIST_KIND,
        content: ciphertext,
        tags: [['alt', 'Encrypted newsletter email contact list']],
      });
    },
    onSuccess: (_data, _vars, _ctx) => {
      queryClient.invalidateQueries({ queryKey: ['email-contacts', user?.pubkey] });
    },
  });
}
