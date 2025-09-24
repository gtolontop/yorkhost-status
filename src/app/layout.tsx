import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@/styles/theme-fix.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { StatusControlsProvider } from '@/contexts/StatusControlsContext'
import { themeInitScript } from '@/lib/theme-init'

export const metadata: Metadata = {
  title: 'Yorkhost Status',
  description: 'Real-time status monitoring for Yorkhost services',
  keywords: ['status', 'uptime', 'monitoring', 'yorkhost'],
  authors: [{ name: 'Yorkhost Team' }],
  icons: {
    icon: 'https://yorkhost.fr/images/logo.png',
    shortcut: 'https://yorkhost.fr/images/logo.png',
    apple: 'https://yorkhost.fr/images/logo.png',
  },
  openGraph: {
    title: 'Yorkhost Status',
    description: 'Real-time status monitoring for Yorkhost services',
    type: 'website',
    images: ['https://yorkhost.fr/images/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yorkhost Status',
    description: 'Real-time status monitoring for Yorkhost services',
    images: ['https://yorkhost.fr/images/logo.png'],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <StatusControlsProvider>
            <div id="__next">
              {children}
            </div>
          </StatusControlsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}