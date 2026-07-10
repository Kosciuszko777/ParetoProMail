import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAllMyIssues } from '@/hooks/useNewsletterIssues';
import type { Issue } from '@/lib/pareto';

function IssueRow({ issue }: { issue: Issue }) {
  const date = new Date(issue.publishedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Link to={`/issue/${issue.pubkey}/${issue.slug}`} className="block group">
      <Card className="hover:shadow-sm transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="font-serif text-base truncate group-hover:text-primary/80 transition-colors">{issue.title}</CardTitle>
              {issue.summary && <CardDescription className="text-sm mt-0.5 line-clamp-2">{issue.summary}</CardDescription>}
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">Read</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />{date}
            </span>
            {issue.newsletterSlug && <Badge variant="secondary" className="text-xs font-normal">{issue.newsletterSlug}</Badge>}
            {issue.topics.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline" className="text-xs font-normal">#{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AllIssuesPage() {
  useSeoMeta({ title: 'All Issues — Pareto Pro Mail' });
  const { user } = useCurrentUser();
  const { data: issues, isLoading } = useAllMyIssues(user?.pubkey ?? '');

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Sign in to view your issues.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 className="font-serif text-2xl font-bold">Published Issues</h1>
          <Button asChild size="sm">
            <Link to="/compose"><PenLine className="w-4 h-4 mr-1.5" />Write</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardHeader><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></CardHeader></Card>
            ))}
          </div>
        ) : issues && issues.length > 0 ? (
          <div className="space-y-3">
            {issues.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-semibold mb-2">No issues yet</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm">
                Compose your first newsletter issue to publish it as a permanent NIP-23 event.
              </p>
              <Button asChild><Link to="/compose">Compose Issue</Link></Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
