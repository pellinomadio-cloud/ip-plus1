export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
  registeredAt: string;
  isKycVerified: boolean;
  accountNumber: string;
  country?: string;
  countryCode?: string;
  phoneNumber?: string;
}


export type AssetCategory = 'all' | 'crypto' | 'commodities' | 'forex' | 'indices';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: 'crypto' | 'commodities' | 'forex' | 'indices';
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  sparkline: number[];
  iconType: 'btc' | 'eth' | 'gold' | 'eur' | 'oil' | 'sol' | 'stock' | 'forex';
  leverageMax: number;
  spread: number;
}

export interface Position {
  id: string;
  symbol: string;
  assetName: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  margin: number;
  leverage: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  timestamp: string;
  takeProfit?: number;
  stopLoss?: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade_profit' | 'trade_loss' | 'investment' | 'investment_yield';
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  timestamp: string;
  title: string;
  reference: string;
  method?: string;
  destinationDetails?: {
    type: 'crypto' | 'nigerian_bank' | 'international_bank';
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    cryptoNetwork?: string;
    walletAddress?: string;
    ngnAmount?: number;
    exchangeRate?: number;
  };
}


export interface Candle {
  time: number;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuickTrade {
  id: string;
  assetSymbol: string;
  assetName: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  investment: number;
  payoutPercent: number; // e.g. 85 for 85%
  durationSeconds: number;
  startTime: number;
  expiresAt: number;
  status: 'active' | 'won' | 'lost';
  closePrice?: number;
  profit?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  badge?: string;
  text: string;
  time: string;
  tradeSignal?: {
    symbol: string;
    action: 'BUY' | 'SELL';
    duration: string;
  };
}

export interface StaffManagementAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  exchangeRateNgn: number;
  paymentInstructions?: string;
  updatedAt?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  amount: number;
  ngnAmount?: number;
  depositType?: 'crypto' | 'bank_transfer';
  network: string;
  txHash: string;
  proofImageUrl?: string;
  proofFileName?: string;
  senderName?: string;
  senderBank?: string;
  staffAccountDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  status: 'pending_review' | 'completed' | 'rejected';
  timestamp: string;
  approvedAt?: string;
}

export type NavTab = 'home' | 'trade' | 'wallet' | 'funds_wallet' | 'history' | 'settings' | 'admin_dashboard';

export interface PriceAlert {
  id: string;
  symbol: string;
  assetName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
  triggeredAt?: number;
  note?: string;
  soundEnabled?: boolean;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  cryptoSymbol: string;
  cryptoName: string;
  iconType: 'btc' | 'eth' | 'sol' | 'crypto';
  badge: string;
  apyPercent: number;
  dailyPercent: number;
  durationDays: number;
  minInvestment: number;
  maxInvestment: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  description: string;
  highlights: string[];
}

export interface UserInvestment {
  id: string;
  planId: string;
  planName: string;
  cryptoSymbol: string;
  investedAmount: number;
  startDate: string;
  endDate: string;
  durationDays: number;
  apyPercent: number;
  dailyProfitAmount: number;
  accruedEarnings: number;
  claimedEarnings: number;
  status: 'active' | 'completed' | 'cancelled';
  lastAccrualTimestamp: number;
}

