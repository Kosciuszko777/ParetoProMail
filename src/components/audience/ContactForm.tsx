import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSaveContact } from '@/hooks/useAudienceVault';
import { useToast } from '@/hooks/useToast';
import {
  SUBSCRIPTION_STATUS_LABEL, MEMBERSHIP_LABEL,
  type Contact, type SubscriptionStatus, type MembershipStatus,
  type PaymentStatus, type ContactSource,
} from '@/lib/pareto';

const STATUS_OPTIONS: SubscriptionStatus[] = [
  'subscribed', 'unsubscribed', 'pending', 'suppressed', 'bounced', 'follower', 'paid', 'founding',
];
const MEMBERSHIP_OPTIONS: MembershipStatus[] = ['none', 'free', 'paid', 'founding', 'cancelled'];
const PAYMENT_OPTIONS: PaymentStatus[] = ['none', 'active', 'cancelled'];
const SOURCE_OPTIONS: ContactSource[] = ['direct', 'referral', 'nostr', 'import', 'manual'];
const METHOD_OPTIONS = ['none', 'lightning', 'onchain', 'card'] as const;

export function ContactForm({
  contact,
  onDone,
  onCancel,
}: {
  contact?: Contact;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { mutateAsync: save, isPending } = useSaveContact();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(contact?.displayName ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [npub, setNpub] = useState(contact?.npub ?? '');
  const [nip05, setNip05] = useState(contact?.nip05 ?? '');
  const [tags, setTags] = useState((contact?.tags ?? []).join(', '));
  const [status, setStatus] = useState<SubscriptionStatus>(contact?.status ?? 'subscribed');
  const [membership, setMembership] = useState<MembershipStatus>(contact?.membership ?? 'free');
  const [payment, setPayment] = useState<PaymentStatus>(contact?.payment ?? 'none');
  const [source, setSource] = useState<ContactSource>(contact?.source ?? 'direct');
  const [referredBy, setReferredBy] = useState(contact?.referredBy ?? '');
  const [paymentMethod, setPaymentMethod] = useState<string>(contact?.paymentMethod ?? 'none');
  const [notes, setNotes] = useState(contact?.notes ?? '');
  const [consentNote, setConsentNote] = useState(contact?.consentNote ?? '');

  const submit = async () => {
    if (!displayName && !email && !npub && !nip05) {
      toast({
        title: 'Need at least one identifier',
        description: 'Add a name, email, npub or NIP-05 — or save a pseudonymous relationship with just a name.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await save({
        id: contact?.id,
        displayName,
        email,
        npub,
        nip05,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        status,
        membership,
        payment,
        source,
        referredBy,
        paymentMethod: paymentMethod as Contact['paymentMethod'],
        notes,
        consentNote,
        consentAt: contact?.consentAt ?? (consentNote ? Math.floor(Date.now() / 1000) : undefined),
        previous: contact,
      });
      toast({ title: contact ? 'Contact updated' : 'Contact added', description: 'Encrypted and saved to your vault.' });
      onDone();
    } catch (err) {
      toast({ title: 'Could not save', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cf-name">Display name / pseudonym</Label>
          <Input id="cf-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Anna Keller" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-email">Email</Label>
          <Input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anna@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-nip05">NIP-05</Label>
          <Input id="cf-nip05" value={nip05} onChange={(e) => setNip05(e.target.value)} placeholder="anna@nostr.example" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cf-npub">npub</Label>
          <Input id="cf-npub" value={npub} onChange={(e) => setNpub(e.target.value)} placeholder="npub1…" className="font-mono text-xs" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        No field is required except an internal ID (generated automatically). A contact can be email-only,
        Nostr-only, both, or fully pseudonymous.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Subscription status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{SUBSCRIPTION_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Membership</Label>
          <Select value={membership} onValueChange={(v) => setMembership(v as MembershipStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEMBERSHIP_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>{MEMBERSHIP_LABEL[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Payment status</Label>
          <Select value={payment} onValueChange={(v) => setPayment(v as PaymentStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>{p === 'none' ? '—' : p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Payment method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {METHOD_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>{m === 'none' ? '—' : m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Select value={source} onValueChange={(v) => setSource(v as ContactSource)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-ref">Referred by</Label>
          <Input id="cf-ref" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Name or code" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-tags">Tags (comma-separated)</Label>
        <Input id="cf-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Research, Bitcoin" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-notes">Notes</Label>
        <Textarea id="cf-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Private notes about this relationship…" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cf-consent">Consent note</Label>
        <Input id="cf-consent" value={consentNote} onChange={(e) => setConsentNote(e.target.value)} placeholder="e.g. Double opt-in confirmed via signup form" />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {contact ? 'Save changes' : 'Add contact'}
        </Button>
      </div>
    </div>
  );
}
