import finnhub from "finnhub";
import { setTimeout } from "node:timers/promises";
import { exec } from "node:child_process";
import asciichart from "asciichart";
import {
  calculateMovingAverage,
  calculateTrendlineSlope,
} from "../shared/utils/index.js";
import { checkCurrentTrend } from "./gametime.mjs";

const api_key = finnhub.ApiClient.instance.authentications["api_key"];
api_key.apiKey = process.env.FINNHUB_API_KEY;
const finnhub_client = new finnhub.DefaultApi();

/**
 * Wrapper used to invoke/rewrite the graph with the current trend.
 * @param {string} symbol The symbol to watch.
 * @param {Number} start The start time.
 * @param {Number} end The end time.
 * @param {string} timeframe The timeframe, defaults to 1MIN.
 * @returns 
 */
export async function graph(symbol, start = 60, end = 15, timeframe = "1MIN") {
  const current_trend = await checkCurrentTrend(symbol, start, end, timeframe);
  return watchLive(symbol, current_trend);
}

/**
 * Recursive function used to create and maintain a bar graph every 5 seconds with live current prices from Finnhub.
 * @see https://finnhub.io/docs/api/quote
 * @param {string} symbol The symbol passed as a string.
 * @param {Array}  live_prices Prices that are applied recursively.
 * @param {Date}   start The start of the graph.
 */
export async function watchLive(symbol, live_prices = [], start = Date.now()) {
  try {
    const graph = await addCurrentPriceToList(symbol, live_prices);
    const elapsed_minutes = Math.ceil((Date.now() - start) / 60000);
    const moving_average = calculateMovingAverage(
      live_prices,
      live_prices.length
    );
    /**
     * Used to update the title of the terminal window.
     */

    const title = `${symbol} | MA ${Number(moving_average)?.toFixed(5) || 'calculating...'}`;
    await new Promise((resolve) => {
      exec(`echo -ne "\\033]0;${title}\\007";`, (_, stdout) => {
        console.log(stdout);
        resolve(console.clear());
      });
    });
    if (
      graph.length > 3 &&
      graph[graph.length - 1] === graph[graph.length - 2]
    ) {
      graph.pop();
    }
    if (graph.length >= 120) {
      graph.shift();
    }
    const slope = calculateTrendlineSlope(live_prices);

    console.clear();
    console.log(
      asciichart.plot(graph, {
        height: 20,
        colors: slope > 0 ? [asciichart.blue] : [asciichart.red],
        format(value) {
          return Number(value).toFixed(10);
        },
      })
    );
    const current_price = graph?.[graph?.length - 1];
    console.log(`Current Price: ${current_price}`);
    console.log(`Moving Average: ${moving_average}`);
    console.log(
      `${
        ((current_price - graph[0]) / graph[0]) * 100
      }% Increase in last ${elapsed_minutes} minutes.`
    );

    /**
     * Update the graph with the current data set after a timeout
     */
    await setTimeout(10000);
    watchLive(symbol, graph, start);
  } catch (error) {
    console.error("Error parsing asset:", error);
  }
}

/**
 * Function used to invoke Finnhub api for continuous and live (current) asset pricess.
 * @param {string} symbol The symbol as returned from Alpaca.
 * @param {Number} live_prices Accumulated live data.
 * @returns {Promise} Returns a promise structured as an array of live prices as numbers/floats.
 */
export async function addCurrentPriceToList(symbol = "", live_prices = []) {
  try {
    const { c: current_price } = await new Promise((resolve, reject) => {
      finnhub_client.quote(symbol, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });

    return [...live_prices, current_price];
  } catch (error) {
    console.error(
      `Error fetching live price for symbol ${symbol}:`,
      error?.message
    );
    return live_prices;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const functionName = process.argv[2];
  const functionArgs = process.argv.slice(3);

  if (functionName) {
    import("./graph.mjs")
      .then((module) => {
        if (typeof module[functionName] === "function") {
          module[functionName](...functionArgs);
        } else {
          console.error(`Function ${functionName} not found!`);
        }
      })
      .catch((err) => console.error("Error importing module:", err));
  } else {
    console.error("No function name provided!");
  }
}
