import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Candle, QuickTrade } from '../types';
import { generateInitialCandles, updateCandlesWithPrice } from '../utils/candleGenerator';
import { 
  ChevronLeft, 
  ChevronRight, 
  FastForward, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Info,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface CandleChartProps {
  currentPrice: number;
  symbol: string;
  activeTrade?: QuickTrade | null;
  trades?: QuickTrade[];
  chartType?: 'candles' | 'line';
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  currentPrice,
  symbol,
  activeTrade,
  trades = [],
  chartType = 'candles',
  isFullScreen = false,
  onToggleFullScreen
}) => {
  // Start with 40 historical candles so the user can scroll back right away
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(currentPrice, 42));
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [scrollOffset, setScrollOffset] = useState<number>(0); // 0 = viewing latest live candles, > 0 = scrolled into history
  const [selectedTrade, setSelectedTrade] = useState<QuickTrade | null>(null);

  // Dragging / pan gesture tracking
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartX = useRef<number>(0);
  const initialOffsetOnDrag = useRef<number>(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const prevSymbolRef = useRef(symbol);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // When symbol changes, reset candles and scroll
  useEffect(() => {
    if (prevSymbolRef.current !== symbol) {
      setCandles(generateInitialCandles(currentPrice, 42));
      setScrollOffset(0);
      prevSymbolRef.current = symbol;
    }
  }, [symbol, currentPrice]);

  // When price ticks, update candles. If at live (scrollOffset === 0), auto-scroll stays at live.
  useEffect(() => {
    setCandles(prev => updateCandlesWithPrice(prev, currentPrice));
  }, [currentPrice]);

  // Forward moving candle generator: every 12 seconds, ensure a new candle steps forward
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const now = Date.now();
        const date = new Date(now);
        const timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        // Random micro tick
        const isForex = currentPrice < 2;
        const wiggle = (Math.random() - 0.48) * (isForex ? 0.0001 : currentPrice * 0.0005);
        const close = Number((last.close + wiggle).toFixed(isForex ? 5 : 2));

        const nextCandle: Candle = {
          time: now,
          timeLabel,
          open: last.close,
          high: Math.max(last.close, close),
          low: Math.min(last.close, close),
          close: close,
          volume: Math.floor(15 + Math.random() * 40)
        };

        // Keep last 80 candles so memory stays lean while giving deep scrollback history
        const updated = [...prev, nextCandle];
        if (updated.length > 80) return updated.slice(updated.length - 80);
        return updated;
      });
    }, 12000);

    return () => clearInterval(stepTimer);
  }, [currentPrice]);

  // Viewport windowing: how many candles are visible at once
  const visibleCount = 26;
  const maxScroll = Math.max(0, candles.length - visibleCount);

  // Clamp scroll offset
  const safeOffset = Math.min(Math.max(0, scrollOffset), maxScroll);
  const endIndex = candles.length - safeOffset;
  const startIndex = Math.max(0, endIndex - visibleCount);
  const visibleCandles = useMemo(() => {
    return candles.slice(startIndex, endIndex);
  }, [candles, startIndex, endIndex]);

  // Chart Geometry & Price Range for Visible Window
  const { minPrice, maxPrice, priceRange, yLabels } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    visibleCandles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    if (safeOffset === 0) {
      if (currentPrice < min) min = currentPrice;
      if (currentPrice > max) max = currentPrice;
    }

    const span = max - min || (currentPrice < 2 ? 0.0008 : currentPrice * 0.005);
    const paddedMin = min - span * 0.15;
    const paddedMax = max + span * 0.15;
    const range = paddedMax - paddedMin || 1;

    const steps = 5;
    const stepVal = range / steps;
    const labels: { price: number; yPercent: number }[] = [];

    for (let i = 0; i <= steps; i++) {
      const p = paddedMax - i * stepVal;
      const yPct = (i / steps) * 100;
      labels.push({ price: p, yPercent: yPct });
    }

    return {
      minPrice: paddedMin,
      maxPrice: paddedMax,
      priceRange: range,
      yLabels: labels
    };
  }, [visibleCandles, currentPrice, safeOffset]);

  // Dimensions
  const width = 380;
  const height = isFullScreen ? 460 : 300;
  const candleAreaHeight = isFullScreen ? 375 : 225;
  const volumeAreaHeight = isFullScreen ? 50 : 40;
  const rightAxisWidth = 62;
  const plotWidth = width - rightAxisWidth;

  const slotWidth = visibleCandles.length > 0 ? plotWidth / visibleCandles.length : 12;
  const candleWidth = Math.max(3.5, slotWidth * 0.65);

  const getY = (price: number) => {
    const fraction = (maxPrice - price) / priceRange;
    return Math.max(6, Math.min(candleAreaHeight - 6, fraction * candleAreaHeight));
  };

  const currentY = getY(currentPrice);

  const formatYPrice = (p: number) => {
    if (p < 2) return p.toFixed(5);
    if (p < 50) return p.toFixed(3);
    if (p < 500) return p.toFixed(2);
    return Math.round(p).toString();
  };

  const maxVol = Math.max(...visibleCandles.map(c => c.volume), 1);

  // Time labels
  const timeLabels = useMemo(() => {
    if (visibleCandles.length < 5) return [];
    return [
      { label: visibleCandles[Math.floor(visibleCandles.length * 0.2)]?.timeLabel || '', x: plotWidth * 0.2 },
      { label: visibleCandles[Math.floor(visibleCandles.length * 0.5)]?.timeLabel || '', x: plotWidth * 0.5 },
      { label: visibleCandles[Math.floor(visibleCandles.length * 0.8)]?.timeLabel || '', x: plotWidth * 0.8 }
    ];
  }, [visibleCandles, plotWidth]);

  // Touch and Mouse Drag / Pan Handlers
  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    initialOffsetOnDrag.current = safeOffset;
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartX.current;
    // Moving finger to the right (positive delta) scrolls back into history (increases scrollOffset)
    const candlesMoved = Math.round(deltaX / (slotWidth * 1.5));
    const newOffset = Math.min(Math.max(0, initialOffsetOnDrag.current + candlesMoved), maxScroll);
    setScrollOffset(newOffset);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Map trades to visible candles
  const visibleTrades = useMemo(() => {
    if (!trades || trades.length === 0 || visibleCandles.length === 0) return [];
    const minTime = visibleCandles[0].time - 45000;
    const maxTime = visibleCandles[visibleCandles.length - 1].time + 45000;

    return trades
      .filter(t => t.assetSymbol === symbol && t.startTime >= minTime && t.startTime <= maxTime)
      .map(t => {
        // Find closest visible candle index
        let closestIdx = 0;
        let minDiff = Infinity;
        visibleCandles.forEach((c, idx) => {
          const diff = Math.abs(c.time - t.startTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        const x = closestIdx * slotWidth + slotWidth / 2;
        const y = getY(t.entryPrice);
        return {
          trade: t,
          x,
          y
        };
      });
  }, [trades, visibleCandles, symbol, slotWidth]);

  // Determine active live candle direction
  const activeCandle = visibleCandles[visibleCandles.length - 1];
  const isMarketGoingUp = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const activeDirectionColor = isMarketGoingUp ? '#00C26F' : '#E02B37';

  return (
    <div 
      ref={chartContainerRef}
      className="relative w-full h-[320px] bg-[#090D14] border border-slate-800/80 rounded-2xl overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
      onTouchEnd={handlePointerUp}
    >
      {/* Top Header Controls: Live status, Up/Down badge, and Pan controllers */}
      <div className="absolute top-2.5 left-3 right-3 z-20 flex items-center justify-between text-xs font-semibold pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </span>
          <span className="text-slate-300 font-mono tracking-wider text-[11px]">
            {currentTimeStr || '09:41:32'}
          </span>
        </div>

        {/* Dynamic Live Market Direction Badge */}
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
            isMarketGoingUp 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            <span>{isMarketGoingUp ? '▲ Up (Green Candle)' : '▼ Down (Red Candle)'}</span>
          </div>

          {/* Scroll / History Indicator */}
          {safeOffset > 0 && (
            <div className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 pointer-events-auto">
              <Clock className="w-3 h-3" />
              <span>Viewing Past ({safeOffset} candles back)</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating "Jump to Live" button when user has scrolled back to inspect lost/past trades */}
      {safeOffset > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScrollOffset(0);
          }}
          className="absolute bottom-10 right-16 z-30 py-1.5 px-3 rounded-xl bg-[#F5BA31] hover:bg-[#ffc842] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xl shadow-black/50 transition-all cursor-pointer animate-in fade-in zoom-in-95"
        >
          <FastForward className="w-3.5 h-3.5 fill-current" />
          <span>Jump to Live</span>
        </button>
      )}

      {/* Quick Scroll Step buttons (left/right) */}
      <div className="absolute top-10 right-3 z-20 flex gap-1 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScrollOffset(prev => Math.min(prev + 5, maxScroll));
          }}
          className="p-1 rounded-lg bg-[#141B27]/80 hover:bg-[#1E293B] border border-slate-800 text-slate-300 hover:text-white"
          title="Scroll Back in Time"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setScrollOffset(prev => Math.max(0, prev - 5));
          }}
          disabled={safeOffset === 0}
          className="p-1 rounded-lg bg-[#141B27]/80 hover:bg-[#1E293B] border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
          title="Scroll Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {onToggleFullScreen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullScreen();
            }}
            className="p-1 rounded-lg bg-[#141B27]/80 hover:bg-[#1E293B] border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen Chart (Clear View)"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {yLabels.map((item, idx) => {
          const y = (item.yPercent / 100) * candleAreaHeight;
          return (
            <g key={idx}>
              <line
                x1="0"
                y1={y}
                x2={plotWidth}
                y2={y}
                stroke="#172030"
                strokeWidth="1"
              />
              <text
                x={plotWidth + 8}
                y={y + 3}
                fill="#8E9BAE"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="start"
              >
                {formatYPrice(item.price)}
              </text>
            </g>
          );
        })}

        {/* Vertical divider */}
        <line
          x1={plotWidth}
          y1="0"
          x2={plotWidth}
          y2={height - 20}
          stroke="#172030"
          strokeWidth="1"
        />

        {/* Vertical Grid lines */}
        {[0.2, 0.5, 0.8].map((fraction, i) => (
          <line
            key={i}
            x1={plotWidth * fraction}
            y1="0"
            x2={plotWidth * fraction}
            y2={height - 20}
            stroke="#172030"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
        ))}

        {/* Volume baseline */}
        <line
          x1="0"
          y1={candleAreaHeight + 5}
          x2={plotWidth}
          y2={candleAreaHeight + 5}
          stroke="#172030"
          strokeWidth="1"
        />

        {/* Candlesticks Rendering */}
        {chartType === 'candles' ? (
          <g id="candlesticks">
            {visibleCandles.map((candle, idx) => {
              const x = idx * slotWidth + slotWidth / 2;
              const isBullish = candle.close >= candle.open;
              const candleColor = isBullish ? '#00C26F' : '#E02B37';

              const openY = getY(candle.open);
              const closeY = getY(candle.close);
              const highY = getY(candle.high);
              const lowY = getY(candle.low);

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(2, Math.abs(closeY - openY));

              const volBarHeight = (candle.volume / maxVol) * volumeAreaHeight;
              const volY = height - 25 - volBarHeight;

              return (
                <g key={idx}>
                  {/* Wicks */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />

                  {/* Body: Green going up, Red going down */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    rx="0.5"
                  />

                  {/* Volume bar */}
                  <rect
                    x={x - candleWidth / 2}
                    y={volY}
                    width={candleWidth}
                    height={volBarHeight}
                    fill={candleColor}
                    opacity="0.6"
                    rx="0.5"
                  />
                </g>
              );
            })}
          </g>
        ) : (
          /* Area Line Chart */
          <g id="lineChart">
            <path
              d={
                visibleCandles.reduce((acc, c, i) => {
                  const x = i * slotWidth + slotWidth / 2;
                  const y = getY(c.close);
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '') + ` L ${plotWidth} ${candleAreaHeight} L 0 ${candleAreaHeight} Z`
              }
              fill="url(#lineFillGrad)"
            />
            <path
              d={visibleCandles.reduce((acc, c, i) => {
                const x = i * slotWidth + slotWidth / 2;
                const y = getY(c.close);
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke={activeDirectionColor}
              strokeWidth="2"
            />
          </g>
        )}

        {/* Live Dashed Reference Line and Price Tag (only when live candle is in view) */}
        {safeOffset === 0 && (
          <>
            <line
              x1="0"
              y1={currentY}
              x2={plotWidth}
              y2={currentY}
              stroke={activeDirectionColor}
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <g transform={`translate(${plotWidth}, ${currentY - 10})`}>
              <rect
                x="0"
                y="0"
                width={rightAxisWidth - 2}
                height="20"
                fill={activeDirectionColor}
                rx="4"
              />
              <text
                x={(rightAxisWidth - 2) / 2}
                y="13.5"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {formatYPrice(currentPrice)}
              </text>
            </g>
          </>
        )}

        {/* Historical Past Trade Markers (Where user lost or won a trade before) */}
        {visibleTrades.map(({ trade, x, y }, i) => {
          const isLost = trade.status === 'lost';
          const isWon = trade.status === 'won';
          const markerColor = isLost ? '#E02B37' : isWon ? '#00C26F' : '#3B82F6';

          return (
            <g 
              key={trade.id || i}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTrade(trade);
              }}
            >
              {/* Vertical dotted locator to candle */}
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={candleAreaHeight}
                stroke={markerColor}
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />

              {/* Pinpoint Circle */}
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill={markerColor}
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Trade Label Badge directly on the candle */}
              <g transform={`translate(${Math.max(10, Math.min(plotWidth - 75, x - 35))}, ${Math.max(14, y - 22)})`}>
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="16"
                  fill={markerColor}
                  rx="4"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.6))"
                />
                <text
                  x="35"
                  y="11"
                  fill="#FFFFFF"
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {isLost ? `LOST -$${trade.investment}` : isWon ? `WON +$${trade.profit}` : `ACTIVE $${trade.investment}`}
                </text>
              </g>
            </g>
          );
        })}

        {/* Active Trade In-Flight Marker */}
        {activeTrade && activeTrade.status === 'active' && safeOffset === 0 && (
          <g>
            <line
              x1="0"
              y1={getY(activeTrade.entryPrice)}
              x2={plotWidth}
              y2={getY(activeTrade.entryPrice)}
              stroke={activeTrade.type === 'buy' ? '#10B981' : '#EF4444'}
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          </g>
        )}

        {/* X-axis time markings */}
        {timeLabels.map((tl, i) => (
          <text
            key={i}
            x={tl.x}
            y={height - 7}
            fill="#8E9BAE"
            fontSize="9.5"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {tl.label}
          </text>
        ))}
      </svg>

      {/* Swipe / Drag Helper hint at bottom */}
      <div className="absolute bottom-1.5 left-3 text-[9px] text-slate-500 font-mono flex items-center gap-1 pointer-events-none">
        <span>← Swipe/Drag to inspect past trades →</span>
      </div>

      {/* Trade Details Popover when a past trade marker is tapped */}
      {selectedTrade && (
        <div 
          className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setSelectedTrade(null)}
        >
          <div 
            className="w-full max-w-xs bg-[#121824] border border-slate-700 rounded-2xl p-4 shadow-2xl text-xs space-y-2.5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {selectedTrade.status === 'lost' ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-bold text-sm">
                  {selectedTrade.status === 'lost' ? 'Past Lost Trade' : 'Past Won Trade'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedTrade(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Pair & Action:</span>
                <span className="font-bold font-mono">{selectedTrade.assetSymbol} ({selectedTrade.type.toUpperCase()})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Strike:</span>
                <span className="font-mono text-white">${selectedTrade.entryPrice}</span>
              </div>
              {selectedTrade.closePrice && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Exit Price:</span>
                  <span className="font-mono text-white">${selectedTrade.closePrice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Investment:</span>
                <span className="font-mono text-white">${selectedTrade.investment}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Result P&L:</span>
                <span className={`font-mono font-black ${selectedTrade.status === 'lost' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedTrade.status === 'lost' ? `-$${selectedTrade.investment}.00` : `+$${selectedTrade.profit}.00`}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrade(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-colors mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
