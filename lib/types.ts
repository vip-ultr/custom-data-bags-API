export type HeliusTokenTransfer = {
  mint?: string;
};

export type HeliusEnhancedTransaction = {
  signature?: string;
  type?: string;
  tokenTransfers?: HeliusTokenTransfer[];
};

export type WalletAnalytics = {
  wallet: string;
  unique_tokens_traded: number;
  total_swap_transactions: number;
  tokens: string[];
};

export type RpcSignatureInfo = {
  signature: string;
};
