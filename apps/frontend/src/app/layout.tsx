import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'GuftaGu', template: '%s | GuftaGu' },
  description: 'GuftaGu — Talk, Share & Hangout. Real-time chat, stories, and break coordination.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'MemeChat',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'GuftaGu',
    title: 'GuftaGu — Talk, Share & Hangout',
    description: 'The modern way to chat, share, and coordinate hangouts.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GuftaGu',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e8e8eb' },
    { media: '(prefers-color-scheme: dark)',  color: '#1c1c22' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: 'var(--neu-bg-card)',
                      color: 'var(--neu-text)',
                      borderRadius: '16px',
                      boxShadow:
                        '6px 6px 12px var(--neu-shadow-1), -6px -6px 12px var(--neu-shadow-2)',
                    },
                  }}
                />
              </SocketProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
