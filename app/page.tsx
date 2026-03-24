import { WalletAnalyzer } from '@/components/WalletAnalyzer';

export default function HomePage() {
  return (
    <main>
      <div className="container" style={{ display: 'grid', gap: '1rem' }}>
        <header>
          <h1 style={{ marginBottom: '0.5rem' }}>Solana Wallet BAGS Analyzer</h1>
          <p style={{ marginTop: 0, color: '#475569' }}>
            Enter a wallet address to analyze swap activity against token mints that end with <code>BAGS</code>.
          </p>
        </header>
        <WalletAnalyzer />
      </div>
    </main>
  );
}
