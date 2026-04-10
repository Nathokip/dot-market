import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic predictions",
    features: ["5 stock predictions/day", "Basic charting", "Market overview", "Email alerts"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Unlimited predictions & portfolio tracking",
    features: ["Unlimited predictions", "Portfolio tracking", "Advanced analytics", "Sentiment analysis", "Priority support", "API access (100 calls/day)"],
    cta: "Start Pro Trial",
    featured: true,
  },
  {
    name: "Institutional",
    price: "$299",
    period: "/month",
    description: "Full AI model access & enterprise features",
    features: ["Everything in Pro", "Full AI model access", "Unlimited API access", "Custom model training", "Backtesting engine", "Dedicated support", "White-label option"],
    cta: "Contact Sales",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-32 relative" id="pricing">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent <span className="text-gradient-primary">Pricing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your trading needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-xl p-8 ${
                plan.featured
                  ? "neon-border bg-card/80 scale-105"
                  : "glass-card"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <Link to="/register">
                <Button
                  className={`w-full h-12 font-semibold ${
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
              <div className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
