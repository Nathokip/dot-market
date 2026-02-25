# CryptoStream ML: Real-Time Price Prediction Dashboard

"Dot Market"

An end-to-end, real-time cryptocurrency tracking and machine learning prediction platform. This system ingests live WebSocket data from crypto exchanges, processes it through an LSTM neural network, and pushes both live prices and future trend predictions to a Vanilla JavaScript frontend via Django Channels.


## 🚀 Features
* **Real-Time Data Streaming:** Bypasses REST API rate limits by maintaining a persistent WebSocket connection to exchanges via `ccxt.pro`.
* **Live UI Updates:** Vanilla JS frontend consumes Django Channels WebSockets to render millisecond-accurate price ticks without page reloads.
* **Deep Learning Engine:** Utilizes a TensorFlow/Keras Long Short-Term Memory (LSTM) network to predict near-future price movements based on historical sequence patterns.
* **Asynchronous Backend:** Built on Django's ASGI interface, capable of handling thousands of concurrent WebSocket connections backed by a Redis message broker.

## 🛠️ Tech Stack
| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Lightweight Charts (TradingView) |
| **Backend** | Django, Django Channels (ASGI) |
| **Database/Broker** | SQLite / PostgreSQL, Redis |
| **Data Ingestion** | `ccxt` (async/pro) |
| **Machine Learning** | Python, TensorFlow/Keras, Pandas, Scikit-Learn |

---

## ⚙️ Prerequisites

Before you begin, ensure you have Python 3.8+ installed


## Clone the repository 
git clone https://github.com/Nathokip/dot-market.git
cd dot-market

## Set up the virtual environment
python3 -m venv .venv
source .venv/bin/activate

## Install dependencies
cd backend
pip install -r requirements.txt



