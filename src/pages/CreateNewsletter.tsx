import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { NEWSLETTER_KIND } from '@/lib/newsletter';
import { Link } from 'react-router-dom';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

export default function CreateNewsletter() {
  useSeoMeta({ title: 'Create Newsletter — Pareto Pro Mail' });

  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [image, setImage] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [loading, setLoading] = useState(false);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }

  const topics = topicsInput
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !slug.trim()) return;

    setLoading(true);
    try {
      const tags: string[][] = [
        ['d', slug],
        ['title', title],
        ['alt', `Nostr Newsletter: ${title}`],
      ];
      if (summary) tags.push(['summary', summary]);
      if (image) tags.push(['image', image]);
      if (email) tags.push(['email', email]);
      if (website) tags.push(['website', website]);
      tags.push(['lang', 'en']);
      topics.forEach((t) => tags.push(['t', t]));

      await publish({
        kind: NEWSLETTER_KIND,
        content,
        tags,
      });

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
            <p className="text-slate-500 mb-2">Please login to create a newsletter.</p>
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
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <Rss className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Newsletter</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identity</CardTitle>
              <CardDescription>The public-facing name and identifier for your newsletter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Newsletter Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. The Pareto Newsletter"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">
                  Slug (URL identifier) *
                  <span className="text-slate-400 font-normal ml-2 text-xs">Only letters, numbers, hyphens</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    placeholder="my-newsletter"
                    value={slug}
                    onChange={(e) => {
                      setSlugManual(true);
                      setSlug(slugify(e.target.value));
                    }}
                    pattern="[a-z0-9\-]+"
                    required
                  />
                  {slug && (
                    <Badge variant="secondary" className="shrink-0 text-xs font-mono">
                      {slug}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="summary">Tagline / Short Description</Label>
                <Input
                  id="summary"
                  placeholder="A one-line description of your newsletter"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">About</CardTitle>
              <CardDescription>Extended description, shown on your newsletter landing page (Markdown supported)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write about your newsletter, what topics you cover, how often you publish..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact & Discovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email Address
                  <span className="text-slate-400 font-normal ml-2 text-xs">For email bridge delivery and identity</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="newsletter@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Website / Landing Page</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com/newsletter"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="image">Banner / Logo URL</Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="topics">
                  Topics / Hashtags
                  <span className="text-slate-400 font-normal ml-2 text-xs">Comma-separated</span>
                </Label>
                <Input
                  id="topics"
                  placeholder="bitcoin, freedom, journalism"
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                />
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {topics.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading || !title || !slug} className="bg-indigo-600 hover:bg-indigo-700">
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
