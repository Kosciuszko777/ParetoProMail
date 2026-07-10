import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowLeft, Rss, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { NEWSLETTER_CONFIG_KIND, buildNewsletterTags, slugify } from '@/lib/pareto';

export default function CreateNewsletter() {
  useSeoMeta({ title: 'Create Newsletter — Pareto Pro Mail' });

  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [loading, setLoading] = useState(false);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }

  const topics = topicsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim() || !slug.trim()) return;
    setLoading(true);
    try {
      const tags = buildNewsletterTags({ slug, title, description, image, topics });
      await publish({ kind: NEWSLETTER_CONFIG_KIND, content: '', tags });
      toast({ title: 'Newsletter created!', description: `"${title}" is live on Nostr.` });
      navigate(`/newsletter/${user.pubkey}/${slug}`);
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Sign in with Nostr to create a newsletter.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
          </Button>
          <h1 className="font-serif text-2xl font-bold">Create Newsletter</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Identity</CardTitle>
              <CardDescription>The public name and slug for your newsletter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. The Sovereign Writer"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">
                  Slug *
                  <span className="text-muted-foreground font-normal ml-2 text-xs">letters, numbers, hyphens</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    placeholder="the-sovereign-writer"
                    value={slug}
                    onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
                    pattern="[a-z0-9\-]+"
                    required
                  />
                  {slug && <Badge variant="secondary" className="shrink-0 text-xs font-mono">{slug}</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What is this newsletter about? Who is it for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Appearance & Discovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="image">Banner / Logo URL</Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://…"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="topics">
                  Topics
                  <span className="text-muted-foreground font-normal ml-2 text-xs">comma-separated</span>
                </Label>
                <Input
                  id="topics"
                  placeholder="bitcoin, journalism, freedom"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                />
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {topics.map((t) => <Badge key={t} variant="outline" className="text-xs font-normal">#{t}</Badge>)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Future: Stablezap + Refstr config (Phase 4 placeholders) */}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading || !title || !slug}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publish Newsletter
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
