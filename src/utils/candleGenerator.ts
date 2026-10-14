import { Candle } from '../types';

const STORAGE_KEY_CANDLE_HISTORY = 'iq_plus_persistent_candles';

type SymbolCandleStore = Record<string, Candle[]>;

function getStoredCandleStore(): SymbolCandleStore {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CANDLE_HISTORY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveStoredCandleStore(store: SymbolCandleStore): void {
  try {
    localStorage.setItem(STORAGE_KEY_CANDLE_HISTORY, JSON.stringify(store));
  } catch (e) {
    console.warn('Failed to save persistent candles:', e);
  }
}

export function generateInitialCandles(basePrice: number, count: number = 42): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const stepMs = 60 * 1000; // 1-minute candles

  const isForex = basePrice < 2;
  const volatility = isForex ? 0.00015 : basePrice * 0.0008;

  let currentClose = isForex ? basePrice - 0.0014 : basePrice * 0.985;

  for (let i = count; i >= 0; i--) {
    const time = now - i * stepMs;
    const date = new Date(time);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeLabel = `${hours}:${minutes}`;

    const open = currentClose;
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

/**
 * Retrieves persistent candles for a given market asset symbol.
 * If none exist, generates initial candles and persists them.
 * If stored candles exist, bridges any time gap so candles move forward seamlessly.
 */
export function getPersistentCandles(symbol: string, currentPrice: number): Candle[] {
  const store = getStoredCandleStore();
  const existing = store[symbol];

  if (!existing || existing.length === 0) {
    const fresh = generateInitialCandles(currentPrice, 42);
    store[symbol] = fresh;
    saveStoredCandleStore(store);
    return fresh;
  }

  const now = Date.now();
  const lastCandle = existing[existing.length - 1];
  const elapsedMs = now - lastCandle.time;
  const missedMinutes = Math.floor(elapsedMs / 60000);

  // Catch up missed minutes if app was closed or market was unselected
  if (missedMinutes > 0) {
    const isForex = currentPrice < 2;
    const precision = isForex ? 5 : 2;
    const updated = [...existing];
    let prevClose = lastCandle.close;

    // Bridge up to max 25 catchup candles
    const catchupSteps = Math.min(missedMinutes, 25);
    const startOffsetMinutes = catchupSteps;

    for (let i = startOffsetMinutes; i > 0; i--) {
      const stepTime = now - i * 60000;
      const date = new Date(stepTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      const open = prevClose;
      const progress = (startOffsetMinutes - i + 1) / startOffsetMinutes;
      const targetClose = open + (currentPrice - open) * progress;
      const wiggle = (Math.random() - 0.48) * (isForex ? 0.0001 : currentPrice * 0.0004);
      const close = Number((targetClose + wiggle).toFixed(precision));

      const high = Number(Math.max(open, close, open + (isForex ? 0.0001 : currentPrice * 0.0003)).toFixed(precision));
      const low = Number(Math.min(open, close, open - (isForex ? 0.0001 : currentPrice * 0.0003)).toFixed(precision));

      updated.push({
        time: stepTime,
        timeLabel: `${hours}:${minutes}`,
        open,
        high,
        low,
        close,
        volume: Math.floor(20 + Math.random() * 50)
      });

      prevClose = close;
    }

    // Keep last 90 candles
    const trimmed = updated.slice(Math.max(0, updated.length - 90));
    store[symbol] = trimmed;
    saveStoredCandleStore(store);
    return trimmed;
  }

  return existing;
}

/**
 * Updates persistent candles with a new tick price for a symbol.
 */
export function updatePersistentCandlesWithPrice(
  symbol: string,
  newPrice: number,
  existingCandles?: Candle[]
): Candle[] {
  const store = getStoredCandleStore();
  const currentList = existingCandles && existingCandles.length > 0 
    ? existingCandles 
    : (store[symbol] || getPersistentCandles(symbol, newPrice));

  const isForex = newPrice < 2;
  const precision = isForex ? 5 : 2;

  const updated = [...currentList];
  const lastIndex = updated.length - 1;
  const last = updated[lastIndex];

  const now = Date.now();
  const candleAge = now - last.time;

  if (candleAge > 60000 || last.volume > 28) {
    const date = new Date(now);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const newCandle: Candle = {
      time: now,
      timeLabel: `${hours}:${minutes}`,
      open: last.close,
      high: Number(Math.max(last.close, newPrice).toFixed(precision)),
      low: Number(Math.min(last.close, newPrice).toFixed(precision)),
      close: Number(newPrice.toFixed(precision)),
      volume: 1
    };

    const nextList = [...updated, newCandle].slice(-90);
    store[symbol] = nextList;
    saveStoredCandleStore(store);
    return nextList;
  }

  const updatedLast: Candle = {
    ...last,
    close: Number(newPrice.toFixed(precision)),
    high: Number(Math.max(last.high, newPrice).toFixed(precision)),
    low: Number(Math.min(last.low, newPrice).toFixed(precision)),
    volume: last.volume + 1
  };

  updated[lastIndex] = updatedLast;
  store[symbol] = updated;
  saveStoredCandleStore(store);
  return updated;
}

/**
 * Records a completed trade outcome directly onto the persistent candle store for an asset.
 */
export function recordTradeResultOnCandles(symbol: string, closePrice: number): void {
  const store = getStoredCandleStore();
  const list = store[symbol] || getPersistentCandles(symbol, closePrice);

  if (list.length === 0) return;

  const isForex = closePrice < 2;
  const precision = isForex ? 5 : 2;
  const updated = [...list];
  const lastIndex = updated.length - 1;
  const last = updated[lastIndex];

  const updatedActive: Candle = {
    ...last,
    close: Number(closePrice.toFixed(precision)),
    high: Number(Math.max(last.high, closePrice).toFixed(precision)),
    low: Number(Math.min(last.low, closePrice).toFixed(precision)),
    volume: last.volume + 2
  };

  updated[lastIndex] = updatedActive;
  store[symbol] = updated;
  saveStoredCandleStore(store);
}
