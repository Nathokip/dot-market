import { motion } from "framer-motion";
import { Brain, BarChart3, Newspaper, Signal } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Price Prediction",
    description: "Deep learning models forecast future stock prices with up to 94% accuracy using LSTM and Random Forest.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Market Analytics",
    description: "Live stock data with advanced candlestick charting, technical indicators, and volume analysis.",
  },
  {
    icon: Newspaper,
    title: "Sentiment Analysis",
    description: "AI scans financial news and social media using FinBERT to gauge market sentiment in real-time.",
  },
  {
    icon: Signal,
    title: "Smart Trading Signals",
    description: "Automated BUY / SELL / HOLD recommendations based on multi-model consensus and confidence scoring.",
  },
];

const Features = () => {
  return (
    <section className="py-32 relative">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gradient-primary">Powerful</span> Trading Intelligence
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to make data-driven trading decisions powered by artificial intelligence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 group hover:neon-border transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:glow-primary transition-shadow">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
