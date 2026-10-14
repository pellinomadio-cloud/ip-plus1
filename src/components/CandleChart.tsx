import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Candle, QuickTrade } from '../types';
import { 
  getPersistentCandles, 
  updatePersistentCandlesWithPrice 
} from '../utils/candleGenerator';
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
  // Load persistent historical candles for active symbol
  const [candles, setCandles] = useState<Candle[]>(() => getPersistentCandles(symbol, currentPrice));
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [scrollOffset, setScrollOffset] = useState<number>(0); // 0 = viewing latest live candles, > 0 = scrolled into history
  const [selectedTrade, setSelectedTrade] = useState<QuickTrade | null>(null);

  // Zooming state (1.0 = 100% normal view, 1.5 = 150%, 2.0 = 200%, 3.0 = 300% zoomed in)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // Dragging / pan gesture tracking
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartX = useRef<number>(0);
  const initialOffsetOnDrag = useRef<number>(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Pinch-to-zoom distance tracking for touch devices
  const initialPinchDist = useRef<number | null>(null);
  const initialZoomOnPinch = useRef<number>(1.0);

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

  // When symbol changes, load persistent candles for the target asset
  useEffect(() => {
    if (prevSymbolRef.current !== symbol) {
      const loaded = getPersistentCandles(symbol, currentPrice);
      setCandles(loaded);
      setScrollOffset(0);
      setZoomLevel(1.0);
      prevSymbolRef.current = symbol;
    }
  }, [symbol, currentPrice]);

  // When price ticks, update persistent candles
  useEffect(() => {
    setCandles(prev => updatePersistentCandlesWithPrice(symbol, currentPrice, prev));
  }, [symbol, currentPrice]);

  // Forward moving candle generator: every 10 seconds, advance live candles persistently
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCandles(prev => updatePersistentCandlesWithPrice(symbol, currentPrice, prev));
    }, 10000);

    return () => clearInterval(stepTimer);
  }, [symbol, currentPrice]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Mouse Wheel Zoom
  const handleWheelZoom = (e: React.WheelEvent) => {
    // Zoom in on wheel scroll up, out on scroll down
    if (e.deltaY < 0) {
      setZoomLevel(prev => Math.min(3.5, Number((prev + 0.15).toFixed(2))));
    } else if (e.deltaY > 0) {
      setZoomLevel(prev => Math.max(0.5, Number((prev - 0.15).toFixed(2))));
    }
  };

  // Viewport windowing: calculate visible count based on zoomLevel (zooming in reduces count so candles get bigger)
  const baseCount = isFullScreen ? 22 : 26;
  const visibleCount = Math.max(5, Math.min(48, Math.round(baseCount / zoomLevel)));
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
  const width = 420;
  const height = isFullScreen ? 580 : 340;
  const candleAreaHeight = isFullScreen ? 470 : 260;
  const volumeAreaHeight = isFullScreen ? 60 : 45;
  const rightAxisWidth = 70;
  const plotWidth = width - rightAxisWidth;

  const slotWidth = visibleCandles.length > 0 ? plotWidth / visibleCandles.length : 14;
  const candleWidth = Math.max(isFullScreen ? 6 : 4.5, slotWidth * (isFullScreen ? 0.76 : 0.70));

  const getY = (price: number) => {
    const fraction = (maxPrice - price) / priceRange;
    return Math.max(8, Math.min(candleAreaHeight - 8, fraction * candleAreaHeight));
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

  // Find highest and lowest candles in visible window for high/low labels when zoomed in
  const { highestCandleInfo, lowestCandleInfo } = useMemo(() => {
    if (visibleCandles.length === 0) return { highestCandleInfo: null, lowestCandleInfo: null };
    let highIdx = 0;
    let lowIdx = 0;
    visibleCandles.forEach((c, idx) => {
      if (c.high > visibleCandles[highIdx].high) highIdx = idx;
      if (c.low < visibleCandles[lowIdx].low) lowIdx = idx;
    });
    return {
      highestCandleInfo: {
        candle: visibleCandles[highIdx],
        x: highIdx * slotWidth + slotWidth / 2,
        y: getY(visibleCandles[highIdx].high)
      },
      lowestCandleInfo: {
        candle: visibleCandles[lowIdx],
        x: lowIdx * slotWidth + slotWidth / 2,
        y: getY(visibleCandles[lowIdx].low)
      }
    };
  }, [visibleCandles, slotWidth, maxPrice, minPrice, priceRange, candleAreaHeight]);

  // Touch and Mouse Drag / Pan / Pinch-Zoom Handlers
  const handlePointerDown = (clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    initialOffsetOnDrag.current = safeOffset;
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDragging) return;
    const deltaX = clientX - dragStartX.current;
    // Moving finger/mouse to the right scrolls back into history
    const candlesMoved = Math.round(deltaX / (slotWidth * 1.5));
    const newOffset = Math.min(Math.max(0, initialOffsetOnDrag.current + candlesMoved), maxScroll);
    setScrollOffset(newOffset);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDist.current = dist;
      initialZoomOnPinch.current = zoomLevel;
    } else if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / initialPinchDist.current;
      const newZoom = Math.min(3.5, Math.max(0.5, initialZoomOnPinch.current * scale));
      setZoomLevel(Number(newZoom.toFixed(2)));
    } else if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    initialPinchDist.current = null;
    handlePointerUp();
  };

  // Map trades to visible candles
  const visibleTrades = useMemo(() => {
    if (!trades || trades.length === 0 || visibleCandles.length === 0) return [];
    const minTime = visibleCandles[0].time - 45000;
    const maxTime = visibleCandles[visibleCandles.length - 1].time + 45000;

    return trades
      .filter(t => t.assetSymbol === symbol && t.startTime >= minTime && t.startTime <= maxTime)
      .map(t => {
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

  // Determine active live candle or hovered candle for detailed display
  const activeCandle = visibleCandles[visibleCandles.length - 1];
  const inspectedCandle = hoveredCandle || activeCandle;
  const isMarketGoingUp = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const activeDirectionColor = isMarketGoingUp ? '#00C26F' : '#E02B37';

  return (
    <div 
      ref={chartContainerRef}
      className={`relative w-full bg-[#090D14] border border-slate-800/80 rounded-2xl overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing ${
        isFullScreen 
          ? 'h-full min-h-[460px] sm:min-h-[560px] md:min-h-[620px]' 
          : 'h-[380px] sm:h-[420px]'
      }`}
      onMouseDown={(e) => handlePointerDown(e.clientX)}
      onMouseMove={(e) => handlePointerMove(e.clientX)}
      onMouseUp={handlePointerUp}
      onMouseLeave={() => {
        handlePointerUp();
        setHoveredCandle(null);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheelZoom}
    >
      {/* Top Header Bar: Live status, OHLC inspection details, Market direction badge, Fullscreen toggle */}
      <div className="absolute top-2.5 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-1 text-xs font-semibold pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </span>
          <span className="text-slate-300 font-mono tracking-wider text-[11px]">
            {currentTimeStr || '09:41:32'}
          </span>

          {/* Inspected / Active Candle OHLC Bar */}
          {inspectedCandle && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-medium text-slate-300 bg-[#0c121e]/90 px-2 py-0.5 rounded-lg border border-slate-800 pointer-events-auto">
              <span>O: <strong className="text-white">${inspectedCandle.open}</strong></span>
              <span>H: <strong className="text-emerald-400">${inspectedCandle.high}</strong></span>
              <span>L: <strong className="text-rose-400">${inspectedCandle.low}</strong></span>
              <span>C: <strong className={inspectedCandle.close >= inspectedCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${inspectedCandle.close}</strong></span>
            </div>
          )}
        </div>

        {/* Dynamic Live Market Direction Badge & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
            isMarketGoingUp 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}>
            <span>{isMarketGoingUp ? '▲ Up' : '▼ Down'}</span>
          </div>

          {/* Reset Zoom Pill (Only appears if user zoomed via pinch/wheel) */}
          {zoomLevel !== 1.0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              className="px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
              title="Reset Zoom to 100%"
            >
              Reset Zoom
            </button>
          )}

          {/* Scroll / History Indicator */}
          {safeOffset > 0 && (
            <div className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>History ({safeOffset} back)</span>
            </div>
          )}

          {/* Fullscreen Toggle */}
          {onToggleFullScreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullScreen();
              }}
              className="p-1 rounded-lg bg-[#0d1320]/90 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors ml-1"
              title={isFullScreen ? "Exit Full Screen" : "Full Screen Chart"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Floating "Jump to Live" button */}
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
                y={y + 3.5}
                fill="#8E9BAE"
                fontSize={isFullScreen ? "12" : "10"}
                fontFamily="monospace"
                fontWeight={isFullScreen ? "bold" : "normal"}
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
              const isHovered = hoveredCandle === candle;

              return (
                <g 
                  key={idx}
                  onMouseEnter={() => setHoveredCandle(candle)}
                  onMouseLeave={() => setHoveredCandle(null)}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                >
                  {/* Wicks */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth={
                      isHovered
                        ? "3"
                        : isFullScreen
                        ? Math.min(3.5, 2.2 * Math.sqrt(zoomLevel))
                        : Math.min(2.8, 1.6 * Math.sqrt(zoomLevel))
                    }
                  />

                  {/* Body: Green going up, Red going down */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    rx={zoomLevel >= 1.5 ? "2" : "0.5"}
                    stroke={isHovered ? "#FFFFFF" : "none"}
                    strokeWidth={isHovered ? "1.5" : "0"}
                  />

                  {/* Volume bar */}
                  <rect
                    x={x - candleWidth / 2}
                    y={volY}
                    width={candleWidth}
                    height={volBarHeight}
                    fill={candleColor}
                    opacity={isHovered ? "0.9" : "0.6"}
                    rx="0.5"
                  />
                </g>
              );
            })}

            {/* High & Low Price Markers when Zoomed In or in Full Screen */}
            {(zoomLevel >= 1.2 || isFullScreen) && highestCandleInfo && (
              <g transform={`translate(${Math.min(plotWidth - 55, Math.max(5, highestCandleInfo.x - 22))}, ${Math.max(12, highestCandleInfo.y - 14)})`}>
                <rect x="0" y="0" width="44" height="13" fill="#1E293B" rx="3" stroke="#00C26F" strokeWidth="0.8" />
                <text x="22" y="9.5" fill="#00C26F" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  H:{formatYPrice(highestCandleInfo.candle.high)}
                </text>
              </g>
            )}

            {(zoomLevel >= 1.2 || isFullScreen) && lowestCandleInfo && (
              <g transform={`translate(${Math.min(plotWidth - 55, Math.max(5, lowestCandleInfo.x - 22))}, ${Math.min(candleAreaHeight - 16, lowestCandleInfo.y + 3)})`}>
                <rect x="0" y="0" width="44" height="13" fill="#1E293B" rx="3" stroke="#E02B37" strokeWidth="0.8" />
                <text x="22" y="9.5" fill="#E02B37" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  L:{formatYPrice(lowestCandleInfo.candle.low)}
                </text>
              </g>
            )}
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
              strokeWidth={isFullScreen ? "3" : "2"}
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
              strokeWidth={isFullScreen ? "1.8" : "1.2"}
              strokeDasharray="4 3"
            />
            <g transform={`translate(${plotWidth}, ${currentY - (isFullScreen ? 12 : 10)})`}>
              <rect
                x="0"
                y="0"
                width={rightAxisWidth - 2}
                height={isFullScreen ? "24" : "20"}
                fill={activeDirectionColor}
                rx="4"
              />
              <text
                x={(rightAxisWidth - 2) / 2}
                y={isFullScreen ? "16.5" : "13.5"}
                fill="#FFFFFF"
                fontSize={isFullScreen ? "12" : "10"}
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
            fontSize={isFullScreen ? "12" : "9.5"}
            fontFamily="monospace"
            fontWeight={isFullScreen ? "bold" : "normal"}
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
