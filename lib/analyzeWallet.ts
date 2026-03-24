import { getCache, setCache } from '@/lib/cache';
import { fetchWalletTransactions } from '@/lib/helius';
import type { HeliusEnhancedTransaction, WalletAnalytics } from '@/lib/types';

const ANALYTICS_CACHE_TTL_MS = 3 * 60 * 1000;

function isSwapTransaction(tx: HeliusEnhancedTransaction): boolean {
  return tx.type === 'SWAP' || Boolean(tx.events?.swap);
}

function mintMatchesBagsSuffix(mint: string): boolean {
  return mint.toUpperCase().endsWith('BAGS');
}

export async function analyzeWallet(wallet: string): Promise<WalletAnalytics> {
  const cacheKey = `analytics:${wallet}`;
  const cached = getCache<WalletAnalytics>(cacheKey);
  if (cached) {
    return cached;
  }

  const transactions = await fetchWalletTransactions(wallet);
  const matchingTokenMints = new Set<string>();
  let totalSwapTransactions = 0;

  for (const tx of transactions) {
    if (!isSwapTransaction(tx)) {
      continue;
    }

    const tokenMintsForTx = new Set<string>();
    for (const transfer of tx.tokenTransfers ?? []) {
      const mint = transfer.mint?.trim();
      if (!mint) {
        continue;
      }
      if (mintMatchesBagsSuffix(mint)) {
        tokenMintsForTx.add(mint);
      }
    }

    if (tokenMintsForTx.size > 0) {
      totalSwapTransactions += 1;
      for (const mint of tokenMintsForTx) {
        matchingTokenMints.add(mint);
      }
    }
  }

  const result: WalletAnalytics = {
    wallet,
    unique_tokens_traded: matchingTokenMints.size,
    total_swap_transactions: totalSwapTransactions,
    tokens: Array.from(matchingTokenMints).sort((a, b) => a.localeCompare(b))
  };

  setCache(cacheKey, result, ANALYTICS_CACHE_TTL_MS);

  return result;
}
