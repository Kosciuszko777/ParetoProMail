import { useNavigate } from 'react-router-dom';
import {
  ChevronDown, LogOut, UserIcon, UserPlus,
  Newspaper, Users, CreditCard, Gift, Fingerprint, Receipt, Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useLoggedInAccounts, type Account } from '@/hooks/useLoggedInAccounts';
import { nip19 } from 'nostr-tools';

interface AccountSwitcherProps {
  onAddAccountClick: () => void;
}

export function AccountSwitcher({ onAddAccountClick }: AccountSwitcherProps) {
  const { currentUser, otherUsers, isLoading, setLogin, removeLogin } = useLoggedInAccounts();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const getDisplayName = (account: Account): string => {
    return account.metadata.name ?? 'Anonymous';
  };

  // While the metadata query is in-flight and we don't yet have a name,
  // we don't want to flash a generated animal name / its first letter.
  const isCurrentUserPending = isLoading && !currentUser.metadata.name;

  const npub = (() => {
    try { return nip19.npubEncode(currentUser.pubkey); } catch { return ''; }
  })();

  const accountMenu: { label: string; icon: typeof Newspaper; to: string }[] = [
    { label: 'My Publication', icon: Newspaper, to: '/' },
    { label: 'Audience', icon: Users, to: '/audience' },
    { label: 'Payments', icon: CreditCard, to: '/payments' },
    { label: 'Referrals', icon: Gift, to: '/referrals' },
    { label: 'Identity', icon: Fingerprint, to: npub ? `/${npub}` : '/' },
    { label: 'Plan & Billing', icon: Receipt, to: '/pricing' },
    { label: 'Settings', icon: Settings, to: '/settings' },
  ];

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className='flex items-center gap-2 h-10 p-1 pr-2.5 rounded-full hover:bg-accent transition-all text-foreground'>
          <Avatar className='w-8 h-8'>
            <AvatarImage
              src={currentUser.metadata.picture}
              alt={isCurrentUserPending ? '' : getDisplayName(currentUser)}
            />
            <AvatarFallback>
              {isCurrentUserPending ? (
                <Skeleton className='size-full rounded-full' />
              ) : (
                getDisplayName(currentUser).charAt(0)
              )}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className='w-4 h-4 text-muted-foreground' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 p-2 animate-scale-in'>
        {/* Identity header */}
        <div className='flex items-center gap-2.5 px-2 py-2'>
          <Avatar className='w-9 h-9'>
            <AvatarImage src={currentUser.metadata.picture} alt={getDisplayName(currentUser)} />
            <AvatarFallback>{getDisplayName(currentUser).charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='text-sm font-semibold truncate'>{getDisplayName(currentUser)}</p>
            {npub && <p className='text-xs text-muted-foreground font-mono truncate'>{npub.slice(0, 16)}…</p>}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Account menu */}
        {accountMenu.map(({ label, icon: Icon, to }) => (
          <DropdownMenuItem
            key={label}
            onClick={() => navigate(to)}
            className='flex items-center gap-2.5 cursor-pointer p-2 rounded-md'
          >
            <Icon className='w-4 h-4 text-muted-foreground' />
            <span className='text-sm'>{label}</span>
          </DropdownMenuItem>
        ))}

        {/* Switch account */}
        {otherUsers.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className='text-xs text-muted-foreground font-normal px-2'>Switch account</DropdownMenuLabel>
            {otherUsers.map((user) => {
              const isPending = isLoading && !user.metadata.name;
              return (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => setLogin(user.id)}
                  className='flex items-center gap-2 cursor-pointer p-2 rounded-md'
                >
                  <Avatar className='w-7 h-7'>
                    <AvatarImage src={user.metadata.picture} alt={isPending ? '' : getDisplayName(user)} />
                    <AvatarFallback>
                      {isPending ? <Skeleton className='size-full rounded-full' /> : (getDisplayName(user)?.charAt(0) || <UserIcon />)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 truncate'>
                    {isPending ? <Skeleton className='h-4 w-24' /> : <p className='text-sm font-medium'>{getDisplayName(user)}</p>}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onAddAccountClick}
          className='flex items-center gap-2.5 cursor-pointer p-2 rounded-md'
        >
          <UserPlus className='w-4 h-4 text-muted-foreground' />
          <span className='text-sm'>Add another account</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => removeLogin(currentUser.id)}
          className='flex items-center gap-2.5 cursor-pointer p-2 rounded-md text-red-500 focus:text-red-500'
        >
          <LogOut className='w-4 h-4' />
          <span className='text-sm'>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
