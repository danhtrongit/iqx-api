export interface StockPrice {
  symbol: string;
  o: number[]; // open
  h: number[]; // high
  l: number[]; // low
  c: number[]; // close
  v: number[]; // volume
  t: string[]; // timestamp
  accumulatedVolume: number[];
  accumulatedValue: number[];
  minBatchTruncTime: string;
}

export interface BuyStockDto {
  symbolCode: string;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
}

export interface SellStockDto {
  symbolCode: string;
  quantity: number;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
}

export interface PortfolioSummaryDto {
  id: string;
  userId: string;
  cashBalance: number;
  totalAssetValue: number;
  stockValue: number;
  totalProfitLoss: number;
  profitLossPercentage: number;
  totalTransactions: number;
  successfulTrades: number;
  holdings: HoldingSummaryDto[];
}

export interface HoldingSummaryDto {
  id: string;
  symbolCode: string;
  symbolName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedProfitLoss: number;
  profitLossPercentage: number;
  totalCost: number;
}

export interface TransactionHistoryDto {
  id: string;
  symbolCode: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  fee: number;
  tax: number;
  netAmount: number;
  status: string;
  createdAt: Date;
  executedAt?: Date;
}
