import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/AppLayout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAllMyIssues } from '@/hooks/useNewsletterIssues';
import type { NewsletterIssue } from '@/lib/newsletter';

function IssueRow({ issue }: { issue: NewsletterIssue }) {
  const date = new Date(issue.publishedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <Card className="hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{issue.title}</CardTitle>
            {issue.summary && (
              <CardDescription className="text-sm mt-0.5 line-clamp-2">{issue.summary}</CardDescription>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={`/issue/${issue.id}`}>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Read
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {date}
          </span>
          {issue.newsletterSlug && (
            <Badge variant="secondary" className="text-xs">{issue.newsletterSlug}</Badge>
          )}
          {issue.topics.slice(0, 3).map((t) => (
            <Badge key={t} variant="outline" className="text-xs">#{t}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AllIssuesPage() {
  useSeoMeta({ title: 'All Issues — NostrMail' });
  const { user } = useCurrentUser();
  const { data: issues, isLoading } = useAllMyIssues(user?.pubkey ?? '');

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">Please login to view your issues.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Issues</h1>
          </div>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link to="/compose">New Issue</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent><Skeleton className="h-4 w-32" /></CardContent>
              </Card>
            ))}
          </div>
        ) : issues && issues.length > 0 ? (
          <div className="space-y-4">
            {issues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No issues yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                Compose your first newsletter issue to get started.
              </p>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link to="/compose">Compose Issue</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
