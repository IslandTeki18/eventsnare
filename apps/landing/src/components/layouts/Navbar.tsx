import { Link } from 'react-router';

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  // @scaffold:nav-items
];

export function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
      <Link to="/" className="text-lg font-semibold tracking-tight">
        eventsnare
      </Link>
      <ul className="flex items-center gap-4">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
