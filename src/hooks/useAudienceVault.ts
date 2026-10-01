import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  AUDIENCE_CONTACT_KIND,
  buildContactTags,
  deriveContactType,
  deriveIdentityKind,
  newContactId,
  type Contact,
  type ContactPrivate,
  type MembershipStatus,
  type PaymentStatus,
  type SubscriptionStatus,
} from '@/lib/pareto';

function tag(ev: NostrEvent, name: string): string | undefined {
  return ev.tags.find(([n]) => n === name)?.[1];
}

/**
 * Decrypt and assemble a contact from its event. Returns null if the event
 * can't be decrypted (e.g. not ours) or is missing required structure.
 */
async function parseContactEvent(
  ev: NostrEvent,
  decrypt: (peer: string, ct: string) => Promise<string>,
  selfPubkey: string,
): Promise<Contact | null> {
  const id = tag(ev, 'd');
  if (!id) return null;

  let priv: ContactPrivate;
  try {
    const json = await decrypt(selfPubkey, ev.content);
    priv = JSON.parse(json) as ContactPrivate;
  } catch {
    return null;
  }

  // Backfill defaults defensively.
  const safe: ContactPrivate = {
    displayName: priv.displayName,
    email: priv.email,
    npub: priv.npub,
    nip05: priv.nip05,
    tags: Array.isArray(priv.tags) ? priv.tags : [],
    source: priv.source ?? 'manual',
    referredBy: priv.referredBy,
    notes: priv.notes,
    consentAt: priv.consentAt,
    consentNote: priv.consentNote,
    lists: Array.isArray(priv.lists) ? priv.lists : [],
    prefs: priv.prefs ?? {},
    paymentMethod: priv.paymentMethod ?? 'none',
    audit: Array.isArray(priv.audit) ? priv.audit : [],
  };

  const status = (tag(ev, 'status') as SubscriptionStatus) ?? 'subscribed';
  const membership = (tag(ev, 'membership') as MembershipStatus) ?? 'none';
  const payment = (tag(ev, 'payment') as PaymentStatus) ?? 'none';
  const joinedAt = parseInt(tag(ev, 'joined') ?? String(ev.created_at), 10);

  return {
    ...safe,
    id,
    pubkey: ev.pubkey,
    identityKind: deriveIdentityKind(safe),
    type: deriveContactType(safe),
    status,
    membership,
    payment,
    joinedAt: Number.isNaN(joinedAt) ? ev.created_at : joinedAt,
    updatedAt: ev.created_at,
  };
}

/** Load and decrypt all Audience Vault contacts for the logged-in publisher. */
export function useAudienceVault(): UseQueryResult<Contact[]> {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['audience-vault', user?.pubkey],
    enabled: !!user?.pubkey,
    queryFn: async (ctx) => {
      if (!user?.pubkey || !user.signer.nip44) return [];
      const events = await nostr.query(
        [{ kinds: [AUDIENCE_CONTACT_KIND], authors: [user.pubkey], limit: 1000 }],
        { signal: ctx.signal },
      );

      // Latest event per d-tag wins (addressable semantics).
      const latest = new Map<string, NostrEvent>();
      for (const ev of events) {
        const id = tag(ev, 'd');
        if (!id) continue;
        const prev = latest.get(id);
        if (!prev || ev.created_at > prev.created_at) latest.set(id, ev);
      }

      const decrypt = (peer: string, ct: string) => user.signer.nip44!.decrypt(peer, ct);
      const contacts: Contact[] = [];
      for (const ev of latest.values()) {
        const c = await parseContactEvent(ev, decrypt, user.pubkey);
        if (c) contacts.push(c);
      }
      return contacts.sort((a, b) => b.joinedAt - a.joinedAt);
    },
    staleTime: 30_000,
  });
}

export interface SaveContactInput {
  id?: string;
  displayName?: string;
  email?: string;
  npub?: string;
  nip05?: string;
  tags?: string[];
  source?: ContactPrivate['source'];
  referredBy?: string;
  notes?: string;
  consentAt?: number;
  consentNote?: string;
  lists?: string[];
  prefs?: ContactPrivate['prefs'];
  paymentMethod?: ContactPrivate['paymentMethod'];
  status: SubscriptionStatus;
  membership: MembershipStatus;
  payment: PaymentStatus;
  joinedAt?: number;
  /** Prior state, used to build the audit trail diff. */
  previous?: Contact;
}

/** Create or update a contact (publishes an encrypted, self-addressed event). */
export function useSaveContact() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveContactInput) => {
      if (!user) throw new Error('Not logged in');
      if (!user.signer.nip44) {
        throw new Error('Your signer must support NIP-44 encryption to use the Audience Vault.');
      }

      const id = input.id ?? newContactId();
      const now = Math.floor(Date.now() / 1000);
      const joinedAt = input.joinedAt ?? input.previous?.joinedAt ?? now;

      // Build audit trail: carry prior entries, append diffs.
      const audit = [...(input.previous?.audit ?? [])];
      if (!input.previous) {
        audit.push({ at: now, change: `created`, note: 'Contact added to vault' });
        audit.push({ at: now, change: `status:${input.status}` });
      } else {
        if (input.previous.status !== input.status) {
          audit.push({ at: now, change: `status:${input.status}` });
        }
        if (input.previous.membership !== input.membership) {
          audit.push({ at: now, change: `membership:${input.membership}` });
        }
        if (input.previous.payment !== input.payment) {
          audit.push({ at: now, change: `payment:${input.payment}` });
        }
      }

      const priv: ContactPrivate = {
        displayName: input.displayName?.trim() || undefined,
        email: input.email?.trim() || undefined,
        npub: input.npub?.trim() || undefined,
        nip05: input.nip05?.trim() || undefined,
        tags: input.tags ?? input.previous?.tags ?? [],
        source: input.source ?? input.previous?.source ?? 'manual',
        referredBy: input.referredBy ?? input.previous?.referredBy,
        notes: input.notes ?? input.previous?.notes,
        consentAt: input.consentAt ?? input.previous?.consentAt,
        consentNote: input.consentNote ?? input.previous?.consentNote,
        lists: input.lists ?? input.previous?.lists ?? [],
        prefs: input.prefs ?? input.previous?.prefs ?? {},
        paymentMethod: input.paymentMethod ?? input.previous?.paymentMethod ?? 'none',
        audit,
      };

      const type = deriveContactType(priv);
      const ciphertext = await user.signer.nip44.encrypt(user.pubkey, JSON.stringify(priv));

      const tags = buildContactTags({
        id,
        status: input.status,
        type,
        membership: input.membership,
        payment: input.payment,
        joinedAt,
      });

      if (location.protocol === 'https:') {
        tags.push(['client', location.hostname]);
      }

      const event = await user.signer.signEvent({
        kind: AUDIENCE_CONTACT_KIND,
        content: ciphertext,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(5000) });
      return event;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audience-vault', user?.pubkey] });
    },
  });
}
