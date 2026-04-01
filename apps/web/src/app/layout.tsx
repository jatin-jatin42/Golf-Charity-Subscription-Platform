import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Golf Charity Platform — Play, Win & Give Back',
  description:
    'Subscribe to the Golf Charity Platform. Enter your Stableford scores, compete in monthly prize draws, and support a charity of your choice.',
  keywords: 'golf, charity, subscription, prize draw, Stableford',
  openGraph: {
    title: 'Golf Charity Platform',
    description: 'Play golf. Win prizes. Change lives.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main className="page-wrapper">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
