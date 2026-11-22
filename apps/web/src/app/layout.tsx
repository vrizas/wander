import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono, Josefin_Sans } from 'next/font/google';
import Script from 'next/script';
import { Providers } from '@/components/Providers';
import { BRAND } from '@/lib/brand';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const josefin = Josefin_Sans({ variable: '--font-josefin', subsets: ['latin'], weight: ['300', '400', '600'] });

export const metadata: Metadata = {
  title: { default: `${BRAND} - Toko Sepatu`, template: `%s - ${BRAND}` },
  description: `${BRAND} adalah toko sepatu online dengan model dan tren terbaru untuk setiap langkah.`,
};

const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} ${josefin.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          {children}
          <Toaster theme="light" position="bottom-center" richColors />
        </Providers>
        {clientKey && (
          <Script
            src="https://app.sandbox.midtrans.com/snap/snap.js"
            data-client-key={clientKey}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
