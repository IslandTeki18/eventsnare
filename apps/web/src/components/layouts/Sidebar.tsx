import { Link } from 'react-router';

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Push', to: '/push' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Billing', to: '/billing' },
  { label: 'Settings', to: '/settings' },
  { label: 'Profile', to: '/profile' },
  // @scaffold:nav-items
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-background px-4 py-6">
      <div className="mb-6 px-2 text-lg font-semibold tracking-tight">
        eventsnare
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
