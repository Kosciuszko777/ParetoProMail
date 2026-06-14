import { Link, useLocation } from 'react-router-dom';
import { MailOpen, PenSquare, Users, BookOpen, Rss, CalendarClock } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { cn } from '@/lib/utils';
import { useDispatchScheduler } from '@/hooks/useDispatchScheduler';
import { useMailDispatches } from '@/hooks/useMailDispatches';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Newsletters', icon: Rss },
  { to: '/compose', label: 'New Issue', icon: PenSquare },
  { to: '/subscribers', label: 'Subscribers', icon: Users },
  { to: '/issues', label: 'All Issues', icon: BookOpen },
  { to: '/dispatches', label: 'Dispatches', icon: CalendarClock },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  // Run background scheduler — fires due dispatches automatically
  useDispatchScheduler();

  const { pendingDispatches } = useMailDispatches();
  const pendingCount = pendingDispatches.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm group-hover:shadow-indigo-200 transition-shadow">
              <MailOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              NostrMail
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              const isDispatches = to === '/dispatches';
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative',
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {isDispatches && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LoginArea className="max-w-48" />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800">
          <div className="flex overflow-x-auto px-2 py-1.5 gap-1 scrollbar-none">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              const isDispatches = to === '/dispatches';
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 relative',
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {isDispatches && pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 py-8 text-center text-sm text-slate-500 dark:text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors">
              Vibed with Shakespeare
            </a>
          </span>
          <span className="flex items-center gap-1">
            Built on <strong className="text-slate-700 dark:text-slate-300 ml-1">Nostr</strong> — decentralized &amp; censorship-resistant
          </span>
        </div>
      </footer>
    </div>
  );
}
