import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MetricsCards from "@/components/dashboard/MetricsCards";
import TradingChart from "@/components/dashboard/TradingChart";
import PredictionGauge from "@/components/dashboard/PredictionGauge";
import SentimentPanel from "@/components/dashboard/SentimentPanel";
import StocksTable from "@/components/dashboard/StocksTable";
import InsightsPanel from "@/components/dashboard/InsightsPanel";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Stock Market Prediction Dashboard</h1>
        <p className="text-sm text-muted-foreground">AI-driven insights and forecasts</p>
      </div>

      <MetricsCards />

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <TradingChart />
        </div>
        <div>
          <PredictionGauge />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <StocksTable />
        </div>
        <div>
          <SentimentPanel />
        </div>
      </div>

      <div className="mt-6">
        <InsightsPanel />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
