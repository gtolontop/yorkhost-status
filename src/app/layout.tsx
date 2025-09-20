import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Yorkhost Status',
  description: 'Real-time status monitoring for Yorkhost services',
  keywords: ['status', 'uptime', 'monitoring', 'yorkhost'],
  authors: [{ name: 'Yorkhost Team' }],
  openGraph: {
    title: 'Yorkhost Status',
    description: 'Real-time status monitoring for Yorkhost services',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yorkhost Status',
    description: 'Real-time status monitoring for Yorkhost services',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <div id="__next">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}