import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const generateBacktestData = () => {
  const data = [];
  let actual = 150;
  let predicted = 150;
  for (let i = 0; i < 60; i++) {
    actual += (Math.random() - 0.48) * 3;
    predicted = actual + (Math.random() - 0.5) * 6;
    data.push({
      day: `Day ${i + 1}`,
      actual: +actual.toFixed(2),
      predicted: +predicted.toFixed(2),
    });
  }
  return data;
};

const Backtesting = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [model, setModel] = useState("LSTM");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof generateBacktestData> | null>(null);

  const runBacktest = () => {
    setRunning(true);
    setTimeout(() => {
      setResults(generateBacktestData());
      setRunning(false);
    }, 1500);
  };

  const stats = useMemo(() => {
    if (!results) return null;
    const errors = results.map(d => Math.abs(d.actual - d.predicted) / d.actual);
    const mape = (errors.reduce((s, e) => s + e, 0) / errors.length * 100).toFixed(2);
    const profitable = results.filter((d, i) => {
      if (i === 0) return false;
      const predictedUp = d.predicted > results[i - 1].predicted;
      const actualUp = d.actual > results[i - 1].actual;
      return predictedUp === actualUp;
    }).length;
    const winRate = ((profitable / (results.length - 1)) * 100).toFixed(1);
    return { mape, winRate, trades: results.length - 1 };
  }, [results]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Backtesting</h1>
        <p className="text-sm text-muted-foreground">Test AI models on historical data</p>
      </div>

      <div className="glass-card p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Configuration</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Stock Symbol</label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className="h-10 bg-muted border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
            <Input type="date" defaultValue="2024-01-01" className="h-10 bg-muted border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full h-10 bg-muted border border-border rounded-lg px-3 text-sm text-foreground"
            >
              <option value="LSTM">LSTM Neural Network</option>
              <option value="RF">Random Forest</option>
              <option value="Prophet">Prophet</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={runBacktest}
              disabled={running}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {running ? "Running..." : "Run Backtest"}
            </Button>
          </div>
        </div>
      </div>

      {results && (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-5">
              <div className="text-sm text-muted-foreground">MAPE (Error)</div>
              <div className="text-2xl font-bold text-foreground">{stats?.mape}%</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-2xl font-bold text-bullish">{stats?.winRate}%</div>
            </div>
            <div className="glass-card p-5">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-2xl font-bold text-foreground">{stats?.trades}</div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Predicted vs Actual — {symbol}</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={results}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 15%)" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} interval={9} />
                <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(225, 35%, 10%)', border: '1px solid hsl(225, 20%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
                <Line type="monotone" dataKey="actual" stroke="hsl(210, 40%, 96%)" strokeWidth={2} dot={false} name="Actual" />
                <Line type="monotone" dataKey="predicted" stroke="hsl(195, 100%, 50%)" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Predicted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Backtesting;
