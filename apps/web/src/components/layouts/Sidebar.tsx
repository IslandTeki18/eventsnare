import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Sources', to: '/sources' },
  { label: 'Events', to: '/events' },
  { label: 'Usage', to: '/usage' },
  { label: 'Billing', to: '/billing' },
  { label: 'Settings', to: '/settings' },
  // @scaffold:nav-items
];

function isActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-background px-4 py-6">
      <div className="mb-6 px-2 text-lg font-semibold tracking-tight">eventsnare</div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors',
              isActive(pathname, item.to)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
