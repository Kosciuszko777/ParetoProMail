import { useSeoMeta } from '@unhead/react';
import { Settings, Moon, Sun, Fingerprint, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTheme } from '@/hooks/useTheme';
import { nip19 } from 'nostr-tools';

export default function SettingsPage() {
  useSeoMeta({ title: 'Settings — Pareto Pro Mail' });
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  if (!user) {
    return (
      <AppLayout>
        <Card className="border-dashed max-w-lg mx-auto mt-16">
          <CardContent className="py-12 text-center">
            <Lock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Sign in to manage settings.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const npub = (() => { try { return nip19.npubEncode(user.pubkey); } catch { return ''; } })();

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Settings className="w-6 h-6 text-muted-foreground" />
          <h1 className="font-serif text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Identity
              </CardTitle>
              <CardDescription>Your Nostr identity is your account. No password to lose.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">npub</span>
                <span className="font-mono text-xs truncate">{npub}</span>
              </div>
              {npub && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/${npub}`}>View public profile</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Appearance</CardTitle>
              <CardDescription>Switch between light and dark themes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="gap-2"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-accent/30 border-dashed">
            <CardContent className="py-5 text-sm text-muted-foreground leading-relaxed">
              Your audience, drafts and relationships are encrypted to your key and stored on your
              relays. You can export everything from the <Link to="/audience" className="text-primary hover:underline">Audience Vault</Link> at any time.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
