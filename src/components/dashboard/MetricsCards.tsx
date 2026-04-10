import { DollarSign, TrendingUp, Target, BarChart3 } from "lucide-react";

const metrics = [
  {
    label: "Current Price",
    value: "$182.40",
    change: "+2.41%",
    positive: true,
    icon: DollarSign,
    sub: "AAPL",
  },
  {
    label: "Predicted Price",
    value: "$186.80",
    change: "+2.41%",
    positive: true,
    icon: TrendingUp,
    sub: "24h forecast",
  },
  {
    label: "Prediction Confidence",
    value: "94%",
    change: "+1.2%",
    positive: true,
    icon: Target,
    sub: "Model accuracy",
  },
  {
    label: "Market Sentiment",
    value: "Bullish",
    change: "58% positive",
    positive: true,
    icon: BarChart3,
    sub: "FinBERT score",
  },
];

const MetricsCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div key={m.label} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">{m.label}</span>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <m.icon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">{m.value}</div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${m.positive ? 'text-bullish' : 'text-bearish'}`}>
              {m.change}
            </span>
            <span className="text-xs text-muted-foreground">{m.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;
