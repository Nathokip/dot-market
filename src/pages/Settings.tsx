import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Profile</h3>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">First Name</label>
                <Input defaultValue="John" className="bg-muted border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Last Name</label>
                <Input defaultValue="Doe" className="bg-muted border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <Input defaultValue="trader@example.com" className="bg-muted border-border" />
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Notifications</h3>
          <div className="space-y-3">
            {['Price alerts', 'AI prediction updates', 'Portfolio changes', 'Market news'].map((item) => (
              <label key={item} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-foreground">{item}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-primary" />
              </label>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Subscription</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Free Plan</div>
              <div className="text-xs text-muted-foreground">5 predictions per day</div>
            </div>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
