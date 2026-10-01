import { useState } from 'react';
import {
  Fingerprint, Mail, AtSign, KeyRound, Tag as TagIcon, Gift, Settings2,
  StickyNote, ShieldCheck, Database, Pencil, History, CreditCard, UserCheck,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  SUBSCRIPTION_STATUS_LABEL, MEMBERSHIP_LABEL, SOURCE_LABEL, formatContactDate,
  type Contact,
} from '@/lib/pareto';
import { IdentityBadge } from './IdentityBadge';
import { StatusBadge } from './StatusBadge';
import { ContactForm } from './ContactForm';
import { cn } from '@/lib/utils';

function Section({ icon: Icon, title, children }: { icon: typeof Mail; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      <div className="text-sm">{children}</div>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('text-right break-all', mono && 'font-mono text-xs', !value && 'text-muted-foreground/50')}>
        {value || '—'}
      </span>
    </div>
  );
}

export function ContactProfile({
  contact,
  open,
  onOpenChange,
}: {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!contact) return null;

  const title = contact.displayName
    || contact.nip05
    || (contact.npub ? contact.npub.slice(0, 16) + '…' : null)
    || contact.email
    || contact.id;

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditing(false); }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        {editing ? (
          <div className="p-6">
            <SheetHeader className="mb-4 p-0">
              <SheetTitle className="font-serif text-xl">Edit contact</SheetTitle>
              <SheetDescription>Update the relationship. Changes are encrypted to you.</SheetDescription>
            </SheetHeader>
            <ContactForm
              contact={contact}
              onDone={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <div>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 bg-accent/30 border-b space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                  {title.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="font-serif text-xl truncate">{title}</SheetTitle>
                  <SheetDescription className="truncate">
                    {contact.email || contact.nip05 || contact.npub || 'Pseudonymous relationship'}
                  </SheetDescription>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <IdentityBadge kind={contact.identityKind} />
                    <StatusBadge status={contact.status} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
              </div>
            </SheetHeader>

            <div className="p-6 space-y-6">
              {/* IDENTITY */}
              <Section icon={Fingerprint} title="Identity">
                <div className="divide-y rounded-lg border px-3">
                  <Field label="Display name" value={contact.displayName} />
                  <Field label="Email" value={contact.email} />
                  <Field label="npub" value={contact.npub} mono />
                  <Field label="NIP-05" value={contact.nip05} />
                  <Field label="Internal ID" value={contact.id} mono />
                </div>
              </Section>

              {/* SUBSCRIPTIONS */}
              <Section icon={UserCheck} title="Subscription">
                <div className="divide-y rounded-lg border px-3">
                  <Field label="Status" value={SUBSCRIPTION_STATUS_LABEL[contact.status]} />
                  <Field label="Channel" value={contact.type.charAt(0).toUpperCase() + contact.type.slice(1)} />
                  <Field label="Joined" value={formatContactDate(contact.joinedAt)} />
                </div>
              </Section>

              {/* MEMBERSHIPS */}
              <Section icon={KeyRound} title="Membership">
                <div className="divide-y rounded-lg border px-3">
                  <Field label="Tier" value={MEMBERSHIP_LABEL[contact.membership]} />
                  <Field label="Payment" value={contact.payment === 'none' ? '—' : contact.payment.charAt(0).toUpperCase() + contact.payment.slice(1)} />
                </div>
              </Section>

              {/* PAYMENTS */}
              <Section icon={CreditCard} title="Payments">
                <div className="divide-y rounded-lg border px-3">
                  <Field label="Method" value={contact.paymentMethod && contact.paymentMethod !== 'none' ? contact.paymentMethod : '—'} />
                  <Field label="Status" value={contact.payment === 'none' ? '—' : contact.payment} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pareto never stores card numbers or custodies funds. Only a method label is kept.
                </p>
              </Section>

              {/* TAGS */}
              <Section icon={TagIcon} title="Tags">
                {contact.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags.map((t) => (
                      <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground">No tags</p>}
              </Section>

              {/* REFERRAL */}
              <Section icon={Gift} title="Referral">
                <div className="divide-y rounded-lg border px-3">
                  <Field label="Source" value={SOURCE_LABEL[contact.source]} />
                  <Field label="Referred by" value={contact.referredBy} />
                </div>
              </Section>

              {/* PREFERENCES */}
              <Section icon={Settings2} title="Preferences">
                <div className="divide-y rounded-lg border px-3">
                  <Field label="Email delivery" value={contact.prefs.email === false ? 'Off' : 'On'} />
                  <Field label="Nostr delivery" value={contact.prefs.nostr === false ? 'Off' : 'On'} />
                  <Field label="Frequency" value={contact.prefs.frequency ?? 'All issues'} />
                </div>
              </Section>

              {/* NOTES */}
              <Section icon={StickyNote} title="Notes">
                {contact.notes ? (
                  <p className="whitespace-pre-wrap leading-relaxed rounded-lg border p-3 bg-muted/30">{contact.notes}</p>
                ) : <p className="text-muted-foreground">No notes</p>}
              </Section>

              {/* CONSENT */}
              <Section icon={ShieldCheck} title="Consent">
                <div className="divide-y rounded-lg border px-3">
                  <Field label="Recorded" value={contact.consentAt ? formatContactDate(contact.consentAt) : 'Not recorded'} />
                  <Field label="Note" value={contact.consentNote} />
                </div>
              </Section>

              {/* DATA / audit trail */}
              <Section icon={Database} title="Data & audit trail">
                <div className="rounded-lg border divide-y">
                  {contact.audit.length > 0 ? (
                    [...contact.audit].reverse().map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 text-xs">
                        <History className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-mono">{entry.change}</span>
                          {entry.note && <span className="text-muted-foreground"> — {entry.note}</span>}
                        </div>
                        <span className="text-muted-foreground shrink-0">{formatContactDate(entry.at)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No history yet.</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  This record is encrypted to your key and stored on your relays. You can edit or
                  remove it at any time. Pareto holds no copy you don't control.
                </p>
              </Section>
            </div>
          </div>
        )}

        <Separator />
      </SheetContent>
    </Sheet>
  );
}
