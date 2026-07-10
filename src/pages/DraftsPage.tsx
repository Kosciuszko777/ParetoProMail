import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAllMyDrafts } from '@/hooks/useNewsletterIssues';
import type { Issue } from '@/lib/pareto';

function DraftRow({ draft }: { draft: Issue }) {
  const date = new Date(draft.publishedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Card className="hover:shadow-sm transition-all">
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-sm truncate">{draft.title}</h3>
            {draft.summary && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{draft.summary}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {date}
              </span>
              {draft.newsletterSlug && (
                <Badge variant="secondary" className="text-xs font-normal">{draft.newsletterSlug}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800">
              Draft
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DraftsPage() {
  useSeoMeta({ title: 'Drafts — Pareto Pro Mail' });
  const { user } = useCurrentUser();
  const { data: drafts, isLoading } = useAllMyDrafts(user?.pubkey ?? '');

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Sign in to view your drafts.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 className="font-serif text-2xl font-bold">Drafts</h1>
          <Button asChild size="sm">
            <Link to="/compose"><PenLine className="w-4 h-4 mr-1.5" />New Issue</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="py-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : drafts && drafts.length > 0 ? (
          <div className="space-y-3">
            {drafts.map((d) => <DraftRow key={d.id} draft={d} />)}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-semibold mb-2">No drafts</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                Drafts autosave every 30 seconds while you write. Start composing and they'll appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
