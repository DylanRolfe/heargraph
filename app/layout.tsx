import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import './theme.css';
import { JumpLink } from '@/components/JumpLink';
import { SettingsProvider } from '@/components/SettingsProvider';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { SETTINGS_BOOT_SCRIPT } from '@/lib/settings';

export const metadata: Metadata = {
  title: { default: 'HearGraph: graphs you can hear, read and explore by keyboard', template: '%s | HearGraph' },
  description:
    'A teacher pastes the numbers behind a graph and shares a link. A student explores the graph by keyboard, sound, plain-language description and data table.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f3ec',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} data-contrast="normal" data-text="normal" data-motion="normal" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SETTINGS_BOOT_SCRIPT }} />
      </head>
      <body>
        <JumpLink className="skip-link" targetId="main">
          Skip to main content
        </JumpLink>
        <SettingsProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            <div className="wrap">{children}</div>
          </main>
          <SiteFooter />
        </SettingsProvider>
      </body>
    </html>
  );
}
