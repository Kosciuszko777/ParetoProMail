import { useMemo, useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import {
  Lock, Users, Mail, Zap, Crown, UserRound, CalendarPlus, UserMinus, Gift,
  Search, Plus, SlidersHorizontal, X, ShieldCheck, Download,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAudienceVault } from '@/hooks/useAudienceVault';
import { ContactProfile } from '@/components/audience/ContactProfile';
import { ContactForm } from '@/components/audience/ContactForm';
import { IdentityBadge } from '@/components/audience/IdentityBadge';
import { StatusBadge } from '@/components/audience/StatusBadge';
import {
  MEMBERSHIP_LABEL, SOURCE_LABEL, formatContactDate,
  type Contact, type SubscriptionStatus, type ContactType,
} from '@/lib/pareto';
import { cn } from '@/lib/utils';

// ─── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, tone,
}: { icon: typeof Users; label: string; value: number; tone?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', tone ?? 'bg-primary/10')}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums leading-none">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type TypeFilter = 'all' | ContactType;
type MembershipFilter = 'all' | 'paid' | 'free';

const STATUS_FILTERS: { value: SubscriptionStatus; label: string }[] = [
  { value: 'subscribed', label: 'Subscribed' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'pending', label: 'Pending' },
  { value: 'suppressed', label: 'Suppressed' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'follower', label: 'Nostr follower' },
  { value: 'paid', label: 'Paid member' },
  { value: 'founding', label: 'Founding member' },
];

export default function AudiencePage() {
  useSeoMeta({
    title: 'Audience — Pareto Pro Mail',
    description: 'Your relationships. Your data. Your control. A privacy-first alternative to a conventional CRM.',
  });

  const { user } = useCurrentUser();
  const { data: contacts, isLoading } = useAudienceVault();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'referral' | 'direct'>('all');
  const [statusFilters, setStatusFilters] = useState<Set<SubscriptionStatus>>(new Set());

  const [selected, setSelected] = useState<Contact | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const list = contacts ?? [];

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
    return {
      total: list.length,
      email: list.filter((c) => c.type === 'email' || c.type === 'hybrid').length,
      nostr: list.filter((c) => c.type === 'nostr' || c.type === 'hybrid').length,
      paid: list.filter((c) => c.membership === 'paid' || c.membership === 'founding').length,
      free: list.filter((c) => c.membership === 'free').length,
      newThisMonth: list.filter((c) => c.joinedAt >= monthStart).length,
      unsubscribed: list.filter((c) => c.status === 'unsubscribed').length,
      referrals: list.filter((c) => c.source === 'referral').length,
    };
  }, [list]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((c) => {
      if (q) {
        const hay = [c.displayName, c.email, c.npub, c.nip05, c.id, ...c.tags]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (membershipFilter === 'paid' && !(c.membership === 'paid' || c.membership === 'founding')) return false;
      if (membershipFilter === 'free' && c.membership !== 'free') return false;
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
      if (statusFilters.size > 0 && !statusFilters.has(c.status)) return false;
      return true;
    });
  }, [list, search, typeFilter, membershipFilter, sourceFilter, statusFilters]);

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (membershipFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0) +
    statusFilters.size;

  const clearFilters = () => {
    setTypeFilter('all');
    setMembershipFilter('all');
    setSourceFilter('all');
    setStatusFilters(new Set());
    setSearch('');
  };

  const toggleStatus = (s: SubscriptionStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const openContact = (c: Contact) => { setSelected(c); setProfileOpen(true); };

  const exportCsv = () => {
    const header = ['id', 'name', 'email', 'npub', 'nip05', 'type', 'status', 'membership', 'payment', 'source', 'tags', 'joined'];
    const rows = filtered.map((c) => [
      c.id, c.displayName ?? '', c.email ?? '', c.npub ?? '', c.nip05 ?? '',
      c.type, c.status, c.membership, c.payment, c.source,
      c.tags.join('|'), new Date(c.joinedAt * 1000).toISOString(),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pareto-audience-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Sign in to open your Audience Vault.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Audience</h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Your relationships. Your data. Your control.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} className="gap-1.5">
              <Download className="w-4 h-4" /> Export
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add contact
            </Button>
          </div>
        </div>

        {/* Encryption indicator */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary mb-6">
          <Lock className="w-3 h-3" />
          Audience Vault encrypted
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Users} label="Total contacts" value={stats.total} />
          <StatCard icon={Mail} label="Email subscribers" value={stats.email} tone="bg-blue-500/10" />
          <StatCard icon={Zap} label="Nostr subscribers" value={stats.nostr} tone="bg-purple-500/10" />
          <StatCard icon={Crown} label="Paid members" value={stats.paid} tone="bg-amber-500/10" />
          <StatCard icon={UserRound} label="Free members" value={stats.free} />
          <StatCard icon={CalendarPlus} label="New this month" value={stats.newThisMonth} tone="bg-green-500/10" />
          <StatCard icon={UserMinus} label="Unsubscribed" value={stats.unsubscribed} tone="bg-muted" />
          <StatCard icon={Gift} label="Referrals" value={stats.referrals} tone="bg-pink-500/10" />
        </div>

        {/* Search & filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, npub, NIP-05, tag or ID…"
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="nostr">Nostr</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={membershipFilter} onValueChange={(v) => setMembershipFilter(v as MembershipFilter)}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">{activeFilterCount}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Subscription status</DropdownMenuLabel>
                {STATUS_FILTERS.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s.value}
                    checked={statusFilters.has(s.value)}
                    onCheckedChange={() => toggleStatus(s.value)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {s.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Source</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sources</SelectItem>
                      <SelectItem value="referral">Referred</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Filters here are relationship-based only. No behavioral tracking, engagement scoring, or profiling.
        </p>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 px-8 text-center">
              {list.length === 0 ? (
                <>
                  <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-serif text-lg font-semibold mb-1">Your vault is empty</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-5 text-sm">
                    Add your first relationship. Contacts are encrypted to your key — email-only,
                    Nostr-only, both, or fully pseudonymous.
                  </p>
                  <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                    <Plus className="w-4 h-4" /> Add your first contact
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No contacts match your search or filters.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Identity</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const name = c.displayName
                      || c.nip05
                      || (c.npub ? c.npub.slice(0, 14) + '…' : null)
                      || c.email
                      || c.id;
                    const contactLine = c.email || c.nip05 || c.npub || '—';
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => openContact(c)}
                      >
                        <TableCell className="font-medium max-w-[160px] truncate">{name}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground text-xs font-mono">{contactLine}</TableCell>
                        <TableCell><IdentityBadge kind={c.identityKind} /></TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {c.tags.slice(0, 2).map((t) => (
                              <Badge key={t} variant="outline" className="text-xs font-normal px-1.5">{t}</Badge>
                            ))}
                            {c.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs font-normal px-1.5">+{c.tags.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{MEMBERSHIP_LABEL[c.membership]}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.payment === 'none' ? '—' : c.payment.charAt(0).toUpperCase() + c.payment.slice(1)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{SOURCE_LABEL[c.source]}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                          {formatContactDate(c.joinedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {filtered.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-right">
            {filtered.length} of {list.length} contact{list.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Profile side panel */}
      <ContactProfile contact={selected} open={profileOpen} onOpenChange={setProfileOpen} />

      {/* Add contact sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-serif text-xl">Add contact</SheetTitle>
            <SheetDescription>
              Minimal by design. Only what you need to know the relationship — encrypted to your key.
            </SheetDescription>
          </SheetHeader>
          <ContactForm onDone={() => setAddOpen(false)} onCancel={() => setAddOpen(false)} />
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
