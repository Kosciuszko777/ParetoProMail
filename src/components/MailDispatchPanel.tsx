import { useState, useEffect } from 'react';
import {
  Send,
  Clock,
  CalendarClock,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSendIssue, type SendProgress } from '@/hooks/useSendIssue';
import { useMailDispatches } from '@/hooks/useMailDispatches';
import { useNewsletterSubscribers } from '@/hooks/useNewsletterSubscribers';
import type { NostrEvent } from '@nostrify/nostrify';
import type { MailDispatch } from '@/lib/newsletter';
import { nanoid } from '@/lib/nanoid';

interface MailDispatchPanelProps {
  issueEvent: NostrEvent;
  issueTitle: string;
  newsletterPubkey: string;
  newsletterSlug: string;
}

type SendMode = 'immediate' | 'scheduled';

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: MailDispatch['status'] }) {
  const map: Record<MailDispatch['status'], { label: string; className: string }> = {
    scheduled: { label: 'Scheduled', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    sending: { label: 'Sending…', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    sent: { label: 'Sent', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  };
  const { label, className } = map[status];
  return <Badge className={cn('text-xs font-medium border-0', className)}>{label}</Badge>;
}

export function MailDispatchPanel({
  issueEvent,
  issueTitle,
  newsletterPubkey,
  newsletterSlug,
}: MailDispatchPanelProps) {
  const { user } = useCurrentUser();
  const { sendIssue, abort } = useSendIssue();
  const { dispatches, addDispatch, cancelDispatch, refresh } = useMailDispatches();
  const { data: subscribers, isLoading: subLoading } = useNewsletterSubscribers(
    newsletterPubkey,
    newsletterSlug
  );

  const [mode, setMode] = useState<SendMode>('immediate');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [expanded, setExpanded] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<SendProgress | null>(null);
  const [result, setResult] = useState<{ delivered: number; failed: number; total: number } | null>(null);
  const [calOpen, setCalOpen] = useState(false);

  // Refresh dispatches list on mount
  useEffect(() => { refresh(); }, [refresh]);

  // Dispatches for this specific issue
  const issueDispatches = dispatches.filter((d) => d.issueEventId === issueEvent.id);
  const alreadySent = issueDispatches.some((d) => d.status === 'sent');
  const isScheduled = issueDispatches.some((d) => d.status === 'scheduled');

  const subscriberCount = subscribers?.length ?? 0;

  function getScheduledTimestamp(): number {
    if (!scheduleDate) return 0;
    const [h, m] = scheduleTime.split(':').map(Number);
    const d = new Date(scheduleDate);
    d.setHours(h, m, 0, 0);
    return Math.floor(d.getTime() / 1000);
  }

  const scheduledTs = getScheduledTimestamp();
  const scheduleValid = mode === 'immediate' || (scheduleDate !== undefined && scheduledTs > Date.now() / 1000);

  async function handleSendNow() {
    if (!user || !subscribers || subscribers.length === 0) return;
    setSending(true);
    setProgress({ total: subscribers.length, done: 0, failed: 0 });
    setResult(null);

    // Record dispatch
    const dispatch: MailDispatch = {
      id: nanoid(),
      issueEventId: issueEvent.id,
      issueTitle,
      newsletterSlug,
      pubkey: user.pubkey,
      scheduledAt: Math.floor(Date.now() / 1000),
      status: 'sending',
      recipientCount: subscribers.length,
    };
    addDispatch(dispatch);

    try {
      const res = await sendIssue({
        issueEvent,
        subscribers,
        onProgress: setProgress,
      });
      setResult(res);
      // Update dispatch to sent
      const all = dispatches;
      const existing = all.find((d) => d.id === dispatch.id);
      if (existing) {
        // useMailDispatches patches via addDispatch with upsert
        addDispatch({
          ...dispatch,
          status: 'sent',
          sentAt: Math.floor(Date.now() / 1000),
          deliveredCount: res.delivered,
        });
      }
    } catch (err) {
      addDispatch({ ...dispatch, status: 'failed', note: String(err) });
    } finally {
      setSending(false);
      refresh();
    }
  }

  function handleAbort() {
    abort();
    setSending(false);
  }

  function handleSchedule() {
    if (!user || !scheduleDate || !scheduleValid) return;
    const dispatch: MailDispatch = {
      id: nanoid(),
      issueEventId: issueEvent.id,
      issueTitle,
      newsletterSlug,
      pubkey: user.pubkey,
      scheduledAt: scheduledTs,
      status: 'scheduled',
      recipientCount: subscriberCount,
    };
    addDispatch(dispatch);
    refresh();
  }

  if (!user) return null;

  return (
    <Card className="border-indigo-200 dark:border-indigo-800 shadow-sm">
      {/* Header */}
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-base text-indigo-800 dark:text-indigo-200">
                Send to Subscribers
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {subLoading
                  ? 'Loading subscribers…'
                  : `${subscriberCount} Nostr subscriber${subscriberCount !== 1 ? 's' : ''}`}
                {alreadySent && (
                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                    · Already sent
                  </span>
                )}
                {isScheduled && !alreadySent && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                    · Delivery scheduled
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alreadySent && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {isScheduled && !alreadySent && <Clock className="w-5 h-5 text-amber-500" />}
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-5">
          {/* No subscribers warning */}
          {!subLoading && subscriberCount === 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                No Nostr subscribers yet. Share your subscribe link to grow your audience.
              </p>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 gap-1">
            <button
              onClick={() => setMode('immediate')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                mode === 'immediate'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <Send className="w-4 h-4" />
              Send Now
            </button>
            <button
              onClick={() => setMode('scheduled')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                mode === 'scheduled'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <CalendarClock className="w-4 h-4" />
              Schedule
            </button>
          </div>

          {/* Immediate send */}
          {mode === 'immediate' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4" />
                    Recipients
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {subscriberCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Delivery method</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">NIP-59 Gift Wrap</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Encryption</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">NIP-44 per recipient</span>
                </div>
              </div>

              {/* Progress */}
              {sending && progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>
                      Sending to {progress.done} / {progress.total}…
                    </span>
                    {progress.failed > 0 && (
                      <span className="text-red-500">{progress.failed} failed</span>
                    )}
                  </div>
                  <Progress
                    value={Math.round((progress.done / Math.max(progress.total, 1)) * 100)}
                    className="h-2"
                  />
                </div>
              )}

              {/* Result */}
              {result && !sending && (
                <div className={cn(
                  'flex items-center gap-2.5 p-3 rounded-lg border text-sm',
                  result.failed === 0
                    ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                )}>
                  {result.failed === 0 ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    Delivered to <strong>{result.delivered}</strong> subscriber{result.delivered !== 1 ? 's' : ''}
                    {result.failed > 0 && `. ${result.failed} failed.`}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                {sending ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:border-red-400"
                    onClick={handleAbort}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Abort
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendNow}
                    disabled={subscriberCount === 0 || !!result}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-1.5" />
                    )}
                    {result ? 'Sent ✓' : `Send to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Scheduled send */}
          {mode === 'scheduled' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Date picker */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <Popover open={calOpen} onOpenChange={setCalOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !scheduleDate && 'text-slate-400'
                        )}
                      >
                        <CalendarClock className="w-4 h-4 mr-2 text-slate-400" />
                        {scheduleDate
                          ? scheduleDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={(d) => { setScheduleDate(d); setCalOpen(false); }}
                        disabled={(date) => date < new Date(Date.now() - 86400_000)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Time picker */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Time (local)
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Preview */}
              {scheduleDate && scheduleValid && (
                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-sm">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      Will send to <strong>{subscriberCount}</strong> subscriber{subscriberCount !== 1 ? 's' : ''} on{' '}
                      <strong>{formatDate(scheduledTs)}</strong>
                    </span>
                  </div>
                </div>
              )}

              {scheduleDate && !scheduleValid && (
                <p className="text-sm text-red-500">Please choose a future date and time.</p>
              )}

              <Button
                onClick={handleSchedule}
                disabled={!scheduleDate || !scheduleValid || subscriberCount === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <CalendarClock className="w-4 h-4 mr-1.5" />
                Schedule Delivery
              </Button>

              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                The send will execute in your browser when the app is open at or after the scheduled time.
                Keep this tab active or return before the scheduled time.
              </p>
            </div>
          )}

          {/* Dispatch history for this issue */}
          {issueDispatches.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Dispatch History
                </p>
                {issueDispatches.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <StatusBadge status={d.status} />
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {d.status === 'scheduled'
                          ? `Scheduled for ${formatDate(d.scheduledAt)}`
                          : d.status === 'sent'
                          ? `Sent ${d.sentAt ? formatDate(d.sentAt) : ''} · ${d.deliveredCount ?? 0}/${d.recipientCount ?? 0} delivered`
                          : d.status === 'sending'
                          ? 'Sending now…'
                          : d.status === 'failed'
                          ? `Failed: ${d.note ?? 'unknown error'}`
                          : 'Cancelled'}
                      </span>
                    </div>
                    {d.status === 'scheduled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 shrink-0 h-7 px-2"
                        onClick={() => { cancelDispatch(d.id); refresh(); }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
