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
        ? 'h-[460px] rounded-2xl' 
        : 'h-80 rounded-2xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0D121B] border-b border-slate-800">
        <div className="flex items-center gap-2">
          {isFullScreen && (
            <button
              onClick={onToggleFullScreen || onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white">
            {isFullScreen ? 'Full Screen Trading Chat Room' : 'Live Trading Room'}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            1,482 Online
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Option to jump directly to Full Screen Chart from Chat */}
          {onOpenFullScreenChart && (
            <button
              onClick={onOpenFullScreenChart}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-[11px] font-bold text-amber-300 transition-colors"
              title="Full Screen Chart"
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Chart</span>
            </button>
          )}

          {/* Full Screen Toggle Button */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen Chat'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {messages.map(msg => {
          const isMe = msg.badge === 'YOU';

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-slate-300 text-[11px]">{msg.sender}</span>
                {msg.badge && (
                  <span className={`text-[9px] px-1 rounded font-mono font-bold ${
                    msg.badge === 'PRO' 
                      ? 'bg-amber-400/20 text-amber-300' 
                      : msg.badge === 'VIP' 
                      ? 'bg-purple-500/20 text-purple-300'
                      : isMe
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {msg.badge}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono">{msg.time}</span>
              </div>

              <div className={`p-2.5 rounded-xl max-w-[85%] text-slate-200 leading-relaxed ${
                isMe ? 'bg-amber-500/15 border border-amber-500/30 text-white rounded-tr-none' : 'bg-[#151D2A] border border-slate-800 rounded-tl-none'
              }`}>
                {msg.text}

                {/* Optional Trade Signal Attachment */}
                {msg.tradeSignal && (
                  <div className="mt-1.5 p-1.5 rounded-lg bg-black/40 border border-slate-700/60 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-white">{msg.tradeSignal.symbol}</span>
                    <span className={`font-black flex items-center gap-0.5 ${
                      msg.tradeSignal.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {msg.tradeSignal.action === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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
      <form onSubmit={handleSendMessage} className="p-2 bg-[#0D121B] border-t border-slate-800 flex gap-2">
        <input
          type="text"
          placeholder="Share trading thought or signal..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-[#141B27] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
