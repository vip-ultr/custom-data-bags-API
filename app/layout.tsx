import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solana BAGS Wallet Analyzer',
  description: 'Analyze swap activity for Solana tokens ending in BAGS using Helius.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
