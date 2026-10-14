import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, TrendingUp, TrendingDown, Users, Sparkles, X, Maximize2, Minimize2, CandlestickChart, ArrowLeft } from 'lucide-react';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';

interface TradingChatProps {
  symbol: string;
  onClose?: () => void;
  isDrawer?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onOpenFullScreenChart?: () => void;
  currentPrice?: number;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'Elena Trader',
    badge: 'PRO',
    text: 'EUR/USD bouncing strongly off the 1.08250 support zone. Looking for 1m calls.',
    time: '09:38',
    tradeSignal: { symbol: 'EUR/USD', action: 'BUY', duration: '1 min' }
  },
  {
    id: 'm2',
    sender: 'Marco Rossi',
    badge: 'VIP',
    text: 'Green candle volume spiking! Just closed +$85 profit on that breakout.',
    time: '09:39'
  },
  {
    id: 'm3',
    sender: 'Satoshi_Dev',
    badge: 'TRADER',
    text: 'BTC consolidating near $67.4k, Gold pushing new daily highs.',
    time: '09:40'
  },
  {
    id: 'm4',
    sender: 'Sarah Chen',
    badge: 'PRO',
    text: 'Resistance at 1.08420. If it breaks, next target is 1.08480.',
    time: '09:41',
    tradeSignal: { symbol: 'EUR/USD', action: 'BUY', duration: '1 min' }
  }
];

export const TradingChat: React.FC<TradingChatProps> = ({ 
  symbol, 
  onClose, 
  isDrawer = false,
  isFullScreen = false,
  onToggleFullScreen,
  onOpenFullScreenChart,
  currentPrice
}) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Occasional simulated community messages
  useEffect(() => {
    const timer = setInterval(() => {
      const communityShouts = [
        { sender: 'Alexandre P.', text: `${symbol} looking bullish on 1m chart!`, badge: 'TRADER' },
        { sender: 'CryptoWhale', text: 'Nice momentum on this green candle!', badge: 'VIP' },
        { sender: 'David Miller', text: 'Just took a 1m position. Good luck everyone!', badge: 'PRO' }
      ];
      const randomMsg = communityShouts[Math.floor(Math.random() * communityShouts.length)];
      const newMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        sender: randomMsg.sender,
        badge: randomMsg.badge,
        text: randomMsg.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev.slice(-25), newMsg]);
    }, 14000);

    return () => clearInterval(timer);
  }, [symbol]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: 'usr_msg_' + Date.now(),
      sender: currentUser?.name || 'You',
      badge: 'YOU',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
  };

  return (
    <div className={`flex flex-col bg-[#101622] border border-slate-800 overflow-hidden ${
      isFullScreen 
        ? 'h-full w-full rounded-none border-0' 
        : isDrawer 
        ? 'h-[520px] rounded-2xl' 
        : 'h-[400px] rounded-2xl'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between bg-[#0D121B] border-b border-slate-800 ${
        isFullScreen ? 'px-4 py-3.5 sm:px-6' : 'px-3.5 py-2.5'
      }`}>
        <div className="flex items-center gap-2.5">
          {isFullScreen && (
            <button
              onClick={onToggleFullScreen || onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <MessageSquare className={`text-amber-400 ${isFullScreen ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <span className={`font-black text-white ${isFullScreen ? 'text-base sm:text-lg' : 'text-xs'}`}>
            {isFullScreen ? 'Full Screen Live Trading Room' : 'Live Trading Room'}
          </span>
          <span className={`flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-mono font-bold ${
            isFullScreen ? 'text-xs sm:text-sm' : 'text-[10px]'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            1,482 Online
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Option to jump directly to Full Screen Chart from Chat */}
          {onOpenFullScreenChart && (
            <button
              onClick={onOpenFullScreenChart}
              className={`flex items-center gap-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 font-bold text-amber-300 transition-colors ${
                isFullScreen ? 'px-3.5 py-1.5 text-xs sm:text-sm' : 'px-2.5 py-1 text-[11px]'
              }`}
              title="Full Screen Chart"
            >
              <CandlestickChart className={isFullScreen ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
              <span>View Chart</span>
            </button>
          )}

          {/* Full Screen Toggle Button */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Chat'}
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {onClose && !isFullScreen && (
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className={`flex-1 overflow-y-auto ${
        isFullScreen ? 'p-4 sm:p-6 space-y-4 text-sm sm:text-base' : 'p-3 space-y-3 text-xs sm:text-sm'
      }`}>
        {messages.map(msg => {
          const isMe = msg.badge === 'YOU';

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-black text-slate-200 ${isFullScreen ? 'text-xs sm:text-sm' : 'text-[11px]'}`}>
                  {msg.sender}
                </span>
                {msg.badge && (
                  <span className={`px-1.5 py-0.5 rounded font-mono font-black ${
                    isFullScreen ? 'text-[10px] sm:text-xs' : 'text-[9px]'
                  } ${
                    msg.badge === 'PRO' 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                      : msg.badge === 'VIP' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : isMe
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {msg.badge}
                  </span>
                )}
                <span className={`text-slate-500 font-mono ${isFullScreen ? 'text-xs' : 'text-[10px]'}`}>{msg.time}</span>
              </div>

              <div className={`rounded-2xl max-w-[88%] sm:max-w-[78%] leading-relaxed ${
                isFullScreen ? 'p-3.5 sm:p-4 text-sm sm:text-base font-medium' : 'p-2.5 sm:p-3 text-xs sm:text-sm'
              } ${
                isMe ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-white rounded-tr-none' : 'bg-[#151D2A] border border-slate-800 text-slate-100 rounded-tl-none'
              }`}>
                {msg.text}

                {/* Optional Trade Signal Attachment */}
                {msg.tradeSignal && (
                  <div className={`mt-2 rounded-xl bg-black/50 border border-slate-700/80 flex items-center justify-between ${
                    isFullScreen ? 'p-2.5 text-xs sm:text-sm' : 'p-2 text-[11px]'
                  }`}>
                    <span className="font-bold text-white">{msg.tradeSignal.symbol}</span>
                    <span className={`font-black flex items-center gap-1 ${
                      msg.tradeSignal.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {msg.tradeSignal.action === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {msg.tradeSignal.action} {msg.tradeSignal.duration}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={`bg-[#0D121B] border-t border-slate-800 flex gap-2 ${
        isFullScreen ? 'p-3 sm:p-4' : 'p-2.5'
      }`}>
        <input
          type="text"
          placeholder="Share trading thought or signal with live room..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={`flex-1 bg-[#141B27] border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 ${
            isFullScreen ? 'px-4 py-3 text-sm sm:text-base' : 'px-3 py-2 text-xs sm:text-sm'
          }`}
        />
        <button
          type="submit"
          className={`bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            isFullScreen ? 'px-5 py-3 text-sm sm:text-base' : 'px-3.5 py-2 text-xs'
          }`}
        >
          <Send className={isFullScreen ? 'w-5 h-5' : 'w-4 h-4'} />
        </button>
      </form>
    </div>
  );
};
