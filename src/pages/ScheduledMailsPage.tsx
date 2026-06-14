import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMailDispatches } from '@/hooks/useMailDispatches';
import type { MailDispatch } from '@/lib/newsletter';
import { cn } from '@/lib/utils';

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeUntil(ts: number): string {
  const diff = ts - Date.now() / 1000;
  if (diff <= 0) return 'Due now';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  if (h > 48) return `in ${Math.floor(h / 24)} days`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

const STATUS_CONFIG: Record<
  MailDispatch['status'],
  { icon: React.ElementType; label: string; badgeClass: string; rowClass: string }
> = {
  scheduled: {
    icon: Clock,
    label: 'Scheduled',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0',
    rowClass: 'border-l-4 border-amber-400',
  },
  sending: {
    icon: Loader2,
    label: 'Sending…',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0',
    rowClass: 'border-l-4 border-blue-400',
  },
  sent: {
    icon: CheckCircle2,
    label: 'Sent',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0',
    rowClass: 'border-l-4 border-green-400',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0',
    rowClass: 'border-l-4 border-red-400',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-0',
    rowClass: 'border-l-4 border-slate-300 dark:border-slate-600',
  },
};

function DispatchCard({ dispatch, onCancel }: { dispatch: MailDispatch; onCancel: (id: string) => void }) {
  const cfg = STATUS_CONFIG[dispatch.status];
  const Icon = cfg.icon;

  return (
    <Card className={cn('transition-all', cfg.rowClass)}>
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
              dispatch.status === 'sent' ? 'bg-green-100 dark:bg-green-900/40' :
              dispatch.status === 'scheduled' ? 'bg-amber-100 dark:bg-amber-900/40' :
              dispatch.status === 'sending' ? 'bg-blue-100 dark:bg-blue-900/40' :
              dispatch.status === 'failed' ? 'bg-red-100 dark:bg-red-900/40' :
              'bg-slate-100 dark:bg-slate-800'
            )}>
              <Icon className={cn(
                'w-4 h-4',
                dispatch.status === 'sending' && 'animate-spin',
                dispatch.status === 'sent' ? 'text-green-600 dark:text-green-400' :
                dispatch.status === 'scheduled' ? 'text-amber-600 dark:text-amber-400' :
                dispatch.status === 'sending' ? 'text-blue-600 dark:text-blue-400' :
                dispatch.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                'text-slate-400'
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {dispatch.issueTitle}
                </span>
                <Badge className={cn('text-xs', cfg.badgeClass)}>{cfg.label}</Badge>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">
                Newsletter: <span className="font-mono">{dispatch.newsletterSlug}</span>
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {dispatch.status === 'scheduled' && (
                  <>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Scheduled: {formatDate(dispatch.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {timeUntil(dispatch.scheduledAt)}
                    </span>
                  </>
                )}
                {dispatch.status === 'sending' && (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending now…
                  </span>
                )}
                {dispatch.status === 'sent' && (
                  <>
                    {dispatch.sentAt && (
                      <span className="flex items-center gap-1">
                        <Send className="w-3.5 h-3.5" />
                        Sent: {formatDate(dispatch.sentAt)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {dispatch.deliveredCount ?? 0} / {dispatch.recipientCount ?? 0} delivered
                    </span>
                  </>
                )}
                {dispatch.status === 'failed' && (
                  <span className="flex items-center gap-1 text-red-500">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {dispatch.note ?? 'Unknown error'}
                  </span>
                )}
                {dispatch.status === 'cancelled' && (
                  <span>Cancelled</span>
                )}
                {dispatch.recipientCount !== undefined && dispatch.status !== 'sent' && (
                  <span>~{dispatch.recipientCount} recipients</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-slate-400 hover:text-indigo-600">
              <Link to={`/issue/${dispatch.issueEventId}`}>
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Issue
              </Link>
            </Button>
            {dispatch.status === 'scheduled' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => onCancel(dispatch.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ScheduledMailsPage() {
  useSeoMeta({ title: 'Mail Dispatches — NostrMail' });

  const { user } = useCurrentUser();
  const { dispatches, cancelDispatch, refresh } = useMailDispatches();

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Please login to view mail dispatches.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const scheduled = dispatches.filter((d) => d.status === 'scheduled');
  const active = dispatches.filter((d) => d.status === 'sending');
  const history = dispatches.filter((d) => d.status === 'sent' || d.status === 'failed' || d.status === 'cancelled');

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="w-6 h-6 text-indigo-500" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mail Dispatches</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Track scheduled and completed newsletter deliveries
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Scheduled', value: scheduled.length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
            { label: 'Sending', value: active.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
            { label: 'Sent', value: dispatches.filter((d) => d.status === 'sent').length, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40' },
          ].map(({ label, value, color, bg }) => (
            <Card key={label} className={cn('border-0', bg)}>
              <CardContent className="py-4 text-center">
                <p className={cn('text-3xl font-bold', color)}>{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active */}
        {active.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Active
            </h2>
            <div className="space-y-3">
              {active.map((d) => (
                <DispatchCard key={d.id} dispatch={d} onCancel={cancelDispatch} />
              ))}
            </div>
          </div>
        )}

        {/* Scheduled */}
        {scheduled.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Scheduled
            </h2>
            <div className="space-y-3">
              {scheduled
                .sort((a, b) => a.scheduledAt - b.scheduledAt)
                .map((d) => (
                  <DispatchCard key={d.id} dispatch={d} onCancel={cancelDispatch} />
                ))}
            </div>
          </div>
        )}

        {(active.length > 0 || scheduled.length > 0) && history.length > 0 && (
          <Separator className="my-6" />
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              History
            </h2>
            <div className="space-y-3">
              {history
                .sort((a, b) => (b.sentAt ?? b.scheduledAt) - (a.sentAt ?? a.scheduledAt))
                .map((d) => (
                  <DispatchCard key={d.id} dispatch={d} onCancel={cancelDispatch} />
                ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {dispatches.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <CalendarClock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No dispatches yet
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6 text-sm">
                When you send or schedule an issue, it'll appear here. Open any issue and use the
                "Send to Subscribers" panel to get started.
              </p>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link to="/issues">Browse Issues</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info card */}
        <Card className="mt-10 border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20">
          <CardHeader>
            <CardTitle className="text-sm text-indigo-700 dark:text-indigo-300">How scheduled sends work</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              Scheduled dispatches are stored in your browser's local storage, encrypted with your Nostr identity.
              When the scheduled time arrives, NostrMail will automatically trigger the send if this tab is open.
            </p>
            <p>
              Each subscriber receives a <strong>NIP-59 gift wrap</strong> — their copy is individually encrypted
              with <strong>NIP-44</strong>, so no relay or third party can read delivery contents.
            </p>
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Keep this tab open or return before the scheduled time — browser-based scheduling requires the page to be active.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
