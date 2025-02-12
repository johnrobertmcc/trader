# Trading CLI Tool

Author: J.R. McCann  
Date: 5/31/2024

## Purpose

The purpose of this tool is to help automate some of the math heavy calculations used in typical market watching strategies.

## Strategy

The workflow is as below:

#### Scrape

Using Puppeteer, provided watchlists and news sources are scraped and symbols sanitized for analysis.

#### Check the 7-day trends

Once a list of trending symbols are gathered, historical data of the last 7 days is pulled from Yahoo! Finance. This
data is then used to calculate three separate points that indicate an uptrend:

- Relative Strength Index (RSI). This is used to determine how saturated an individual asset is.
- Moving Average (MA). This is used to give indication on when to buy or sell a particular asset.
- Slope. This is used to determine the current trajectory of an individual asset.

To determine an uptrend, these criteria are evaluated:

- RSI Below 70 (and ideally above 30).
- A positive slope.

#### Drop into a lower timeframe

If everything in the higher timeframe (7 days default) indicates an uptrend, live prices are pulled from Finnhub. These
prices are then plotted using `ascii-chart`.

As the current price is being pulled (every ten seconds), the RSI and MA are being recalculated to help offer guidance on when
to buy or sell.

#### Create an order using CLI

Using the CLI tools provided in `buy.mjs` and `sell.mjs` and with the help of `inquirer`, orders are created. Once the order is confirmed,
it is posted via Alpaca.

## Tech Stack

- Alpaca. This is used to to store watchlist and to help facilitate buying and selling assets.
- Finnhub. This is used to get real-time price updates for plotting a low-timeframe graph.
- Yahoo! Finance. This is used mainly to cross-reference asks and market type, as well as for historical data.
- Ascii Chart. This is used to plot live graphs in `graph.mjs` made available in node given a symbol.
- Pupeeter. This is used to scrape data from news sources to look for trending symbols.
- Inquirer. This is used to help write CLI options and confirmations.

## Setup

Two API keys are needed:

- Finnhub (account required)
- Alpaca (account required)

`.env` sample:

```
ALPACA_API_KEY='key'

ALPACA_API_SECRET='secret'

PAPER='true|false' // Used for Alpaca.

RISK='10' // Used in calculations to determine how much you are willing to spend.

FINNHUB_API_KEY=''
```
