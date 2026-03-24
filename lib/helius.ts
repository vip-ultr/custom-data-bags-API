import { getCache, setCache } from '@/lib/cache';
import type { HeliusEnhancedTransaction, RpcSignatureInfo } from '@/lib/types';

const SIGNATURE_PAGE_LIMIT = 100;
const MAX_PAGES = 15;
const SIGNATURE_BATCH_SIZE = 100;
const TRANSACTION_CACHE_TTL_MS = 3 * 60 * 1000;
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 300;

function getHeliusApiKey(): string {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing HELIUS_API_KEY. Add it to .env.local.');
  }
  return apiKey;
}

function getHeliusRpcUrl(): string {
  const apiKey = getHeliusApiKey();
  return process.env.HELIUS_RPC_URL ?? `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

async function fetchWithRetry(url: string, init: RequestInit, purpose: string): Promise<Response> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, init);

    if (response.ok) {
      return response;
    }

    if (!shouldRetry(response.status) || attempt === MAX_RETRIES) {
      const text = await response.text();
      throw new Error(`${purpose} failed (${response.status}): ${text}`);
    }

    const delay = BASE_DELAY_MS * 2 ** attempt;
    await sleep(delay);
  }

  throw new Error(`${purpose} failed after retries.`);
}

async function rpcRequest<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetchWithRetry(
    getHeliusRpcUrl(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      }),
      next: { revalidate: 0 }
    },
    'Helius RPC request'
  );

  const payload = (await response.json()) as { error?: { message?: string }; result?: T };
  if (payload.error) {
    throw new Error(`Helius RPC error: ${payload.error.message ?? 'Unknown RPC error.'}`);
  }

  return payload.result as T;
}

async function fetchSignatures(wallet: string): Promise<string[]> {
  const signatures: string[] = [];
  let before: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const batch = await rpcRequest<RpcSignatureInfo[]>('getSignaturesForAddress', [
      wallet,
      {
        limit: SIGNATURE_PAGE_LIMIT,
        before,
        commitment: 'confirmed'
      }
    ]);

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    for (const row of batch) {
      if (row.signature) {
        signatures.push(row.signature);
      }
    }

    if (batch.length < SIGNATURE_PAGE_LIMIT) {
      break;
    }

    before = batch[batch.length - 1]?.signature;
    if (!before) {
      break;
    }
  }

  return signatures;
}

async function fetchEnhancedTransactions(signatures: string[], apiKey: string): Promise<HeliusEnhancedTransaction[]> {
  if (signatures.length === 0) {
    return [];
  }

  const allTransactions: HeliusEnhancedTransaction[] = [];

  for (let i = 0; i < signatures.length; i += SIGNATURE_BATCH_SIZE) {
    const chunk = signatures.slice(i, i + SIGNATURE_BATCH_SIZE);
    const url = `https://api.helius.xyz/v0/transactions/?api-key=${apiKey}`;

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions: chunk }),
        next: { revalidate: 0 }
      },
      'Helius enhanced transaction fetch'
    );

    const batch = (await response.json()) as HeliusEnhancedTransaction[];
    if (Array.isArray(batch) && batch.length > 0) {
      allTransactions.push(...batch);
    }
  }

  return allTransactions;
}

export async function fetchWalletTransactions(wallet: string): Promise<HeliusEnhancedTransaction[]> {
  const cacheKey = `tx:${wallet}`;
  const cached = getCache<HeliusEnhancedTransaction[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getHeliusApiKey();
  const signatures = await fetchSignatures(wallet);

  const uniqueSignatures = Array.from(new Set(signatures));
  const transactions = await fetchEnhancedTransactions(uniqueSignatures, apiKey);

  setCache(cacheKey, transactions, TRANSACTION_CACHE_TTL_MS);

  return transactions;
}
