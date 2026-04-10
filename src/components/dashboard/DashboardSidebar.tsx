import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Globe, Brain, Briefcase, Lightbulb,
  History, Settings, Zap, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Globe, label: "Market Overview", path: "/market" },
  { icon: Brain, label: "Predictions", path: "/predictions" },
  { icon: Briefcase, label: "Portfolio", path: "/portfolio" },
  { icon: Lightbulb, label: "AI Insights", path: "/insights" },
  { icon: History, label: "Backtesting", path: "/backtesting" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 flex-shrink-0`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-sm">D</span>
        </div>
        {!collapsed && <span className="ml-3 text-lg font-bold text-foreground">DOT-MARKET</span>}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
          <Zap className="h-5 w-5 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground mb-1">Upgrade to Pro</p>
          <p className="text-xs text-muted-foreground mb-3">Unlock unlimited predictions</p>
          <Link
            to="/register"
            className="block text-center text-xs font-semibold bg-primary text-primary-foreground rounded-lg py-2 hover:bg-primary/90 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-4 flex items-center justify-center h-8 rounded-lg bg-sidebar-accent text-sidebar-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};

export default DashboardSidebar;
