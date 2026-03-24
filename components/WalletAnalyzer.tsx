'use client';

import { FormEvent, useState } from 'react';

type WalletAnalyticsResponse = {
  wallet: string;
  unique_tokens_traded: number;
  total_swap_transactions: number;
  tokens: string[];
};

export function WalletAnalyzer() {
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WalletAnalyticsResponse | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wallet })
      });

      const json = (await response.json()) as WalletAnalyticsResponse & { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? 'Request failed.');
      }

      setResult(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <label htmlFor="wallet" style={{ fontWeight: 600 }}>
          Solana Wallet Address
        </label>
        <input
          id="wallet"
          value={wallet}
          onChange={(event) => setWallet(event.target.value)}
          placeholder="Enter wallet address"
          required
          style={{
            padding: '0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
        <button
          disabled={loading}
          type="submit"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            background: '#2563eb',
            color: 'white',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error ? (
        <p style={{ marginTop: '1rem', color: '#b91c1c', fontWeight: 500 }}>Error: {error}</p>
      ) : null}

      {result ? (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          <div className="card" style={{ background: '#f8fafc' }}>
            <p style={{ margin: 0 }}>
              <strong>Wallet:</strong> {result.wallet}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div className="card" style={{ background: '#f8fafc' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>Unique BAGS Tokens Traded</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>{result.unique_tokens_traded}</p>
            </div>
            <div className="card" style={{ background: '#f8fafc' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>Swap Transactions (BAGS)</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>{result.total_swap_transactions}</p>
            </div>
          </div>

          <div className="card" style={{ background: '#f8fafc' }}>
            <h3 style={{ marginTop: 0 }}>Matching Token Mints</h3>
            {result.tokens.length === 0 ? (
              <p style={{ margin: 0 }}>No BAGS-suffix token mints found in swap activity.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {result.tokens.map((token) => (
                  <li key={token} style={{ overflowWrap: 'anywhere' }}>
                    {token}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
