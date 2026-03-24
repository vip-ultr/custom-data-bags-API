import { NextResponse } from 'next/server';
import { z } from 'zod';

import { analyzeWallet } from '@/lib/analyzeWallet';

const walletRequestSchema = z.object({
  wallet: z.string().trim().min(32).max(64)
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = walletRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid wallet address input.'
        },
        { status: 400 }
      );
    }

    const result = await analyzeWallet(parsed.data.wallet);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
