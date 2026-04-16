import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import "express-async-errors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// Initialize Express app
const app: Express = express();
const port = process.env.PORT || 3000;

// Initialize Prisma and Supabase
const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.get("/api/stocks", async (req: Request, res: Response) => {
  try {
    const stocks = await prisma.stock.findMany({
      take: 50,
      orderBy: { updatedAt: "desc" },
    });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
});

app.get("/api/stocks/:symbol", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await prisma.stock.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

app.post("/api/predictions", async (req: Request, res: Response) => {
  try {
    const { symbol, model = "lstm" } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required" });
    }

    // Call AI engine for predictions
    const prediction = await fetch(
      `${process.env.AI_ENGINE_URL || "http://localhost:8000"}/predict`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, model }),
      }
    ).then((r) => r.json());

    // Ensure stock exists or create it
    const stock = await prisma.stock.upsert({
      where: { symbol: symbol.toUpperCase() },
      update: {},
      create: {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        price: 0,
      },
    });

    // Store prediction in database
    const predictionData = prediction as { predicted_price?: number; confidence?: number; timeframe?: string };
    const storedPrediction = await prisma.prediction.create({
      data: {
        symbol: symbol.toUpperCase(),
        model,
        predictedPrice: predictionData.predicted_price || 0,
        confidence: predictionData.confidence || 0,
        timeframe: predictionData.timeframe || "1d",
        stock: { connect: { id: stock.id } },
      },
    });

    res.json(storedPrediction);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate prediction" });
  }
});

app.get("/api/market-sentiment/:symbol", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;

    const sentiment = await prisma.sentiment.findFirst({
      where: { symbol: symbol.toUpperCase() },
      orderBy: { createdAt: "desc" },
    });

    if (!sentiment) {
      return res.status(404).json({ error: "Sentiment data not found" });
    }

    res.json(sentiment);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sentiment" });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const start = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✓ Database connected");

    app.listen(port, () => {
      console.log(`✓ Server running on port ${port}`);
      console.log(`✓ Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

start();

export default app;
