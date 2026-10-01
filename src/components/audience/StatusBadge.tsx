import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SUBSCRIPTION_STATUS_LABEL, type SubscriptionStatus } from '@/lib/pareto';

const TONE: Record<SubscriptionStatus, string> = {
  subscribed: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
  unsubscribed: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  suppressed: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  bounced: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  follower: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  paid: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
  founding: 'bg-primary/10 text-primary border-primary/30',
};

export function StatusBadge({ status, className }: { status: SubscriptionStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('font-normal text-xs', TONE[status], className)}>
      {SUBSCRIPTION_STATUS_LABEL[status]}
    </Badge>
  );
}
