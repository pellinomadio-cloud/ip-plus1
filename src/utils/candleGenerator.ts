import { Candle } from '../types';

export function generateInitialCandles(basePrice: number, count: number = 32): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const stepMs = 60 * 1000; // 1-minute candles

  const isForex = basePrice < 2;
  const volatility = isForex ? 0.00015 : basePrice * 0.0008;

  // Start with a price slightly offset
  let currentClose = isForex ? basePrice - 0.0014 : basePrice * 0.985;

  for (let i = count; i >= 0; i--) {
    const time = now - i * stepMs;
    const date = new Date(time);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeLabel = `${hours}:${minutes}`;

    const open = currentClose;
    // Organic wave variation to give authentic green up and red down candles
    const wave = Math.sin((count - i) * 0.45);
    const delta = (wave * 0.7 + (Math.random() - 0.48)) * volatility * 1.8;

    let close = i === 0 ? basePrice : open + delta;
    close = Number(close.toFixed(isForex ? 5 : 2));

    const highDelta = Math.random() * volatility * 1.2;
    const lowDelta = Math.random() * volatility * 1.2;

    const high = Number(Math.max(open, close, Math.max(open, close) + highDelta).toFixed(isForex ? 5 : 2));
    const low = Number(Math.min(open, close, Math.min(open, close) - lowDelta).toFixed(isForex ? 5 : 2));
    const volume = Math.floor(25 + Math.random() * 75);

    candles.push({
      time,
      timeLabel,
      open,
      high,
      low,
      close,
      volume
    });

    currentClose = close;
  }

  return candles;
}

export function updateCandlesWithPrice(prevCandles: Candle[], newPrice: number): Candle[] {
  if (prevCandles.length === 0) return generateInitialCandles(newPrice);

  const updated = [...prevCandles];
  const lastIndex = updated.length - 1;
  const last = updated[lastIndex];
  const isForex = newPrice < 2;
  const precision = isForex ? 5 : 2;

  const now = Date.now();
  const candleAge = now - last.time;

  // If the active candle has exceeded 60 seconds (or 15 ticks), create a new candle starting exactly at the previous close
  if (candleAge > 60000 || last.volume > 24) {
    const date = new Date(now);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeLabel = `${hours}:${minutes}`;

    const newCandle: Candle = {
      time: now,
      timeLabel,
      open: last.close,
      high: Number(Math.max(last.close, newPrice).toFixed(precision)),
      low: Number(Math.min(last.close, newPrice).toFixed(precision)),
      close: Number(newPrice.toFixed(precision)),
      volume: 1
    };

    // Keep fixed window length
    return [...updated.slice(1), newCandle];
  }

  // Otherwise update current active candle
  const updatedLast: Candle = {
    ...last,
    close: Number(newPrice.toFixed(precision)),
    high: Number(Math.max(last.high, newPrice).toFixed(precision)),
    low: Number(Math.min(last.low, newPrice).toFixed(precision)),
    volume: last.volume + 1
  };

  updated[lastIndex] = updatedLast;
  return updated;
}
