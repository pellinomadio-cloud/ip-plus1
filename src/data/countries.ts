export interface Country {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
  currency: string;
  hasLocalBanking?: boolean;
}

export interface NigerianBank {
  id: string;
  name: string;
  code: string;
  type: 'fintech' | 'commercial' | 'mfb';
  badgeColor: string;
  popular?: boolean;
}

import rawNigerianBanks from './nigerianBanksData.json';

export const USD_TO_NGN_EXCHANGE_RATE = 1630; // 1 USD ≈ 1,630 NGN

export const NIGERIAN_BANKS: NigerianBank[] = rawNigerianBanks as NigerianBank[];

export const COUNTRIES: Country[] = [
  // Nigeria featured first with special local banking integration
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', dialCode: '+234', currency: 'NGN', hasLocalBanking: true },
  
  // Other major international countries
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1', currency: 'USD' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44', currency: 'GBP' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1', currency: 'CAD' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', dialCode: '+27', currency: 'ZAR' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭', dialCode: '+233', currency: 'GHS' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪', dialCode: '+254', currency: 'KES' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dialCode: '+971', currency: 'AED' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49', currency: 'EUR' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33', currency: 'EUR' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61', currency: 'AUD' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91', currency: 'INR' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', dialCode: '+55', currency: 'BRL' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65', currency: 'SGD' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', dialCode: '+41', currency: 'CHF' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', dialCode: '+34', currency: 'EUR' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', dialCode: '+39', currency: 'EUR' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', dialCode: '+31', currency: 'EUR' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', dialCode: '+353', currency: 'EUR' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81', currency: 'JPY' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', dialCode: '+60', currency: 'MYR' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', dialCode: '+90', currency: 'TRY' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', dialCode: '+52', currency: 'MXN' },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲', dialCode: '+237', currency: 'XAF' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬', dialCode: '+256', currency: 'UGX' },
  { name: 'Rwanda', code: 'RW', flag: '🇷🇼', dialCode: '+250', currency: 'RWF' },
];

export const CRYPTO_WITHDRAWAL_OPTIONS = [
  { id: 'usdt-trc20', name: 'USDT (TRC-20)', symbol: 'USDT', network: 'TRON Network', speed: '2–5 mins', fee: '0% Free', icon: '₮' },
  { id: 'usdt-bep20', name: 'USDT (BEP-20)', symbol: 'USDT', network: 'BNB Smart Chain', speed: '2–5 mins', fee: '0% Free', icon: '₮' },
  { id: 'usdt-erc20', name: 'USDT (ERC-20)', symbol: 'USDT', network: 'Ethereum Network', speed: '5–10 mins', fee: '0% Free', icon: '₮' },
  { id: 'btc', name: 'Bitcoin (BTC)', symbol: 'BTC', network: 'Bitcoin Mainnet', speed: '10–20 mins', fee: '0% Free', icon: '₿' },
  { id: 'eth', name: 'Ethereum (ETH)', symbol: 'ETH', network: 'Ethereum Mainnet', speed: '5–10 mins', fee: '0% Free', icon: 'Ξ' },
  { id: 'sol', name: 'Solana (SOL)', symbol: 'SOL', network: 'Solana Network', speed: 'Instant (1 min)', fee: '0% Free', icon: '◎' },
];
