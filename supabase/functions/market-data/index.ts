const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint') || 'quote';
    const symbol = url.searchParams.get('symbol') || 'AAPL';

    let avUrl: string;

    switch (endpoint) {
      case 'quote':
        avUrl = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'intraday':
        avUrl = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&outputsize=full&apikey=${apiKey}`;
        break;
      case 'daily':
        avUrl = `${ALPHA_VANTAGE_BASE}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${apiKey}`;
        break;
      case 'overview':
        avUrl = `${ALPHA_VANTAGE_BASE}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
        break;
      case 'search':
        const keywords = url.searchParams.get('keywords') || symbol;
        avUrl = `${ALPHA_VANTAGE_BASE}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${apiKey}`;
        break;
      case 'batch':
        // Fetch quotes for multiple symbols
        const symbols = url.searchParams.get('symbols') || 'AAPL,MSFT,GOOGL';
        const batchResults = [];
        for (const sym of symbols.split(',').slice(0, 8)) {
          const batchUrl = `${ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE&symbol=${sym.trim()}&apikey=${apiKey}`;
          const batchRes = await fetch(batchUrl);
          const batchData = await batchRes.json();
          if (batchData['Global Quote'] && batchData['Global Quote']['01. symbol']) {
            const q = batchData['Global Quote'];
            batchResults.push({
              ticker: q['01. symbol'],
              price: parseFloat(q['05. price']),
              change: parseFloat(q['10. change percent']?.replace('%', '') || '0'),
              volume: parseInt(q['06. volume'] || '0'),
              high: parseFloat(q['03. high'] || '0'),
              low: parseFloat(q['04. low'] || '0'),
              open: parseFloat(q['02. open'] || '0'),
              previousClose: parseFloat(q['08. previous close'] || '0'),
            });
          }
          // Small delay to respect rate limits
          await new Promise(r => setTimeout(r, 250));
        }
        return new Response(JSON.stringify({ data: batchResults, source: 'alpha_vantage' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const response = await fetch(avUrl);
    const data = await response.json();

    // Check for API error/rate limit
    if (data['Note'] || data['Information']) {
      return new Response(JSON.stringify({ 
        error: 'rate_limited', 
        message: data['Note'] || data['Information'],
        data: null 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform data based on endpoint
    let transformed;
    switch (endpoint) {
      case 'quote': {
        const q = data['Global Quote'];
        if (!q || !q['01. symbol']) {
          return new Response(JSON.stringify({ error: 'Invalid symbol or no data', data: null }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        transformed = {
          ticker: q['01. symbol'],
          price: parseFloat(q['05. price']),
          open: parseFloat(q['02. open']),
          high: parseFloat(q['03. high']),
          low: parseFloat(q['04. low']),
          volume: parseInt(q['06. volume']),
          previousClose: parseFloat(q['08. previous close']),
          change: parseFloat(q['09. change']),
          changePercent: parseFloat(q['10. change percent']?.replace('%', '') || '0'),
        };
        break;
      }
      case 'daily': {
        const timeSeries = data['Time Series (Daily)'];
        if (!timeSeries) {
          return new Response(JSON.stringify({ error: 'No daily data available', data: null }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        transformed = Object.entries(timeSeries).slice(0, 100).map(([date, values]: [string, any]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        })).reverse();
        break;
      }
      case 'intraday': {
        const timeSeries = data['Time Series (5min)'];
        if (!timeSeries) {
          return new Response(JSON.stringify({ error: 'No intraday data available', data: null }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        transformed = Object.entries(timeSeries).slice(0, 78).map(([datetime, values]: [string, any]) => ({
          date: datetime,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
        })).reverse();
        break;
      }
      case 'overview':
        transformed = data;
        break;
      default:
        transformed = data;
    }

    return new Response(JSON.stringify({ data: transformed, source: 'alpha_vantage' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Market data error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
