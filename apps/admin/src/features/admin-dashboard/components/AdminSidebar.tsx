import { Link, useLocation } from 'react-router';

const items = [
  { label: 'Overview', to: '/' },
  { label: 'Users', to: '/users' },
  { label: 'Blog', to: '/blog' },
  { label: 'System', to: '/system' },
];

export function AdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-background px-3 py-6">
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Admin
      </p>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive =
            item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
