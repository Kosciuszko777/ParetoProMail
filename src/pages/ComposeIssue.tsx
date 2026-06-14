import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowLeft, PenSquare, Loader2, Eye, EyeOff, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/AppLayout';
import { MailDispatchPanel } from '@/components/MailDispatchPanel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useToast } from '@/hooks/useToast';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NEWSLETTER_ISSUE_KIND, newsletterATag } from '@/lib/newsletter';
import type { NostrEvent } from '@nostrify/nostrify';

export default function ComposeIssue() {
  useSeoMeta({ title: 'Compose Issue — NostrMail' });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultNewsletter = searchParams.get('newsletter') ?? '';

  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const { data: newsletters } = useMyNewsletters();
  const { toast } = useToast();
  const { nostr } = useNostr();

  const [selectedNewsletter, setSelectedNewsletter] = useState(defaultNewsletter);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  // After publish: hold the created event ID for dispatch panel
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);
  const [publishedSlugNewsletter, setPublishedSlugNewsletter] = useState('');

  useEffect(() => {
    if (!selectedNewsletter && newsletters && newsletters.length > 0) {
      setSelectedNewsletter(newsletters[0].slug);
    }
  }, [newsletters, selectedNewsletter]);

  const topics = topicsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const chosenNewsletter = newsletters?.find((n) => n.slug === selectedNewsletter);

  // Fetch the published event so we can pass it to MailDispatchPanel
  const { data: publishedEvent } = useQuery<NostrEvent | null>({
    queryKey: ['compose-published-event', publishedEventId],
    enabled: !!publishedEventId,
    queryFn: async (ctx) => {
      if (!publishedEventId) return null;
      const events = await nostr.query(
        [{ ids: [publishedEventId], kinds: [NEWSLETTER_ISSUE_KIND], limit: 1 }],
        { signal: ctx.signal }
      );
      return events[0] ?? null;
    },
    staleTime: Infinity,
    retry: 5,
    retryDelay: 2000,
  });

  function issueSlug() {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    return `${selectedNewsletter}-${Date.now()}-${base}`;
  }

  async function handlePublish() {
    if (!user || !chosenNewsletter || !title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const aTag = newsletterATag(user.pubkey, chosenNewsletter.slug);
      const tags: string[][] = [
        ['d', issueSlug()],
        ['title', title],
        ['published_at', String(now)],
        ['a', aTag],
        ['alt', `Newsletter issue: ${title}`],
      ];
      if (summary) tags.push(['summary', summary]);
      if (image) tags.push(['image', image]);
      topics.forEach((t) => tags.push(['t', t]));

      const created = await publish({
        kind: NEWSLETTER_ISSUE_KIND,
        content,
        tags,
      });

      toast({
        title: 'Issue published!',
        description: `"${title}" is live on Nostr. Now choose delivery options below.`,
      });

      setPublishedEventId(created.id);
      setPublishedSlugNewsletter(chosenNewsletter.slug);
    } catch (err) {
      toast({ title: 'Error publishing issue', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Please login to compose an issue.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // ── Post-publish view: show the dispatch panel ──
  if (publishedEventId) {
    const nl = newsletters?.find((n) => n.slug === publishedSlugNewsletter);

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link to={nl ? `/newsletter/${user.pubkey}/${nl.slug}` : '/'}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Newsletter
              </Link>
            </Button>
          </div>

          {/* Success banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 mb-8">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">Issue Published!</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                <strong>"{title}"</strong> is live on Nostr. Now decide how to deliver it to your subscribers.
              </p>
            </div>
          </div>

          {/* Dispatch panel */}
          {nl && publishedEvent ? (
            <MailDispatchPanel
              issueEvent={publishedEvent}
              issueTitle={title}
              newsletterPubkey={user.pubkey}
              newsletterSlug={nl.slug}
            />
          ) : (
            <Card className="border-indigo-100 dark:border-indigo-900">
              <CardContent className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading delivery options…</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button asChild variant="outline">
              <Link to={nl ? `/newsletter/${user.pubkey}/${nl.slug}` : '/'}>
                View Newsletter
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPublishedEventId(null);
                setTitle('');
                setSummary('');
                setContent('');
                setImage('');
                setTopicsInput('');
              }}
            >
              <PenSquare className="w-4 h-4 mr-1.5" />
              Compose Another
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <PenSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Compose Issue</h1>
          </div>
        </div>

        {(!newsletters || newsletters.length === 0) ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 mb-4">You need to create a newsletter first.</p>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link to="/newsletter/new">Create Newsletter</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Newsletter</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedNewsletter} onValueChange={setSelectedNewsletter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose newsletter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {newsletters.map((n) => (
                      <SelectItem key={n.slug} value={n.slug}>{n.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    placeholder="Issue #1: Your compelling headline here"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="summary">Preview / Summary</Label>
                  <Input
                    id="summary"
                    placeholder="One-line summary shown in email previews"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="image">Header Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://example.com/header.jpg"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="topics">Topics <span className="text-slate-400 font-normal ml-1 text-xs">comma-separated</span></Label>
                  <Input
                    id="topics"
                    placeholder="bitcoin, privacy, journalism"
                    value={topicsInput}
                    onChange={(e) => setTopicsInput(e.target.value)}
                  />
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {topics.map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Content *</CardTitle>
                  <CardDescription>Markdown supported</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {preview ? 'Edit' : 'Preview'}
                </Button>
              </CardHeader>
              <CardContent>
                {preview ? (
                  <div
                    className="min-h-64 prose prose-slate dark:prose-invert max-w-none text-sm border rounded-lg p-4 bg-slate-50 dark:bg-slate-900"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(content) }}
                  />
                ) : (
                  <Textarea
                    placeholder={`# Your Newsletter Issue\n\nStart writing your newsletter content here...\n\n## Section 1\n\nYour content...\n\n---\n\n*Thank you for reading!*`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={18}
                    className="font-mono text-sm"
                  />
                )}
              </CardContent>
            </Card>

            {/* Delivery hint */}
            <Card className="border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20">
              <CardContent className="py-4 px-5 flex items-start gap-3">
                <Send className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  After publishing, you'll be able to <strong>send immediately</strong> or <strong>schedule a future delivery</strong> to all your Nostr subscribers via NIP-59 gift wraps.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={handlePublish}
                disabled={loading || !title.trim() || !content.trim() || !selectedNewsletter}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Publish Issue
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Discard</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Safe markdown preview (only HTML in controlled strings, no untrusted URL injection)
function renderMarkdownPreview(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-3 mb-1">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-2 mb-1">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr class="my-4 border-slate-200 dark:border-slate-700" />')
    .replace(/\n\n/g, '</p><p class="mb-3">');
}
