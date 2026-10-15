import { InvestmentPlan } from '../types';

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'usdt-daily-vault',
    name: 'USDT High-Yield Earn',
    cryptoSymbol: 'USDT',
    cryptoName: 'Tether USD Staking Vault',
    iconType: 'crypto',
    badge: 'Daily Payout',
    apyPercent: 28.0,
    dailyPercent: 0.0767, // ~28% APY
    durationDays: 14,
    minInvestment: 10,
    maxInvestment: 100000,
    riskLevel: 'Low',
    description: 'Direct institutional liquidity staking in tier-1 yield pools. Stablecoin dollar capital protection with daily earnings delivered straight to your dashboard balance.',
    highlights: ['Principal 100% Protected', 'Daily Automatic Accrual', 'Payout to Dashboard Balance', 'Low Minimum ($10)']
  },
  {
    id: 'btc-growth-staking',
    name: 'Bitcoin (BTC) Growth Vault',
    cryptoSymbol: 'BTC',
    cryptoName: 'Bitcoin Proof-of-Reserve Vault',
    iconType: 'btc',
    badge: 'Popular',
    apyPercent: 18.5,
    dailyPercent: 0.0507, // ~18.5% APY
    durationDays: 30,
    minInvestment: 50,
    maxInvestment: 250000,
    riskLevel: 'Low',
    description: 'Backed by institutional Bitcoin lending and validator node rewards. Fixed yield generated continuously and credited in USD straight to your account balance.',
    highlights: ['Institutional Cold Storage', 'Daily Compound Earnings', 'Zero Gas / Network Fees', 'Flexible Claim Anytime']
  },
  {
    id: 'eth-pos-staking',
    name: 'Ethereum (ETH) Validator Staking',
    cryptoSymbol: 'ETH',
    cryptoName: 'Ethereum PoS Consensus Staking',
    iconType: 'eth',
    badge: 'Ethereum 2.0',
    apyPercent: 22.4,
    dailyPercent: 0.0614, // ~22.4% APY
    durationDays: 21,
    minInvestment: 25,
    maxInvestment: 150000,
    riskLevel: 'Low',
    description: 'Direct validator rewards from Ethereum blockchain transactions and MEV boost returns, automatically liquidated to USD directly in your dashboard balance.',
    highlights: ['Native Consensus Yield', 'Automated Daily Payouts', 'High Liquidity Support', '21-Day Term']
  },
  {
    id: 'sol-turbo-delegator',
    name: 'Solana (SOL) Supercharger',
    cryptoSymbol: 'SOL',
    cryptoName: 'Solana High-TPS Node Delegator',
    iconType: 'sol',
    badge: 'High Yield',
    apyPercent: 34.0,
    dailyPercent: 0.0931, // ~34% APY
    durationDays: 14,
    minInvestment: 20,
    maxInvestment: 50000,
    riskLevel: 'Moderate',
    description: 'Captures ultra-high velocity transaction validation fees across Solana decentralized exchanges with accelerated payouts.',
    highlights: ['High-Velocity Yield', '14-Day Rapid Turnover', 'Real-time Profit Accrual', 'Instant Withdraw on Maturity']
  },
  {
    id: 'ai-quant-crypto-pool',
    name: 'AI Quant Multi-Crypto Pool',
    cryptoSymbol: 'AI-CRYPTO',
    cryptoName: 'Algorithmic Arbitrage & Delta-Neutral Pool',
    iconType: 'crypto',
    badge: 'Max APY',
    apyPercent: 48.0,
    dailyPercent: 0.1315, // ~48% APY
    durationDays: 30,
    minInvestment: 100,
    maxInvestment: 500000,
    riskLevel: 'Moderate',
    description: 'High-frequency algorithmic market-making and cross-exchange crypto spread capture. Generates the highest consistent cash yield directly delivered to your balance.',
    highlights: ['Delta-Neutral Hedged', '48% Annualized Yield', 'Institutional Trading Engine', 'Full Capital Reimbursement']
  },
  {
    id: 'flexible-micro-vault',
    name: 'Flexible Micro-Earn',
    cryptoSymbol: 'CRYPTO-FLEX',
    cryptoName: 'Instant Access Flexible Earn Vault',
    iconType: 'crypto',
    badge: 'Instant Redeem',
    apyPercent: 14.0,
    dailyPercent: 0.0384, // ~14% APY
    durationDays: 7,
    minInvestment: 5,
    maxInvestment: 20000,
    riskLevel: 'Low',
    description: 'Start with just $5. Flexible lock with real-time interest accumulation and freedom to collect profit or release capital whenever needed.',
    highlights: ['Micro-Deposit Friendly ($5)', 'Short 7-Day Cycle', 'Real-Time Yield Ticker', 'One-Click Balance Credit']
  }
];
