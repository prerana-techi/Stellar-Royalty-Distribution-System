import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { Navbar } from '@/shared/components/Navbar';
import { Sidebar } from '@/shared/components/Sidebar';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'RoyaltyFlow — On-Chain Royalty Distribution',
  description: 'Transparent, automated royalty distribution powered by Stellar smart contracts. Create agreements, distribute payments, and track everything on-chain.',
  keywords: ['stellar', 'soroban', 'royalty', 'distribution', 'blockchain', 'smart contracts'],
  openGraph: {
    title: 'RoyaltyFlow — On-Chain Royalty Distribution',
    description: 'Transparent, automated royalty distribution powered by Stellar.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col lg:ml-64">
              <Navbar />
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'hsl(222, 47%, 8%)',
                border: '1px solid hsl(217, 33%, 17%)',
                color: 'hsl(210, 40%, 98%)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
