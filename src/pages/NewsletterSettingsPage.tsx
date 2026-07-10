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
import { NEWSLETTER_CONFIG_KIND, buildNewsletterTags } from '@/lib/pareto';

export default function NewsletterSettingsPage() {
  useSeoMeta({ title: 'Newsletter Settings — Pareto Pro Mail' });

  const { pubkey = '', slug = '' } = useParams<{ pubkey: string; slug: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { data: newsletter, isLoading } = useNewsletter(pubkey, slug);
  const { mutateAsync: publish } = useNostrPublish();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (newsletter) {
      setTitle(newsletter.title);
      setDescription(newsletter.description ?? '');
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
      const tags = buildNewsletterTags({
        slug,
        title,
        description,
        image,
        topics,
        relays: newsletter?.defaultRelays,
        stablezapOffer: newsletter?.stablezapOffer,
        refstrTerms: newsletter?.refstrTerms,
      });
      await publish({ kind: NEWSLETTER_CONFIG_KIND, content: '', tags });
      toast({ title: 'Saved', description: 'Newsletter updated.' });
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
            <p className="text-muted-foreground">You don't have permission to edit this newsletter.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (isLoading) return <AppLayout><div className="max-w-2xl mx-auto mt-16 text-center text-muted-foreground">Loading…</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/newsletter/${pubkey}/${slug}`}><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
          </Button>
          <h1 className="font-serif text-2xl font-bold">Settings</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Identity</CardTitle>
              <CardDescription>Slug: <code className="font-mono text-xs bg-muted px-1 rounded">{slug}</code> (cannot be changed)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-serif text-base">Description</CardTitle></CardHeader>
            <CardContent><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-serif text-base">Appearance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Banner URL</Label><Input type="url" value={image} onChange={(e) => setImage(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Topics <span className="text-muted-foreground text-xs font-normal">comma-separated</span></Label>
                <Input value={topicsInput} onChange={(e) => setTopicsInput(e.target.value)} />
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {topics.map((t) => <Badge key={t} variant="outline" className="text-xs font-normal">#{t}</Badge>)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Phase 4 placeholder */}
          <Card className="border-dashed bg-accent/20">
            <CardHeader>
              <CardTitle className="font-serif text-base text-muted-foreground">Monetization & Growth</CardTitle>
              <CardDescription>Stablezap paid tiers, Refstr referrals, and Recstr recommendations will be configurable here in a future phase.</CardDescription>
            </CardHeader>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
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
