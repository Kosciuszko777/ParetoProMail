import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Users, Lock, Plus, Trash2, Mail, Loader2, Download, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEmailContacts, useSaveEmailContacts } from '@/hooks/useEmailContacts';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useNewsletterSubscribers } from '@/hooks/useNewsletterSubscribers';
import { useAuthor } from '@/hooks/useAuthor';
import { useToast } from '@/hooks/useToast';
import type { EmailContact } from '@/lib/newsletter';
import { nip19 } from 'nostr-tools';

function NostrSubscriberRow({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const meta = author.data?.metadata;
  const displayName = meta?.name ?? nip19.npubEncode(pubkey).slice(0, 16) + '…';

  return (
    <div className="flex items-center gap-3 py-2">
      {meta?.picture ? (
        <img src={meta.picture} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
          {displayName[0]?.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{displayName}</p>
        <p className="text-xs text-slate-400 font-mono truncate">{nip19.npubEncode(pubkey)}</p>
      </div>
    </div>
  );
}

function AddContactDialog({ onAdd }: { onAdd: (contact: EmailContact) => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [npub, setNpub] = useState('');
  const [tags, setTagsInput] = useState('');

  function handleAdd() {
    if (!email.trim()) return;
    const contact: EmailContact = {
      email: email.trim(),
      name: name.trim() || undefined,
      subscribedAt: Math.floor(Date.now() / 1000),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      npub: npub.trim() || undefined,
    };
    onAdd(contact);
    setEmail(''); setName(''); setNpub(''); setTagsInput('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Email Contact</DialogTitle>
          <DialogDescription>
            Email contacts are encrypted with NIP-44 and stored privately on Nostr relays.
            Only you can read this list.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="alice@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="npub">Nostr npub (optional)</Label>
            <Input
              id="npub"
              placeholder="npub1..."
              value={npub}
              onChange={(e) => setNpub(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags <span className="text-slate-400 text-xs font-normal">comma-separated</span></Label>
            <Input
              id="tags"
              placeholder="vip, beta-reader"
              value={tags}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={!email.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Add Contact
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewsletterSubscriberBlock({ newsletterPubkey, slug, title }: { newsletterPubkey: string; slug: string; title: string }) {
  const { data: subscribers, isLoading } = useNewsletterSubscribers(newsletterPubkey, slug);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {isLoading ? <Skeleton className="h-3 w-24" /> : `${subscribers?.length ?? 0} Nostr subscribers`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : subscribers && subscribers.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {subscribers.map((s) => (
              <NostrSubscriberRow key={s.pubkey} pubkey={s.pubkey} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-2">No Nostr subscribers yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubscribersPage() {
  useSeoMeta({ title: 'Subscribers — Pareto Pro Mail' });

  const { user } = useCurrentUser();
  const { data: contacts, isLoading: contactsLoading } = useEmailContacts();
  const { data: newsletters } = useMyNewsletters();
  const { mutateAsync: saveContacts, isPending: saving } = useSaveEmailContacts();
  const { toast } = useToast();

  const [localContacts, setLocalContacts] = useState<EmailContact[] | null>(null);
  const displayContacts = localContacts ?? contacts ?? [];

  function handleAddContact(contact: EmailContact) {
    const next = [...displayContacts, contact];
    setLocalContacts(next);
  }

  function handleRemoveContact(email: string) {
    const next = displayContacts.filter((c) => c.email !== email);
    setLocalContacts(next);
  }

  async function handleSave() {
    try {
      await saveContacts(displayContacts);
      setLocalContacts(null);
      toast({ title: 'Saved', description: 'Email contacts encrypted and saved to Nostr relays.' });
    } catch (err) {
      toast({ title: 'Save failed', description: String(err), variant: 'destructive' });
    }
  }

  function exportCSV() {
    const rows = [
      ['Email', 'Name', 'Subscribed', 'Tags', 'npub'],
      ...displayContacts.map((c) => [
        c.email,
        c.name ?? '',
        new Date(c.subscribedAt * 1000).toISOString(),
        c.tags.join(';'),
        c.npub ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Please login to manage subscribers.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const hasUnsavedChanges = localContacts !== null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscribers</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage your Nostr and email subscribers
            </p>
          </div>
        </div>

        {/* Nostr subscribers per newsletter */}
        {newsletters && newsletters.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Nostr Subscribers</h2>
            </div>
            {newsletters.map((n) => (
              <NewsletterSubscriberBlock
                key={n.slug}
                newsletterPubkey={n.pubkey}
                slug={n.slug}
                title={n.title}
              />
            ))}
          </div>
        )}

        <Separator className="my-6" />

        {/* Email contacts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Email Contacts</h2>
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                NIP-44 Encrypted
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <AddContactDialog onAdd={handleAddContact} />
              {displayContacts.length > 0 && (
                <Button size="sm" variant="outline" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          <Card className="border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 mb-4">
            <CardContent className="py-4 px-5">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-700 dark:text-slate-300">Privacy notice:</strong> Email contacts are stored as a{' '}
                <strong>NIP-44 encrypted</strong> Nostr event (kind 13039). The contact list is encrypted{' '}
                <em>to yourself</em> — only your private key can read it. Relays store only ciphertext.
              </p>
            </CardContent>
          </Card>

          {contactsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : displayContacts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Mail className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No email contacts yet. Add subscribers manually or import a CSV.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayContacts.map((contact) => (
                    <div key={contact.email} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold text-green-600 dark:text-green-400 shrink-0">
                        {(contact.name ?? contact.email)[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {contact.name ?? contact.email}
                          </span>
                          {contact.tags.map((t) => (
                            <Badge key={t} variant="outline" className="text-xs py-0">
                              <Tag className="w-3 h-3 mr-0.5" />
                              {t}
                            </Badge>
                          ))}
                        </div>
                        {contact.name && (
                          <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                        )}
                        <p className="text-xs text-slate-400">
                          Added {new Date(contact.subscribedAt * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                        onClick={() => handleRemoveContact(contact.email)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasUnsavedChanges && (
            <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You have unsaved changes. Save to encrypt and store on Nostr relays.
              </p>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save Encrypted
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
