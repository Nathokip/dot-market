import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";

const accuracyData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  accuracy: 85 + Math.random() * 10,
}));

const featureImportance = [
  { name: 'Price History', value: 32 },
  { name: 'Volume', value: 22 },
  { name: 'RSI', value: 18 },
  { name: 'MACD', value: 14 },
  { name: 'Sentiment', value: 9 },
  { name: 'Volatility', value: 5 },
];

const AIInsights = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
        <p className="text-sm text-muted-foreground">Model performance, feature importance, and training analytics</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Model Accuracy */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Model Accuracy (30 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 15%)" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis domain={[80, 100]} tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: 'hsl(225, 35%, 10%)', border: '1px solid hsl(225, 20%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
              <Line type="monotone" dataKey="accuracy" stroke="hsl(195, 100%, 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Feature Importance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={featureImportance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 20%, 15%)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: 'hsl(225, 35%, 10%)', border: '1px solid hsl(225, 20%, 18%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
              <Bar dataKey="value" fill="hsl(195, 100%, 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model details */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { name: 'LSTM Neural Network', accuracy: '92.4%', status: 'Active', epochs: 150 },
          { name: 'Random Forest', accuracy: '89.1%', status: 'Active', trees: 500 },
          { name: 'Prophet Time-Series', accuracy: '86.7%', status: 'Active', horizon: '30d' },
        ].map((model) => (
          <div key={model.name} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">{model.name}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-bullish/20 text-bullish">{model.status}</span>
            </div>
            <div className="text-2xl font-bold text-primary mb-1">{model.accuracy}</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AIInsights;
