# Solana Wallet BAGS Analyzer

A complete full-stack Next.js application that analyzes Solana wallet swap activity through Helius and reports interactions with token mint addresses ending in `BAGS`.

## Features

- Browser-based UI for wallet lookup
- Backend endpoint: `POST /api/analyze-wallet`
- Real Helius API integration (no mocked backend)
- Swap parsing and BAGS-suffix token filtering
- Analytics metrics:
  - unique BAGS tokens traded
  - total swap transactions involving BAGS mints
  - matching token mint list
- In-memory caching for transaction payloads and computed analytics
- Signature pagination + batched enhanced transaction fetching

## Project Structure

```text
app/
  api/analyze-wallet/route.ts   # Backend API route
  page.tsx                      # Main UI page
components/
  WalletAnalyzer.tsx            # Wallet form + results rendering
lib/
  analyzeWallet.ts              # Core analytics processing layer
  cache.ts                      # In-memory cache utilities
  helius.ts                     # Helius RPC + enhanced tx client
  types.ts                      # Shared types
.env.local.example              # Environment variable template
README.md
package.json
```

## Environment Setup

1. Copy the example env file:

```bash
cp .env.local.example .env.local
```

2. Add your Helius API key inside `.env.local`:

```env
HELIUS_API_KEY=your_api_key_here
```

3. (Optional) Add an explicit RPC URL if needed. If omitted, the app defaults to:

`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`

```env
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key_here
```

## Run Locally

```bash
npm install
npm run dev
```

Then open: `http://localhost:3000`

## API Contract

### Request

`POST /api/analyze-wallet`

```json
{
  "wallet": "<solana_wallet_address>"
}
```

### Response

```json
{
  "wallet": "...",
  "unique_tokens_traded": 2,
  "total_swap_transactions": 5,
  "tokens": ["token1", "token2"]
}
```

## Notes

- The backend fetches wallet signatures through Helius RPC (`getSignaturesForAddress`) with pagination.
- It then fetches parsed enhanced transactions in batches from Helius for efficient swap detection.
- The backend only counts transactions with `type === "SWAP"`.
- For each swap, token mints are extracted from `tokenTransfers`.
- A swap contributes to `total_swap_transactions` if at least one mint in that transaction ends with `BAGS`.
- Caching TTL is currently 3 minutes for both raw transactions and analytics output.
