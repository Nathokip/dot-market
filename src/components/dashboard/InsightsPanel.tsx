import { technicalIndicators } from "@/lib/mockData";

const InsightsPanel = () => {
  const ti = technicalIndicators;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">AI Insights & Indicators</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">RSI (14)</div>
          <div className="text-lg font-bold text-foreground">{ti.rsi}</div>
          <div className={`text-xs font-medium ${ti.rsi > 70 ? 'text-bearish' : ti.rsi < 30 ? 'text-bullish' : 'text-primary'}`}>
            {ti.rsi > 70 ? 'Overbought' : ti.rsi < 30 ? 'Oversold' : 'Neutral'}
          </div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">MACD</div>
          <div className="text-lg font-bold text-bullish">+{ti.macd.histogram.toFixed(2)}</div>
          <div className="text-xs text-bullish font-medium">Bullish Cross</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
          <div className="text-lg font-bold text-primary">Medium</div>
          <div className="text-xs text-muted-foreground">Volatility: {ti.volatility}%</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">AI Signal</div>
          <div className="text-lg font-bold text-bullish">BUY</div>
          <div className="text-xs text-muted-foreground">Strong consensus</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">SMA (20)</span>
          <span className="text-foreground">${ti.sma20}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">SMA (50)</span>
          <span className="text-foreground">${ti.sma50}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bollinger Upper</span>
          <span className="text-foreground">${ti.bollingerUpper}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bollinger Lower</span>
          <span className="text-foreground">${ti.bollingerLower}</span>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
