'use client';

import { usePathname } from 'next/navigation';
import { OfflineStatus } from './ServiceWorker';

const NAV = [
  { href: '/student/', label: 'Student example' },
  { href: '/teacher/', label: 'For teachers' },
  { href: '/settings/', label: 'Settings' },
  { href: '/about/', label: 'About' },
];

export function SiteHeader() {
  const pathname = usePathname() ?? '/';
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a href="/" className="brand" aria-current={pathname === '/' ? 'page' : undefined}>
          HearGraph
        </a>
        <nav aria-label="Main">
          <ul className="nav-list">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} aria-current={pathname.startsWith(item.href) ? 'page' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>
          HearGraph is a student hackathon prototype. Nothing you type is sent to a server or stored, except your
          settings, which stay in this browser.
        </p>
        <OfflineStatus />
      </div>
    </footer>
  );
}
