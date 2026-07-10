import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import {
  ArrowLeft, PenLine, Loader2, Eye, EyeOff, Save, Send, ExternalLink, CheckCircle2,
  FileText, Copy, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useMyNewsletters } from '@/hooks/useMyNewsletters';
import { useDraft } from '@/hooks/useIssue';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';
import {
  ISSUE_KIND, DRAFT_KIND, buildIssueTags, issueSlug as makeIssueSlug, slugify,
} from '@/lib/pareto';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';
import { DeliveryPanel } from '@/components/DeliveryPanel';
import { renderMarkdown } from '@/lib/markdown';

export default function ComposeIssue() {
  useSeoMeta({ title: 'Compose Issue — Pareto Pro Mail' });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultNl = searchParams.get('newsletter') ?? '';
  const draftParam = searchParams.get('draft') ?? '';

  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const { data: newsletters } = useMyNewsletters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing draft if ?draft=slug is present
  const { data: loadedDraft } = useDraft(user?.pubkey ?? '', draftParam);

  const [selectedNl, setSelectedNl] = useState(defaultNl);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [publishedNaddr, setPublishedNaddr] = useState<string | null>(null);
  const [paidOnly, setPaidOnly] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Load draft data into form
  useEffect(() => {
    if (loadedDraft && !draftLoaded) {
      setTitle(loadedDraft.title);
      setSummary(loadedDraft.summary ?? '');
      setContent(loadedDraft.content);
      setImage(loadedDraft.image ?? '');
      setTopicsInput(loadedDraft.topics.join(', '));
      setPaidOnly(loadedDraft.paidOnly);
      if (loadedDraft.newsletterSlug) {
        setSelectedNl(loadedDraft.newsletterSlug);
      }
      setDraftLoaded(true);
    }
  }, [loadedDraft, draftLoaded]);

  // Auto-select first newsletter
  useEffect(() => {
    if (!selectedNl && newsletters && newsletters.length > 0) {
      setSelectedNl(newsletters[0].slug);
    }
  }, [newsletters, selectedNl]);

  const topics = topicsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const chosenNl = newsletters?.find((n) => n.slug === selectedNl);

  // ── Draft autosave (every 30 s while typing) ──────────────────────────────
  const draftSlugRef = useRef<string>(draftParam || '');
  useEffect(() => {
    // If editing an existing draft, keep its slug; otherwise generate one
    if (draftParam) {
      draftSlugRef.current = draftParam;
    } else if (title && selectedNl) {
      draftSlugRef.current = `draft-${makeIssueSlug(selectedNl, title)}`;
    }
  }, [title, selectedNl, draftParam]);

  const saveDraft = useCallback(async () => {
    if (!user || !chosenNl || !title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const tags = buildIssueTags({
        slug: draftSlugRef.current,
        title,
        summary,
        image,
        topics,
        newsletterPubkey: user.pubkey,
        newsletterSlug: chosenNl.slug,
        paidOnly,
      });
      await publish({ kind: DRAFT_KIND, content, tags });
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['all-my-drafts'] });
    } catch {
      // silent — draft save is non-critical
    } finally {
      setSaving(false);
    }
  }, [user, chosenNl, title, summary, content, image, topics, publish, queryClient]);

  // Auto-save timer
  useEffect(() => {
    if (!title.trim() || !content.trim()) return;
    const timer = setTimeout(saveDraft, 30_000);
    return () => clearTimeout(timer);
  }, [content, title, saveDraft]);

  // ── Publish ───────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!user || !chosenNl || !title.trim() || !content.trim()) return;
    setPublishing(true);
    try {
      const slug = makeIssueSlug(chosenNl.slug, title);
      const tags = buildIssueTags({
        slug,
        title,
        summary,
        image,
        topics,
        newsletterPubkey: user.pubkey,
        newsletterSlug: chosenNl.slug,
        paidOnly,
      });
      const event = await publish({ kind: ISSUE_KIND, content, tags });

      const naddr = nip19.naddrEncode({
        kind: ISSUE_KIND,
        pubkey: user.pubkey,
        identifier: slug,
      });
      setPublishedNaddr(naddr);

      queryClient.invalidateQueries({ queryKey: ['newsletter-issues'] });
      queryClient.invalidateQueries({ queryKey: ['all-my-issues'] });
      queryClient.invalidateQueries({ queryKey: ['all-my-drafts'] });

      toast({
        title: 'Published!',
        description: 'Your issue is live on Nostr and visible in any NIP-23 client.',
      });

      void event; // suppress unused
    } catch (err) {
      toast({ title: 'Publish failed', description: String(err), variant: 'destructive' });
    } finally {
      setPublishing(false);
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Sign in with Nostr to start writing.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // ── Post-publish success ──────────────────────────────────────────────────
  if (publishedNaddr) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          {/* Success */}
          <div className="flex items-start gap-4 p-6 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 mb-8">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-serif text-xl font-bold text-green-900 dark:text-green-100">Issue Published</h2>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                <strong>"{title}"</strong> is now a permanent NIP-23 event on Nostr, visible in Habla, Highlighter, Yakihonne, and any long-form client.
              </p>
            </div>
          </div>

          {/* naddr card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-sans">Nostr Address (naddr)</CardTitle>
              <CardDescription>Share this link or use it in any Nostr client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted rounded-lg p-3 break-all">
                  {publishedNaddr}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(publishedNaddr); toast({ title: 'Copied!' }); }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interop links */}
          <div className="space-y-2 mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Verify in third-party clients</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Habla', url: `https://habla.news/a/${publishedNaddr}` },
                { name: 'Highlighter', url: `https://highlighter.com/a/${publishedNaddr}` },
                { name: 'Yakihonne', url: `https://yakihonne.com/article/${publishedNaddr}` },
                { name: 'njump', url: `https://njump.me/${publishedNaddr}` },
              ].map(({ name, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border bg-card hover:bg-accent transition-colors"
                >
                  {name}
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Delivery Panel */}
          {chosenNl && (
            <div className="mb-6">
              <DeliveryPanel
                issueNaddr={publishedNaddr}
                issueTitle={title}
                newsletterPubkey={user.pubkey}
                newsletterSlug={chosenNl.slug}
              />
            </div>
          )}

          {/* Actions */}
          <Separator className="my-6" />
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to={chosenNl ? `/newsletter/${user.pubkey}/${chosenNl.slug}` : '/'}>
                View Newsletter
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPublishedNaddr(null);
                setTitle(''); setSummary(''); setContent(''); setImage(''); setTopicsInput('');
              }}
            >
              <PenLine className="w-4 h-4 mr-1.5" />
              Write Another
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Composer ──────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={draftParam ? '/drafts' : '/'}><ArrowLeft className="w-4 h-4 mr-1" />{draftParam ? 'Drafts' : 'Back'}</Link>
            </Button>
            <h1 className="font-serif text-2xl font-bold">
              {draftParam ? 'Edit Draft' : 'Compose'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {saving && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving draft…</>}
            {!saving && lastSaved && (
              <span className="flex items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                Draft saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {(!newsletters || newsletters.length === 0) ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Create a newsletter first to start writing.</p>
              <Button asChild><Link to="/newsletter/new">Create Newsletter</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            {/* Left: editor */}
            <div className="space-y-6 min-w-0">
              {/* Title */}
              <div>
                <Input
                  placeholder="Issue title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-0 border-b rounded-none text-2xl font-serif font-bold px-0 h-auto py-3 focus-visible:ring-0 placeholder:text-muted-foreground/40"
                />
              </div>

              {/* Content editor / preview */}
              <div className="relative min-h-[480px]">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-card/80 backdrop-blur-sm"
                    onClick={() => setPreview(!preview)}
                  >
                    {preview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {preview ? 'Edit' : 'Preview'}
                  </Button>
                </div>

                {preview ? (
                  <div className="min-h-[480px] rounded-xl border bg-card p-8">
                    {image && (
                      <div className="w-full h-48 rounded-lg overflow-hidden mb-6 bg-muted">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h1 className="font-serif text-3xl font-bold mb-2">{title || 'Untitled'}</h1>
                    {summary && <p className="text-lg text-muted-foreground mb-6">{summary}</p>}
                    <div
                      className="prose prose-stone dark:prose-invert max-w-none font-sans text-[15px] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '*Start writing…*') }}
                    />
                  </div>
                ) : (
                  <Textarea
                    placeholder="Start writing your issue…&#10;&#10;# Use Markdown&#10;&#10;Write freely. Your words become a permanent, censorship-resistant NIP-23 event the moment you publish."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[480px] font-mono text-sm resize-y rounded-xl border p-6 leading-relaxed"
                  />
                )}
              </div>
            </div>

            {/* Right: sidebar */}
            <div className="space-y-5">
              {/* Newsletter selector */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-sans">Newsletter</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedNl} onValueChange={setSelectedNl}>
                    <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                    <SelectContent>
                      {newsletters.map((n) => (
                        <SelectItem key={n.slug} value={n.slug}>{n.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-sans">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Summary / Preview</Label>
                    <Input
                      placeholder="One-line teaser"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cover Image URL</Label>
                    <Input
                      type="url"
                      placeholder="https://…"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Topics <span className="text-muted-foreground font-normal">comma-separated</span></Label>
                    <Input
                      placeholder="bitcoin, journalism"
                      value={topicsInput}
                      onChange={(e) => setTopicsInput(e.target.value)}
                      className="text-sm"
                    />
                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {topics.map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Paid content toggle */}
              {chosenNl?.paidSats && chosenNl.paidSats > 0 && (
                <Card>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">Paid only</p>
                          <p className="text-xs text-muted-foreground">Require {chosenNl.paidSats} sats</p>
                        </div>
                      </div>
                      <Switch checked={paidOnly} onCheckedChange={setPaidOnly} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={handlePublish}
                  disabled={publishing || !title.trim() || !content.trim() || !selectedNl}
                  className="w-full"
                >
                  {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {paidOnly ? 'Publish (Paid)' : 'Publish'}
                </Button>
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={saving || !title.trim() || !content.trim()}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </div>

              {/* Interop note */}
              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">NIP-23 compatible.</strong> Your issue becomes a signed kind 30023 event — readable in Habla, Highlighter, Yakihonne, and any NIP-23 client.
                Drafts are saved as kind 30024.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
