import { motion } from "framer-motion";
import { Database, Cpu, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Database,
    step: "01",
    title: "Connect Market Data",
    description: "Link real-time feeds from major exchanges. We aggregate data from multiple sources for comprehensive coverage.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Analyzes Patterns",
    description: "Our LSTM, Random Forest, and Prophet models process historical and live data to detect patterns and trends.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Receive Predictions",
    description: "Get actionable predictions with confidence scores, trading signals, and risk assessments delivered in real-time.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            How <span className="text-gradient-primary">DOT-MARKET</span> Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to unlock AI-powered market intelligence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="glass-card p-8 text-center h-full">
                <div className="text-6xl font-black text-primary/10 mb-4">{step.step}</div>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
