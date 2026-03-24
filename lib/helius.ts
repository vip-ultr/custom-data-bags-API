import { getCache, setCache } from '@/lib/cache';
import type { HeliusEnhancedTransaction } from '@/lib/types';

const PAGE_LIMIT = 100;
const MAX_PAGES = 10;
const TRANSACTION_CACHE_TTL_MS = 3 * 60 * 1000;

function getHeliusApiKey(): string {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing HELIUS_API_KEY. Add it to .env.local.');
  }
  return apiKey;
}

export async function fetchWalletTransactions(wallet: string): Promise<HeliusEnhancedTransaction[]> {
  const cacheKey = `tx:${wallet}`;
  const cached = getCache<HeliusEnhancedTransaction[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getHeliusApiKey();
  const allTransactions: HeliusEnhancedTransaction[] = [];
  const seenSignatures = new Set<string>();

  let before: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${wallet}/transactions`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('limit', String(PAGE_LIMIT));
    if (before) {
      url.searchParams.set('before', before);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Helius request failed (${response.status}): ${text}`);
    }

    const batch = (await response.json()) as HeliusEnhancedTransaction[];
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    for (const tx of batch) {
      const signature = tx.signature;
      if (signature && !seenSignatures.has(signature)) {
        seenSignatures.add(signature);
        allTransactions.push(tx);
      }
    }

    if (batch.length < PAGE_LIMIT) {
      break;
    }

    const lastSignature = batch[batch.length - 1]?.signature;
    if (!lastSignature) {
      break;
    }
    before = lastSignature;
  }

  setCache(cacheKey, allTransactions, TRANSACTION_CACHE_TTL_MS);

  return allTransactions;
}
