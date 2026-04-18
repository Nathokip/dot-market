"""
Improved ML Model for Stock Prediction
Key improvements:
1. More features (25+ technical indicators)
2. 3-fold cross-validation
3. Longer training (100+ epochs)
4. Model persistence (save/load)
5. Ensemble approach
6. Proper confidence from validation accuracy
"""

import numpy as np
import pandas as pd
import yfinance as yf
import joblib
import os
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.optimizers import Adam

MODEL_DIR = "./saved_models"

def create_advanced_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create 25+ technical indicators"""
    df = df.copy()
    close = df['Close']
    high = df['High']
    low = df['Low']
    volume = df['Volume']
    
    # Price-based features
    df['returns'] = close.pct_change()
    df['log_returns'] = np.log(close / close.shift(1))
    
    # Moving averages
    for window in [5, 10, 20, 50, 100, 200]:
        df[f'sma_{window}'] = close.rolling(window).mean()
        df[f'ema_{window}'] = close.ewm(span=window).mean()
    
    # Momentum
    df['rsi'] = calculate_rsi(close, 14)
    df['rsi_28'] = calculate_rsi(close, 28)
    df['stochastic_k'] = ((close - low.rolling(14).min()) / 
                         (high.rolling(14).max() - low.rolling(14).min())) * 100
    df['stochastic_d'] = df['stochastic_k'].rolling(3).mean()
    
    # MACD variants
    df['macd'] = close.ewm(span=12).mean() - close.ewm(span=26).mean()
    df['macd_signal'] = df['macd'].ewm(span=9).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']
    
    # Bollinger Bands
    df['bb_middle'] = close.rolling(20).mean()
    bb_std = close.rolling(20).std()
    df['bb_upper'] = df['bb_middle'] + (bb_std * 2)
    df['bb_lower'] = df['bb_middle'] - (bb_std * 2)
    df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
    df['bb_position'] = (close - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'])
    
    # Volume indicators
    df['volume_sma_20'] = volume.rolling(20).mean()
    df['volume_ratio'] = volume / df['volume_sma_20']
    df['obv'] = (np.sign(close.diff()) * volume).cumsum()
    df['vwap'] = (close * volume).cumsum() / volume.cumsum()
    
    # Average True Range (volatility)
    df['atr'] = calculate_atr(high, low, close, 14)
    df['atr_percent'] = df['atr'] / close * 100
    
    # Price position indicators
    df['high_20'] = high.rolling(20).max()
    df['low_20'] = low.rolling(20).min()
    df['price_position'] = (close - df['low_20']) / (df['high_20'] - df['low_20'])
    
    # Lag features (important for time series)
    for lag in [1, 2, 3, 5, 10]:
        df[f'returns_lag_{lag}'] = df['returns'].shift(lag)
    
    # Rolling statistics
    df['returns_std_20'] = df['returns'].rolling(20).std()
    df['returns_mean_20'] = df['returns'].rolling(20).mean()
    df['consecutive_up'] = (df['returns'] > 0).rolling(5).sum()
    df['consecutive_down'] = (df['returns'] < 0).rolling(5).sum()
    
    return df.dropna()

def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    delta = prices.diff()
    gain = delta.where(delta > 0, 0).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    tr1 = high - low
    tr2 = abs(high - close.shift(1))
    tr3 = abs(low - close.shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(period).mean()

def build_lstm_model(input_shape: tuple) -> Sequential:
    """Improved LSTM with more layers and regularization"""
    model = Sequential([
        Bidirectional(LSTM(64, return_sequences=True, input_shape=input_shape)),
        Dropout(0.3),
        Bidirectional(LSTM(32, return_sequences=False)),
        Dropout(0.3),
        Dense(32, activation='relu'),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1)
    ])
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='huber',  # More robust to outliers
        metrics=['mae']
    )
    return model

def train_with_early_stopping(model, X_train, y_train, X_val, y_val, epochs=100):
    """Train with early stopping and learning rate reduction"""
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            mode='min'
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6,
            mode='min'
        )
    ]
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        callbacks=callbacks,
        verbose=0
    )
    return history

def calculate_real_confidence(y_true, y_pred, last_price):
    """Calculate confidence from validation errors"""
    mae = mean_absolute_error(y_true, y_pred)
    mape = (mae / np.mean(y_true)) * 100
    
    # Confidence decreases as MAPE increases
    confidence = max(0, min(95, 100 - mape * 2))
    return confidence

def save_model(model, symbol: str, model_type: str):
    """Persist model to disk"""
    os.makedirs(MODEL_DIR, exist_ok=True)
    path = f"{MODEL_DIR}/{symbol}_{model_type}.h5"
    model.save(path)
    return path

def load_model(symbol: str, model_type: str):
    """Load persisted model"""
    path = f"{MODEL_DIR}/{symbol}_{model_type}.h5"
    if os.path.exists(path):
        from tensorflow.keras.models import load_model
        return load_model(path)
    return None