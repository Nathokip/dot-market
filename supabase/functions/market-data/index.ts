const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Yahoo Finance chart API (free, no key needed)
async function fetchYahooCandles(symbol: string, range: string, interval: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&includePrePost=false`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result || !result.timestamp) return null;

  const quotes = result.indicators.quote[0];
  return result.timestamp.map((ts: number, i: number) => ({
    date: interval === '1d'
      ? new Date(ts * 1000).toISOString().slice(0, 10)
      : new Date(ts * 1000).toISOString(),
    open: quotes.open[i],
    high: quotes.high[i],
    low: quotes.low[i],
    close: quotes.close[i],
    volume: quotes.volume[i],
  })).filter((c: any) => c.open != null && c.close != null);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('FINNHUB_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'FINNHUB_API_KEY not configured' }, 500);
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'quote';
    const symbol = url.searchParams.get('symbol') || 'AAPL';

    switch (endpoint) {
      case 'quote': {
        const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${apiKey}`);
        const q = await res.json();
        if (!q || q.c === 0) {
          return jsonResponse({ error: 'No data for symbol', data: null }, 404);
        }
        return jsonResponse({
          data: {
            ticker: symbol,
            price: q.c,
            open: q.o,
            high: q.h,
            low: q.l,
            previousClose: q.pc,
            change: q.d,
            changePercent: q.dp,
            volume: 0,
          },
          source: 'finnhub',
        });
      }

      case 'daily': {
        const candles = await fetchYahooCandles(symbol, '1y', '1d');
        if (!candles || candles.length === 0) {
          return jsonResponse({ error: 'No daily data available', data: null, fallback: true });
        }
        return jsonResponse({ data: candles, source: 'yahoo' });
      }

      case 'intraday': {
        const candles = await fetchYahooCandles(symbol, '1d', '5m');
        if (!candles || candles.length === 0) {
          return jsonResponse({ error: 'No intraday data available', data: null, fallback: true });
        }
        return jsonResponse({ data: candles, source: 'yahoo' });
      }

      case 'batch': {
        const symbols = (url.searchParams.get('symbols') || 'AAPL,MSFT,GOOGL').split(',').slice(0, 10);
        const results = [];
        for (const sym of symbols) {
          const s = sym.trim();
          const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${s}&token=${apiKey}`);
          const q = await res.json();
          if (q && q.c !== 0) {
            results.push({
              ticker: s,
              price: q.c,
              change: q.dp,
              volume: 0,
              high: q.h,
              low: q.l,
              open: q.o,
              previousClose: q.pc,
            });
          }
          await new Promise(r => setTimeout(r, 100));
        }
        return jsonResponse({ data: results, source: 'finnhub' });
      }

      default:
        return jsonResponse({ error: `Unknown endpoint: ${endpoint}` }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Market data error:', message);
    return jsonResponse({ error: message }, 500);
  }
});
