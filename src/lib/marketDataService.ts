import { topStocks, generateCandlestickData } from "@/lib/mockData";

export interface StockQuote {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BatchQuote {
  ticker: string;
  price: number;
  change: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

async function callMarketData(params: Record<string, string>) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const queryString = new URLSearchParams(params).toString();
  const url = `${supabaseUrl}/functions/v1/market-data?${queryString}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const result = await callMarketData({ endpoint: 'quote', symbol });
    if (result.data) return result.data as StockQuote;
    return null;
  } catch (e) {
    console.warn(`fetchStockQuote(${symbol}) failed, using mock:`, e);
    return null;
  }
}

export async function fetchDailyCandles(symbol: string): Promise<CandleData[]> {
  try {
    const result = await callMarketData({ endpoint: 'daily', symbol });
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  } catch (e) {
    console.warn(`fetchDailyCandles(${symbol}) failed, using mock:`, e);
    return [];
  }
}

export async function fetchIntradayCandles(symbol: string): Promise<CandleData[]> {
  try {
    const result = await callMarketData({ endpoint: 'intraday', symbol });
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  } catch (e) {
    console.warn(`fetchIntradayCandles(${symbol}) failed, using mock:`, e);
    return [];
  }
}

export async function fetchBatchQuotes(symbols: string[]): Promise<BatchQuote[]> {
  try {
    const result = await callMarketData({ endpoint: 'batch', symbols: symbols.join(',') });
    if (result.data && Array.isArray(result.data)) return result.data;
    return [];
  } catch (e) {
    console.warn('fetchBatchQuotes failed, using mock:', e);
    return [];
  }
}

// Generate mock prediction from real price
export function generatePrediction(price: number) {
  const direction = Math.random() > 0.35 ? 1 : -1;
  const magnitude = price * (0.005 + Math.random() * 0.025);
  const predicted = +(price + direction * magnitude).toFixed(2);
  const confidence = Math.floor(70 + Math.random() * 25);
  const trend = predicted > price ? 'bullish' as const : 'bearish' as const;
  return { predicted, confidence, trend };
}
