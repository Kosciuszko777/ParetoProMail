import { Mail, Zap, Layers, VenetianMask } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ContactIdentityKind } from '@/lib/pareto';

const CONFIG: Record<ContactIdentityKind, { label: string; icon: typeof Mail; className: string }> = {
  email: {
    label: 'Email',
    icon: Mail,
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
  nostr: {
    label: 'Nostr',
    icon: Zap,
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  },
  hybrid: {
    label: 'Hybrid',
    icon: Layers,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  pseudonymous: {
    label: 'Pseudonymous',
    icon: VenetianMask,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
};

export function IdentityBadge({ kind, className }: { kind: ContactIdentityKind; className?: string }) {
  const { label, icon: Icon, className: tone } = CONFIG[kind];
  return (
    <Badge variant="outline" className={cn('font-normal text-xs gap-1', tone, className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
