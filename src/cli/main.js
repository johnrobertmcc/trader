import { writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { config } from "dotenv";
import yahooFinance from "yahoo-finance2";
import { exec } from "child_process";
import { confirm, checkbox, Separator } from "@inquirer/prompts";
import {
  drawSnapshot,
  createTodaysFilename,
  scrapeYahooData,
  scrapeBenzinga,
  determineAppropriateStocks,
  PENNY_SCRAPER,
  FIFTYTWO_WEEK_GAINS,
} from "../shared/utils/index.js";

config();

const HISTORICAL_DIR = path.join(process.cwd(), "tests", "historical");
const HISTORICAL_FILE = path.join(
  HISTORICAL_DIR,
  `eligible-${createTodaysFilename()}.json`
);
const CLI_DIR = path.join(process.cwd(), "src", "cli");

/**
 * Load historical stock data if available.
 * @returns {Array|undefined} Returns historical data if it exists, otherwise undefined.
 */
function loadHistoricalData() {
  if (existsSync(HISTORICAL_FILE)) {
    console.log("Loading historical data...\n");
    return JSON.parse(readFileSync(HISTORICAL_FILE, "utf8"));
  }
  return undefined;
}

/**
 * Scrapes stock data from multiple sources.
 * @returns {Promise<Array>} List of stock symbols.
 */
async function scrapeStockData() {
  console.log("Scraping...\n");
  const stockData = [
    ...(await scrapeYahooData(PENNY_SCRAPER)),
    ...(await scrapeYahooData(FIFTYTWO_WEEK_GAINS)),
    ...(await scrapeBenzinga()),
  ];
  console.log(`Found ${stockData.length} assets, analyzing...\n`);
  return stockData;
}

/**
 * Fetches the latest stock quotes for each asset.
 * @param {Array} actionableStocks Stocks filtered for trading.
 * @returns {Promise<Array>} List of stocks with quote data.
 */
async function fetchStockQuotes(actionableStocks = []) {
  return Promise.all(
    actionableStocks.map(async (asset) => {
      try {
        const { ask = 0 } = await yahooFinance.quote(asset.symbol, {
          fields: ["ask"],
        });
        return { ask, ...asset };
      } catch (e) {
        console.log("Error fetching quote:", e.message, asset.symbol);
        return asset;
      }
    })
  );
}

/**
 * Filters trending stocks within a given price range.
 * @param {Array} stocks List of stock objects with quotes.
 * @returns {Array} Filtered trending stocks.
 */
function filterTrendingStocks(stocks = []) {
  return stocks.filter(
    ({ ask = 0, uptrend }) => !!uptrend && ask >= 2 && ask < 20
  );
}

/**
 * Saves trending stocks to historical data.
 * @param {Array} trendingStocks - The trending stocks to save.
 */
function saveHistoricalData(trendingStocks) {
  writeFileSync(HISTORICAL_FILE, JSON.stringify(trendingStocks, null, 2));
  console.log(
    `Saved ${trendingStocks.length} trending assets to ${HISTORICAL_FILE}\n`
  );
}

/**
 * Displays and selects stocks to graph.
 * @param {Array} trendingStocks - Stocks trending upwards.
 * @param {Array} allQuotedStocks - All quoted stocks, including non-trending.
 * @returns {Promise<Array>} Selected stocks for graphing.
 */
async function selectStocksForGraph(trendingStocks = [], allQuotedStocks = []) {
  const choices = [
    new Separator("---Trending Up---"),
    ...trendingStocks.map((asset) => ({
      name: ` ${asset.symbol}`,
      value: asset,
      checked: true,
    })),
  ];

  const showDowntrends = await confirm({
    message: "Show assets that were not trending upwards?",
    default: false,
  });

  if (showDowntrends) {
    const downbad = allQuotedStocks.filter(({ uptrend }) => !uptrend);
    choices.push(
      new Separator("---Trending Down---"),
      ...downbad
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
        .map((asset) => ({
          name: ` ${asset.symbol}`,
          value: asset,
          checked: false,
        }))
    );
    drawSnapshot(downbad);
  }

  return await checkbox({
    message: "Which stocks do you want to graph?",
    choices,
    pageSize: 15,
    loop: !showDowntrends,
  });
}

/**
 * Graphs the selected stocks.
 * @param {Array} stocks - Stocks selected for graphing.
 */
async function graphStocks(stocks) {
  try {
    await Promise.all(
      stocks.map(async (asset) => {
        const { bid, ask, bidSize, askSize } = await yahooFinance.quote(
          asset.symbol
        );
        exec(
          `gnome-terminal -- bash -c "echo -ne; node graph.mjs graph ${asset.symbol}; exec bash"`,
          {
            cwd: CLI_DIR,
          }
        );
        return { bid, ask, bidSize, askSize, ...asset };
      })
    );
  } catch (e) {
    console.error("Error graphing stocks:", e.message);
  }
}

/**
 * Main function to run the stock selection and trading workflow.
 */
export async function main() {
  console.clear();

  let rawData = loadHistoricalData();
  let usePreviousData = false;

  if (rawData) {
    usePreviousData = await confirm({
      message: "Use today's previous raw data?",
      default: true,
    });
  }

  if (!usePreviousData) {
    const freshRawData = await scrapeStockData();
    rawData = freshRawData
    saveHistoricalData(freshRawData);
  }
  const appropriate = await determineAppropriateStocks(rawData);
  const allQuotes = await fetchStockQuotes(appropriate);
  const trendingStocks = filterTrendingStocks(allQuotes);

  drawSnapshot(trendingStocks);
  const stocksToGraph = await selectStocksForGraph(trendingStocks, allQuotes)
  await graphStocks(stocksToGraph);
}

main();
