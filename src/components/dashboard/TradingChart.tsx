import { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";
import { generateCandlestickData } from "@/lib/mockData";

const timeFilters = ["1D", "1W", "1M", "3M", "1Y"] as const;
const filterDays: Record<string, number> = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };

const TradingChart = () => {
  const [activeFilter, setActiveFilter] = useState<string>("3M");
  const [data, setData] = useState(() => generateCandlestickData(365));

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev];
        const last = { ...newData[newData.length - 1] };
        const delta = (Math.random() - 0.48) * 1.5;
        last.close = +(last.close + delta).toFixed(2);
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.prediction = +(last.close + (Math.random() - 0.3) * 3).toFixed(2);
        last.volume = Math.floor(last.volume + (Math.random() - 0.5) * 2000000);
        newData[newData.length - 1] = last;
        return newData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    const days = filterDays[activeFilter];
    return data.slice(-days).map(d => ({
      ...d,
      // For candlestick-like bars
      bodyTop: Math.max(d.open, d.close),
      bodyBottom: Math.min(d.open, d.close),
      bodyHeight: Math.abs(d.close - d.open),
      isUp: d.close >= d.open,
    }));
  }, [data, activeFilter]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">AAPL — Apple Inc.</h3>
          <p className="text-sm text-muted-foreground">Real-time chart with AI prediction overlay</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {timeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={filteredData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 15%)" />
          <XAxis dataKey="date" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(225, 35%, 10%)',
              border: '1px solid hsl(225, 20%, 18%)',
              borderRadius: '8px',
              color: 'hsl(210, 40%, 96%)',
            }}
            formatter={(value: number, name: string) => [
              `$${value.toFixed(2)}`,
              name === 'prediction' ? 'AI Prediction' : name.charAt(0).toUpperCase() + name.slice(1)
            ]}
          />

          {/* Volume bars at bottom */}
          <Bar dataKey="volume" yAxisId="volume" fill="hsl(195, 100%, 50%)" opacity={0.1} />

          {/* Candlestick body as bars */}
          <Bar dataKey="bodyHeight" stackId="candle" fill="transparent">
            {filteredData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isUp ? 'hsl(145, 70%, 50%)' : 'hsl(0, 100%, 65%)'}
                opacity={0.8}
              />
            ))}
          </Bar>

          {/* Close price line */}
          <Line type="monotone" dataKey="close" stroke="hsl(210, 40%, 96%)" strokeWidth={1.5} dot={false} />

          {/* AI prediction line */}
          <Line
            type="monotone"
            dataKey="prediction"
            stroke="hsl(195, 100%, 50%)"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
          />

          {/* Hidden Y axis for volume */}
          <YAxis yAxisId="volume" orientation="right" hide domain={[0, (d: number) => d * 8]} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-foreground" />
          <span>Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-primary" style={{ borderBottom: '2px dashed hsl(195, 100%, 50%)' }} />
          <span>AI Prediction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-bullish/80" />
          <span>Bullish</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-bearish/80" />
          <span>Bearish</span>
        </div>
      </div>
    </div>
  );
};

export default TradingChart;
