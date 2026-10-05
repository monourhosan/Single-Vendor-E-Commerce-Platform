import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { StorefrontShell } from '@/components/StorefrontShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ShopLagbe | Premium Electronics & Fast CarryBee Delivery',
  description: 'Full-featured Bangladeshi e-commerce platform with automated bKash sandbox, SSLCommerz gateway, and CarryBee courier logistics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <StorefrontShell>{children}</StorefrontShell>
        </Providers>
      </body>
    </html>
  );
}
