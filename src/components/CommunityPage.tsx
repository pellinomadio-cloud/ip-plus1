import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Send,
  Award,
  BarChart2,
  ThumbsUp,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { formatCurrency } from '../data/marketData';
import { MarketAsset } from '../types';

interface CommunityPageProps {
  onBack: () => void;
  onSelectAssetToTrade: (asset: MarketAsset) => void;
  onGoToTrade: () => void;
}

interface CommunityPost {
  id: string;
  author: string;
  accountTag: string;
  tier: 'Verified Trader' | 'Pro Desk' | 'Senior Analyst' | 'Member';
  timeAgo: string;
  content: string;
  signal?: {
    symbol: string;
    direction: 'BUY' | 'SELL';
    entry: string;
    timeframe: string;
  };
  likes: number;
  likedByMe?: boolean;
}

interface LeaderboardTrader {
  rank: number;
  name: string;
  handle: string;
  winRate: number;
  tradesCount: number;
  pnlUsd: number;
  primaryPair: string;
}

const STORAGE_KEY_COMMUNITY_POSTS = 'iq_plus_community_posts_v2';

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    author: 'Adebayo O.',
    accountTag: 'IQ-409182',
    tier: 'Pro Desk',
    timeAgo: '2m ago',
    content: 'BTC/USD 15m order block holding strong with surging volume. Took a 60-second BUY position after liquidity sweep at $68,390. Target $68,900 resistance.',
    signal: {
      symbol: 'BTC/USD',
      direction: 'BUY',
      entry: '$68,410',
      timeframe: '1m'
    },
    likes: 42
  },
  {
    id: 'post_2',
    author: 'Chidinma K.',
    accountTag: 'IQ-772310',
    tier: 'Senior Analyst',
    timeAgo: '9m ago',
    content: 'EUR/USD London/NY overlap rejection at 1.0855 resistance. Bearish momentum divergence confirmed on RSI. Clean $180 profit booked, instant NIP withdrawal to PalmPay received.',
    signal: {
      symbol: 'EUR/USD',
      direction: 'SELL',
      entry: '1.0848',
      timeframe: '5m'
    },
    likes: 67
  },
  {
    id: 'post_3',
    author: 'Tariq Al-Mansoor',
    accountTag: 'IQ-923841',
    tier: 'Verified Trader',
    timeAgo: '18m ago',
    content: 'Gold (XAU/USD) bullish pennant breakout confirmed! Big institutional bids defending $2,342 support zone. Ramping up leverage responsibly on 1m expiry.',
    signal: {
      symbol: 'XAU/USD',
      direction: 'BUY',
      entry: '$2,346.50',
      timeframe: '1m'
    },
    likes: 53
  },
  {
    id: 'post_4',
    author: 'Elena Rostova',
    accountTag: 'IQ-310482',
    tier: 'Pro Desk',
    timeAgo: '29m ago',
    content: 'ETH/USD double bottom pattern playing out on the 5-minute candle charts. Entering high-probability BUY trade as volume delta turns net positive.',
    signal: {
      symbol: 'ETH/USD',
      direction: 'BUY',
      entry: '$3,520.10',
      timeframe: '5m'
    },
    likes: 38
  },
  {
    id: 'post_5',
    author: 'Ibrahim Musa',
    accountTag: 'IQ-552910',
    tier: 'Verified Trader',
    timeAgo: '42m ago',
    content: 'GBP/USD false breakout above 1.2980. Re-testing lower channel support. Fast scalp SELL trade won with 85% payout!',
    signal: {
      symbol: 'GBP/USD',
      direction: 'SELL',
      entry: '1.2965',
      timeframe: '1m'
    },
    likes: 29
  },
  {
    id: 'post_6',
    author: 'David Chen',
    accountTag: 'IQ-904112',
    tier: 'Senior Analyst',
    timeAgo: '58m ago',
    content: 'SOL/USD break-and-retest structure formed at $153.80. High volume expansion on 15m timeframe. Scalping upwards.',
    signal: {
      symbol: 'SOL/USD',
      direction: 'BUY',
      entry: '$154.80',
      timeframe: '15m'
    },
    likes: 45
  },
  {
    id: 'post_7',
    author: 'Ngozi Eze',
    accountTag: 'IQ-663819',
    tier: 'Verified Trader',
    timeAgo: '1h ago',
    content: 'US Crude Oil (USOIL) bouncing off daily horizontal demand. Clean rejection wick on 5m candles. Took $50 BUY setup and locked in $42.50 gain.',
    signal: {
      symbol: 'USOIL',
      direction: 'BUY',
      entry: '$78.25',
      timeframe: '5m'
    },
    likes: 31
  },
  {
    id: 'post_8',
    author: 'Marcus Vance',
    accountTag: 'IQ-119044',
    tier: 'Pro Desk',
    timeAgo: '2h ago',
    content: 'Reminder to all traders: strictly stick to your risk management rules. Even with high win-rate signals, never risk more than 5% of balance per position. Trade with the trend.',
    likes: 84
  }
];

const LEADERBOARD_TRADERS: LeaderboardTrader[] = [
  { rank: 1, name: 'Chidinma K.', handle: 'IQ-772***', winRate: 88.4, tradesCount: 142, pnlUsd: 14820.50, primaryPair: 'XAU/USD' },
  { rank: 2, name: 'Adebayo O.', handle: 'IQ-409***', winRate: 84.1, tradesCount: 118, pnlUsd: 11290.00, primaryPair: 'BTC/USD' },
  { rank: 3, name: 'Elena Rostova', handle: 'IQ-310***', winRate: 81.6, tradesCount: 96, pnlUsd: 8940.25, primaryPair: 'EUR/USD' },
  { rank: 4, name: 'Tunde Bakare', handle: 'IQ-883***', winRate: 79.2, tradesCount: 84, pnlUsd: 6415.80, primaryPair: 'SOL/USD' },
  { rank: 5, name: 'Ibrahim Musa', handle: 'IQ-552***', winRate: 77.5, tradesCount: 79, pnlUsd: 5180.00, primaryPair: 'GBP/USD' },
  { rank: 6, name: 'David Chen', handle: 'IQ-904***', winRate: 75.8, tradesCount: 66, pnlUsd: 4320.40, primaryPair: 'ETH/USD' }
];

export const CommunityPage: React.FC<CommunityPageProps> = ({
  onBack,
  onSelectAssetToTrade,
  onGoToTrade
}) => {
  const { currentUser } = useAuth();
  const { assets } = useMarket();

  const [activeSection, setActiveSection] = useState<'feed' | 'leaderboard' | 'sentiment'>('feed');
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMUNITY_POSTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_POSTS;
  });

  // New Post Form State
  const [postText, setPostText] = useState('');
  const [attachSignal, setAttachSignal] = useState(false);
  const [signalSymbol, setSignalSymbol] = useState('BTC/USD');
  const [signalDirection, setSignalDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [signalTimeframe, setSignalTimeframe] = useState('1m');

  // Sentiment Votes State
  const [sentimentVotes, setSentimentVotes] = useState<Record<string, { bullish: number; bearish: number; userVote?: 'bull' | 'bear' }>>({
    'BTC/USD': { bullish: 74, bearish: 26 },
    'EUR/USD': { bullish: 62, bearish: 38 },
    'XAU/USD': { bullish: 81, bearish: 19 },
    'ETH/USD': { bullish: 68, bearish: 32 },
    'SOL/USD': { bullish: 77, bearish: 23 }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMMUNITY_POSTS, JSON.stringify(posts));
    } catch {}
  }, [posts]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const matchedAsset = assets.find(a => a.symbol === signalSymbol);
    const entryFormatted = matchedAsset ? formatCurrency(matchedAsset.price) : '$68,400';

    const newPost: CommunityPost = {
      id: 'post_' + Date.now(),
      author: currentUser?.name || 'Trader',
      accountTag: currentUser?.accountNumber || 'IQ-USER',
      tier: 'Verified Trader',
      timeAgo: 'Just now',
      content: postText.trim(),
      signal: attachSignal
        ? {
            symbol: signalSymbol,
            direction: signalDirection,
            entry: entryFormatted,
            timeframe: signalTimeframe
          }
        : undefined,
      likes: 1,
      likedByMe: true
    };

    setPosts(prev => [newPost, ...prev]);
    setPostText('');
    setAttachSignal(false);
  };

  const handleToggleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const liked = !p.likedByMe;
        return {
          ...p,
          likedByMe: liked,
          likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1)
        };
      })
    );
  };

  const handleVoteSentiment = (symbol: string, vote: 'bull' | 'bear') => {
    setSentimentVotes(prev => {
      const current = prev[symbol] || { bullish: 50, bearish: 50 };
      if (current.userVote === vote) return prev;
      const bull = vote === 'bull' ? Math.min(95, current.bullish + 2) : Math.max(5, current.bullish - 2);
      return {
        ...prev,
        [symbol]: {
          bullish: bull,
          bearish: 100 - bull,
          userVote: vote
        }
      };
    });
  };

  const handleJumpToAsset = (symbol: string) => {
    const found = assets.find(a => a.symbol === symbol);
    if (found) {
      onSelectAssetToTrade(found);
    } else {
      onGoToTrade();
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-white pb-24 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D14] border-b border-slate-800/80 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#141B27] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Traders Community</h1>
            <p className="text-[11px] text-slate-400">Live Setups · Verified Leaderboard · Sentiment</p>
          </div>
        </div>

        <div className="text-right font-mono tabular-nums">
          <span className="text-[10px] text-slate-400 block">Active Desk</span>
          <span className="text-xs font-bold text-emerald-400">1,842 Online</span>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Segmented Control Tabs */}
        <div className="grid grid-cols-3 p-1 bg-[#0E131D] rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveSection('feed')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSection === 'feed'
                ? 'bg-[#F5BA31] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Feed</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('leaderboard')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSection === 'leaderboard'
                ? 'bg-[#F5BA31] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Top Traders</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('sentiment')}
            className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSection === 'sentiment'
                ? 'bg-[#F5BA31] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Sentiment</span>
          </button>
        </div>

        {/* SECTION 1: LIVE FEED & SHARE IDEA */}
        {activeSection === 'feed' && (
          <div className="space-y-4">
            {/* Compose Trade Idea / Community Post */}
            <form onSubmit={handleCreatePost} className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Share Market Setup or Note</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Posting as {currentUser?.name || 'Trader'}
                </span>
              </div>

              <textarea
                rows={2}
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="Share your market analysis, entry level, or payout update..."
                className="w-full px-3 py-2.5 bg-[#0B0F17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/70 resize-none"
              />

              {attachSignal && (
                <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-xl grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Market Pair</label>
                    <select
                      value={signalSymbol}
                      onChange={e => setSignalSymbol(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#141B27] border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                    >
                      {assets.map(a => (
                        <option key={a.symbol} value={a.symbol}>
                          {a.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Direction</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setSignalDirection('BUY')}
                        className={`py-1.5 rounded-lg text-[11px] font-bold font-mono cursor-pointer ${
                          signalDirection === 'BUY'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-[#141B27] text-slate-400'
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignalDirection('SELL')}
                        className={`py-1.5 rounded-lg text-[11px] font-bold font-mono cursor-pointer ${
                          signalDirection === 'SELL'
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#141B27] text-slate-400'
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Timeframe</label>
                    <select
                      value={signalTimeframe}
                      onChange={e => setSignalTimeframe(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#141B27] border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none"
                    >
                      <option value="1m">1m</option>
                      <option value="5m">5m</option>
                      <option value="15m">15m</option>
                      <option value="1h">1h</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setAttachSignal(!attachSignal)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    attachSignal
                      ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                      : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {attachSignal ? 'Remove Signal Tag' : '+ Attach Trade Signal'}
                </button>

                <button
                  type="submit"
                  disabled={!postText.trim()}
                  className="px-4 py-1.5 bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post to Feed</span>
                </button>
              </div>
            </form>

            {/* Posts List */}
            <div className="space-y-3">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="p-4 bg-[#111722] border border-slate-800/90 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#182232] border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{post.author}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>{post.tier}</span>
                          <span>·</span>
                          <span className="font-mono">{post.accountTag}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{post.timeAgo}</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{post.content}</p>

                  {post.signal && (
                    <div className="p-3 bg-[#0B0F17] border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            post.signal.direction === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {post.signal.direction}
                        </span>
                        <div className="text-xs">
                          <span className="font-bold text-white font-mono">{post.signal.symbol}</span>
                          <span className="text-slate-400 ml-2 font-mono tabular-nums">
                            Entry {post.signal.entry} · {post.signal.timeframe}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleJumpToAsset(post.signal!.symbol)}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Trade</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 font-mono transition-colors cursor-pointer ${
                        post.likedByMe ? 'text-amber-400 font-bold' : 'hover:text-slate-200'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{post.likes} Helpful</span>
                    </button>
                    <span className="text-[11px] text-slate-500">Verified Execution Feed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: TOP TRADERS LEADERBOARD */}
        {activeSection === 'leaderboard' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white">7-Day Verified Performers</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ranked by realized net profit and execution win rate
                </p>
              </div>
              <Users className="w-5 h-5 text-amber-400 shrink-0" />
            </div>

            <div className="bg-[#111722] border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
              {LEADERBOARD_TRADERS.map(trader => (
                <div key={trader.rank} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                        trader.rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : trader.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : trader.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-[#0B0F17] text-slate-400 border border-slate-800'
                      }`}
                    >
                      {trader.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{trader.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({trader.handle})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                        Win Rate <strong className="text-emerald-400">{trader.winRate}%</strong> · {trader.tradesCount} trades · {trader.primaryPair}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono tabular-nums">
                    <span className="text-xs font-bold text-emerald-400 block">
                      +{formatCurrency(trader.pnlUsd)}
                    </span>
                    <span className="text-[10px] text-slate-500">7D Realized</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: MARKET SENTIMENT */}
        {activeSection === 'sentiment' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#111722] border border-slate-800 rounded-2xl">
              <h2 className="text-sm font-bold text-white">Client Positioning & Sentiment</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live long vs. short ratio across active community accounts. Cast your outlook below.
              </p>
            </div>

            {Object.entries(sentimentVotes).map(([symbol, data]) => (
              <div
                key={symbol}
                className="p-4 bg-[#111722] border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white font-mono">{symbol}</span>
                  <button
                    type="button"
                    onClick={() => handleJumpToAsset(symbol)}
                    className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Chart</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono tabular-nums">
                    <span className="text-emerald-400 font-bold">{data.bullish}% Bullish (Buy)</span>
                    <span className="text-rose-400 font-bold">{data.bearish}% Bearish (Sell)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-rose-500/80 overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${data.bullish}%` }}
                    />
                  </div>
                </div>

                {/* Vote Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleVoteSentiment(symbol, 'bull')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                      data.userVote === 'bull'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Vote Bullish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoteSentiment(symbol, 'bear')}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                      data.userVote === 'bear'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>Vote Bearish</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
