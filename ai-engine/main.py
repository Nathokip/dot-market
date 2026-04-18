"""
Dot Market AI Pro - Machine Learning Engine
Provides AI-powered predictions and sentiment analysis for stock trading
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import joblib

# ML Libraries
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from transformers import pipeline

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="Dot Market AI Engine",
    description="AI-powered stock prediction and sentiment analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PredictionRequest(BaseModel):
    symbol: str
    model: str = "lstm"  # lstm, gru, random_forest
    timeframe: str = "1d"  # 1d, 1w, 1mo
    historical_days: int = 90

class PredictionResponse(BaseModel):
    symbol: str
    model: str
    predicted_price: float
    confidence: float
    timeframe: str
    prediction_date: str
    features_used: List[str]

class SentimentRequest(BaseModel):
    text: str
    source: str = "general"  # twitter, news, reddit

class SentimentResponse(BaseModel):
    sentiment: str  # positive, neutral, negative
    score: float  # -1 to 1
    confidence: float

class BacktestRequest(BaseModel):
    symbol: str
    strategy: str
    start_date: str
    end_date: str
    initial_capital: float = 10000

# Model cache
models_cache: Dict = {}

def load_or_create_model(model_type: str, input_shape: int):
    """Load cached model or create new one"""
    if model_type in models_cache:
        return models_cache[model_type]
    
    if model_type == "lstm":
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=(input_shape, 1)),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mean_squared_error')
    
    elif model_type == "random_forest":
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
    
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    models_cache[model_type] = model
    return model

def fetch_stock_data(symbol: str, days: int = 365) -> pd.DataFrame:
    """Fetch real stock data from Yahoo Finance"""
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=f"{days}d")
        
        if df.empty:
            raise ValueError(f"No data found for symbol {symbol}")
        
        df = df.reset_index()
        df['date'] = pd.to_datetime(df['Date'])
        
        df['close'] = df['Close']
        df['sma_20'] = df['close'].rolling(20).mean()
        df['sma_50'] = df['close'].rolling(50).mean()
        df['rsi'] = calculate_rsi(df['close'], 14)
        df['macd'], df['signal'] = calculate_macd(df['close'])
        
        return df.dropna()
    
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch data for {symbol}: {str(e)}")

def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """Calculate Relative Strength Index"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(prices: pd.Series) -> Tuple[pd.Series, pd.Series]:
    """Calculate MACD"""
    exp1 = prices.ewm(span=12).mean()
    exp2 = prices.ewm(span=26).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9).mean()
    return macd, signal

def prepare_features(df: pd.DataFrame) -> np.ndarray:
    """Prepare features for ML model"""
    features = ['close', 'sma_20', 'sma_50', 'rsi', 'macd', 'volume']
    X = df[features].values
    
    # Normalize
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "Dot Market AI Engine"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    """Predict stock price using ML model"""
    try:
        logger.info(f"Predicting {request.symbol} using {request.model}")
        
        # Get data
        df = fetch_stock_data(request.symbol, request.historical_days)
        
        # Prepare features
        X = prepare_features(df)
        y = df['close'].values
        
        # Train/predict
        model = load_or_create_model(request.model, X.shape[1])
        
        if request.model == "lstm":
            # Reshape for LSTM (samples, timesteps, features)
            X_reshaped = X.reshape((X.shape[0], 1, X.shape[1]))
            
            # Use last 80% for training
            train_size = int(len(X_reshaped) * 0.8)
            X_train = X_reshaped[:train_size]
            y_train = y[:train_size]
            
            history = model.fit(X_train, y_train, epochs=10, verbose=0)
            
            # Predict next day
            predicted = model.predict(X_reshaped[-1:], verbose=0)[0][0]
        
        elif request.model == "random_forest":
            train_size = int(len(X) * 0.8)
            model.fit(X[:train_size], y[:train_size])
            predicted = model.predict(X[-1:].reshape(1, -1))[0]
        
        # Calculate confidence (0-1)
        last_price = y[-1]
        change_percent = abs(predicted - last_price) / last_price
        confidence = max(0, 1 - (change_percent * 0.5))
        
        return PredictionResponse(
            symbol=request.symbol,
            model=request.model,
            predicted_price=float(predicted),
            confidence=float(confidence),
            timeframe=request.timeframe,
            prediction_date=datetime.now().isoformat(),
            features_used=['close', 'sma_20', 'sma_50', 'rsi', 'macd', 'volume']
        )
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of text"""
    try:
        # Use transformers for sentiment analysis
        sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        
        result = sentiment_pipeline(request.text[:512])[0]
        
        # Convert to our format
        label_map = {
            "POSITIVE": ("positive", 1.0),
            "NEGATIVE": ("negative", -1.0),
            "NEUTRAL": ("neutral", 0.0)
        }
        
        sentiment_label = label_map.get(
            result["label"],
            ("neutral", 0.0)
        )
        
        return SentimentResponse(
            sentiment=sentiment_label[0],
            score=sentiment_label[1],
            confidence=result["score"]
        )
    
    except Exception as e:
        logger.error(f"Sentiment analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/backtest")
async def backtest_strategy(request: BacktestRequest):
    """Run backtest on strategy"""
    try:
        logger.info(f"Backtesting {request.symbol} with {request.strategy}")
        
        # Get historical data
        df = fetch_stock_data(request.symbol)
        
        # Apply strategy (simplified)
        signals = np.zeros(len(df))
        signals[df['sma_20'] > df['sma_50']] = 1
        signals[df['sma_20'] < df['sma_50']] = -1
        
        # Calculate returns
        returns = df['close'].pct_change().values
        strategy_returns = returns * signals[:-1]
        
        total_return = (1 + strategy_returns).prod() - 1
        max_drawdown = np.min(np.cumsum(strategy_returns))
        sharpe_ratio = np.mean(strategy_returns) / (np.std(strategy_returns) + 1e-6) * np.sqrt(252)
        
        num_trades = np.sum(np.diff(signals) != 0)
        wins = np.sum(strategy_returns > 0)
        win_rate = wins / num_trades if num_trades > 0 else 0
        
        return {
            "symbol": request.symbol,
            "strategy": request.strategy,
            "total_return": float(total_return),
            "max_drawdown": float(max_drawdown),
            "sharpe_ratio": float(sharpe_ratio),
            "num_trades": int(num_trades),
            "win_rate": float(win_rate),
            "backtest_date": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Backtest error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "prediction_models": ["lstm", "gru", "random_forest"],
        "sentiment_models": ["distilbert"],
        "technical_indicators": ["sma", "rsi", "macd", "bollinger_bands"]
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
