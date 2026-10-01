import { Link, useLocation } from 'react-router-dom';
import { PenLine, BookOpen, Rss, FileText, Moon, Sun, Users, Wallet } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { WalletModal } from '@/components/WalletModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AppLayoutProps {
  children: React.ReactNode;
  /** When true, the main content spans full width (for landing pages). */
  fullWidth?: boolean;
}

const navItems = [
  { to: '/', label: 'Home', icon: Rss },
  { to: '/compose', label: 'Write', icon: PenLine },
  { to: '/issues', label: 'Issues', icon: BookOpen },
  { to: '/drafts', label: 'Drafts', icon: FileText },
  { to: '/subscribers', label: 'Subscribers', icon: Users },
];

export function AppLayout({ children, fullWidth = false }: AppLayoutProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
            <span className="font-serif text-xl font-bold tracking-tight text-foreground">
              Pareto <span className="font-normal text-muted-foreground">Pro Mail</span>
            </span>
          </Link>

          {/* Desktop nav — only when logged in */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user && (
              <WalletModal>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Wallet className="w-4 h-4" />
                </Button>
              </WalletModal>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <LoginArea className="max-w-48" />
          </div>
        </div>

        {/* Mobile nav — only when logged in */}
        {user && (
          <div className="md:hidden border-t">
            <div className="flex overflow-x-auto px-2 py-1.5 gap-1 scrollbar-none">
              {navItems.map(({ to, label, icon: Icon }) => {
                const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className={cn('flex-1', fullWidth ? 'w-full' : 'max-w-5xl mx-auto px-4 py-8 w-full')}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 text-sm text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Vibed with Shakespeare
            </a>
          </span>
          <span>
            Built on <strong className="text-foreground">Nostr</strong> &mdash; your words, your keys, your audience.
          </span>
        </div>
      </footer>
    </div>
  );
}
