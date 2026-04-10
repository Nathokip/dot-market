import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-dashboard.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-sm text-primary font-medium">AI-Powered Market Intelligence</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="text-foreground">Predict the Market with </span>
              <span className="text-gradient-primary">Artificial Intelligence</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
              Machine learning powered analytics that forecast stock prices, detect trends, and deliver trading insights in real-time.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary px-8 h-14 text-base font-semibold">
                  Start Predicting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="border-border hover:bg-muted px-8 h-14 text-base font-semibold">
                  <Play className="mr-2 h-5 w-5" />
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-12 mt-14">
              {[
                { value: '94%', label: 'Prediction Accuracy' },
                { value: '10K+', label: 'Active Traders' },
                { value: '$2.4B', label: 'Assets Analyzed' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right - Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden neon-border">
              <img src={heroImg} alt="DOT-MARKET Trading Dashboard" className="w-full rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
            {/* Floating card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 glass-card-strong p-4 glow-bullish"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bullish/20 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-bullish rotate-[-45deg]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">AAPL</div>
                  <div className="text-xs text-bullish font-medium">+2.41% • BUY Signal</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
