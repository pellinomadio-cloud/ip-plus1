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

export const USD_TO_NGN_EXCHANGE_RATE = 1630; // 1 USD ≈ 1,630 NGN

export const NIGERIAN_BANKS: NigerianBank[] = [
  // Top Popular Fintechs & Digital Banks as requested
  { id: 'opay', name: 'OPay Digital Services (PayCom)', code: '999992', type: 'fintech', badgeColor: '#00B875', popular: true },
  { id: 'palmpay', name: 'PalmPay Limited', code: '999991', type: 'fintech', badgeColor: '#6B38FB', popular: true },
  { id: 'kuda', name: 'Kuda Microfinance Bank', code: '50211', type: 'fintech', badgeColor: '#40196D', popular: true },
  { id: 'moniepoint', name: 'Moniepoint MFB', code: '50515', type: 'fintech', badgeColor: '#003399', popular: true },
  { id: 'paga', name: 'Paga Tech', code: '100002', type: 'fintech', badgeColor: '#FF6B00', popular: true },
  
  // Leading Commercial & Microfinance Banks in Nigeria
  { id: 'access', name: 'Access Bank', code: '044', type: 'commercial', badgeColor: '#FF6200', popular: true },
  { id: 'gtbank', name: 'Guaranty Trust Bank (GTBank)', code: '058', type: 'commercial', badgeColor: '#DD4F05', popular: true },
  { id: 'zenith', name: 'Zenith Bank', code: '057', type: 'commercial', badgeColor: '#B22222', popular: true },
  { id: 'firstbank', name: 'First Bank of Nigeria', code: '011', type: 'commercial', badgeColor: '#003B64', popular: true },
  { id: 'uba', name: 'United Bank for Africa (UBA)', code: '033', type: 'commercial', badgeColor: '#CF0A2C', popular: true },
  { id: 'fidelity', name: 'Fidelity Bank', code: '070', type: 'commercial', badgeColor: '#103F91' },
  { id: 'stanbic', name: 'Stanbic IBTC Bank', code: '221', type: 'commercial', badgeColor: '#0033AA' },
  { id: 'sterling', name: 'Sterling Bank', code: '232', type: 'commercial', badgeColor: '#800000' },
  { id: 'union', name: 'Union Bank of Nigeria', code: '032', type: 'commercial', badgeColor: '#0090DA' },
  { id: 'wema', name: 'Wema Bank / ALAT', code: '035', type: 'commercial', badgeColor: '#96154C' },
  { id: 'fairmoney', name: 'FairMoney Microfinance Bank', code: '51318', type: 'mfb', badgeColor: '#00D09C' },
  { id: 'vfd', name: 'VFD Microfinance Bank', code: '566', type: 'mfb', badgeColor: '#E61C24' },
  { id: 'fcmb', name: 'First City Monument Bank (FCMB)', code: '214', type: 'commercial', badgeColor: '#5C1D82' },
  { id: 'ecobank', name: 'Ecobank Nigeria', code: '050', type: 'commercial', badgeColor: '#005A9C' },
  { id: 'polaris', name: 'Polaris Bank', code: '076', type: 'commercial', badgeColor: '#5E1B7F' },
  { id: 'jaiz', name: 'Jaiz Bank', code: '301', type: 'commercial', badgeColor: '#0C7E3F' },
  { id: 'taj', name: 'TAJ Bank', code: '302', type: 'commercial', badgeColor: '#D12027' },
  { id: 'carbon', name: 'Carbon (One Finance)', code: '565', type: 'mfb', badgeColor: '#1E1E24' },
  { id: 'pocket', name: 'PocketApp (Piggytech)', code: '100033', type: 'fintech', badgeColor: '#0D60D8' },
];

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
