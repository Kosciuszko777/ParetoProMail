import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ArrowLeft, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNewsletter } from '@/hooks/useNewsletter';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { NEWSLETTER_KIND } from '@/lib/newsletter';

export default function NewsletterSettingsPage() {
  useSeoMeta({ title: 'Newsletter Settings — NostrMail' });

  const { pubkey = '', slug = '' } = useParams<{ pubkey: string; slug: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { data: newsletter, isLoading } = useNewsletter(pubkey, slug);
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [image, setImage] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (newsletter) {
      setTitle(newsletter.title);
      setSummary(newsletter.summary ?? '');
      setContent(newsletter.content);
      setEmail(newsletter.email ?? '');
      setWebsite(newsletter.website ?? '');
      setImage(newsletter.image ?? '');
      setTopicsInput(newsletter.topics.join(', '));
    }
  }, [newsletter]);

  const topics = topicsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || user.pubkey !== pubkey) return;
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
      tags.push(['lang', newsletter?.lang ?? 'en']);
      topics.forEach((t) => tags.push(['t', t]));

      await publish({ kind: NEWSLETTER_KIND, content, tags });
      toast({ title: 'Saved', description: 'Newsletter updated on Nostr.' });
      navigate(`/newsletter/${pubkey}/${slug}`);
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (!user || user.pubkey !== pubkey) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">You don't have permission to edit this newsletter.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (isLoading) {
    return <AppLayout><div className="max-w-2xl mx-auto mt-16 text-center text-slate-400">Loading…</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/newsletter/${pubkey}/${slug}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Newsletter Settings</h1>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identity</CardTitle>
              <CardDescription>Slug: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">{slug}</code> (cannot be changed)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">About (Markdown)</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contact & Discovery</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Banner / Logo URL</Label>
                <Input type="url" value={image} onChange={(e) => setImage(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Topics <span className="text-slate-400 text-xs font-normal">comma-separated</span></Label>
                <Input value={topicsInput} onChange={(e) => setTopicsInput(e.target.value)} />
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {topics.map((t) => <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={`/newsletter/${pubkey}/${slug}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
