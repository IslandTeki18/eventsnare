import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/features/theme-settings';
import { NotificationBell } from '@/features/notifications';
import { useWorkspace } from '@/features/workspace/workspaceContext';

interface NavItem {
  label: string;
  to: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Monitor',
    items: [
      { label: 'Overview', to: '/' },
      { label: 'Events', to: '/events' },
      { label: 'Sources', to: '/sources' },
    ],
  },
  {
    label: 'Analyze',
    items: [
      { label: 'Analytics', to: '/analytics' },
      { label: 'Usage', to: '/usage' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'CLI tokens', to: '/cli' },
      { label: 'Billing', to: '/billing' },
      { label: 'Settings', to: '/settings' },
      // @scaffold:nav-items
    ],
  },
];

function isActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Sidebar() {
  const { pathname } = useLocation();
  const workspace = useWorkspace();

  return (
    <aside className="flex w-[228px] flex-shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center gap-[9px] border-b border-border px-4 py-4">
        <span className="h-[7px] w-[7px] flex-shrink-0 bg-foreground" />
        <span className="text-lg font-semibold tracking-tight">Eventsnare</span>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-[11px]">
        <span className="truncate text-sm text-muted-foreground">{workspace.name}</span>
        <span className="flex-shrink-0 rounded-sm border border-border px-1.5 py-px text-3xs font-medium uppercase tracking-[0.06em] text-subtle">
          {workspace.plan}
        </span>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-3.5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4 flex flex-col gap-px">
            <div className="mb-1.5 px-2 text-3xs font-semibold uppercase tracking-[0.08em] text-subtle">
              {group.label}
            </div>
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'block rounded-md border-l-2 px-2 py-1.5 text-base transition-colors hover:bg-muted hover:text-foreground',
                  isActive(pathname, item.to)
                    ? 'border-foreground bg-muted font-medium text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-border p-3">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </aside>
  );
}
