import { MarketAsset } from '../types';

export const INITIAL_ASSETS: MarketAsset[] = [
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    category: 'crypto',
    price: 67432.21,
    change24h: 1612.45,
    changePercent24h: 2.45,
    high24h: 68120.00,
    low24h: 65490.50,
    volume24h: '$38.4B',
    sparkline: [65200, 65800, 65400, 66300, 66100, 66900, 67432],
    iconType: 'btc',
    leverageMax: 100,
    spread: 0.8
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    category: 'crypto',
    price: 3248.76,
    change24h: 58.12,
    changePercent24h: 1.82,
    high24h: 3290.40,
    low24h: 3175.20,
    volume24h: '$19.2B',
    sparkline: [3160, 3190, 3180, 3220, 3210, 3240, 3248],
    iconType: 'eth',
    leverageMax: 100,
    spread: 0.5
  },
  {
    symbol: 'XAU/USD',
    name: 'Gold',
    category: 'commodities',
    price: 2658.40,
    change24h: 20.05,
    changePercent24h: 0.76,
    high24h: 2665.10,
    low24h: 2634.80,
    volume24h: '$12.7B',
    sparkline: [2635, 2642, 2640, 2650, 2648, 2655, 2658],
    iconType: 'gold',
    leverageMax: 200,
    spread: 0.3
  },
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'forex',
    price: 1.0891,
    change24h: -0.0035,
    changePercent24h: -0.32,
    high24h: 1.0935,
    low24h: 1.0874,
    volume24h: '$94.1B',
    sparkline: [1.0925, 1.0910, 1.0905, 1.0898, 1.0902, 1.0885, 1.0891],
    iconType: 'eur',
    leverageMax: 500,
    spread: 0.1
  },
  {
    symbol: 'USOIL',
    name: 'Crude Oil',
    category: 'commodities',
    price: 71.26,
    change24h: 0.85,
    changePercent24h: 1.21,
    high24h: 72.10,
    low24h: 70.05,
    volume24h: '$8.3B',
    sparkline: [70.1, 70.4, 70.2, 70.8, 70.9, 71.1, 71.26],
    iconType: 'oil',
    leverageMax: 100,
    spread: 0.4
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    category: 'crypto',
    price: 184.60,
    change24h: 7.25,
    changePercent24h: 4.08,
    high24h: 188.40,
    low24h: 175.90,
    volume24h: '$6.5B',
    sparkline: [175, 178, 176, 181, 180, 183, 184.6],
    iconType: 'sol',
    leverageMax: 50,
    spread: 0.6
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound',
    category: 'forex',
    price: 1.3042,
    change24h: 0.0028,
    changePercent24h: 0.22,
    high24h: 1.3080,
    low24h: 1.2995,
    volume24h: '$42.8B',
    sparkline: [1.301, 1.302, 1.3015, 1.303, 1.3025, 1.3038, 1.3042],
    iconType: 'forex',
    leverageMax: 500,
    spread: 0.2
  },
  {
    symbol: 'NVDA/USD',
    name: 'NVIDIA Corp',
    category: 'indices',
    price: 138.80,
    change24h: 3.95,
    changePercent24h: 2.93,
    high24h: 140.20,
    low24h: 134.10,
    volume24h: '$28.1B',
    sparkline: [134.5, 136.0, 135.2, 137.4, 136.8, 138.2, 138.8],
    iconType: 'stock',
    leverageMax: 50,
    spread: 0.2
  }
];

export function formatCurrency(amount: number, digits: number = 2): string {
  if (amount < 2 && amount > -2 && digits === 2 && amount !== 0) {
    // For forex pairs like EUR/USD
    return `$${amount.toFixed(4)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(amount);
}

export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}
