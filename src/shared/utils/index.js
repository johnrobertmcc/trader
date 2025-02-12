import puppeteer from "puppeteer";
import yahooFinance from "yahoo-finance2";
import asciichart from "asciichart";

export const PENNY_SCRAPER =
  "https://finance.yahoo.com/u/yahoo-finance/watchlists/most-active-penny-stocks/";

export const FIFTYTWO_WEEK_GAINS =
  "https://finance.yahoo.com/u/yahoo-finance/watchlists/fiftytwo-wk-gain";

export const BENZINGA_SCRAPER =
  "https://www.benzinga.com/money/stocks-under-20";

/**
 * Default order specs:
 * side: buy|sell
 * type: market to designate market/immediate action.
 * time_in_force: "day" To ensure that if it does not happen during the day it will not execute after hours (unless extendable: true from alpaca)
 */
export const DEFAULT_BUY = {
  side: "buy", // 'buy' or 'sell'
  type: "market", // Order type: market, limit, etc.
  time_in_force: "day", // Valid for the trading day
};

/**
 * Equity trading: day, gtc, opg, cls, ioc, fok.
 * Options trading: day.
 * Crypto trading: gtc, ioc.
 */
export const TIME_IN_FORCE_OPTIONS = [
  {
    name: "day",
    value: "day",
    description:
      "A day order is eligible for execution only on the day it is live.",
  },
  {
    name: "gtc",
    value: "gtc",
    description: "The order is good until canceled.",
  },
  { name: "opg", value: "opg", disabled: true },
  {
    name: "cls",
    value: "cls",
    disabled: "(pnpm is not available)",
  },
];

export const TIF_MAP = {
  equity: { day: true, gtc: true, opg: true, cls: true, ioc: true, fok: true },
  options: { day: true },
  crypto: { gtc: true, ioc: true },
};

/**
 * Function used to create the list of options available for one particular transaction.
 * @param {string} type One of 'equity', 'crypto', 'options'
 * @returns {Array<object>} Returns an iterable object with inquiry selections.
 */
export function createTIFOptions(type = "equity") {
  return [
    {
      name: "day",
      value: "day",
      description:
        "A day order is eligible for execution only on the day it is live.",
      disabled: !TIF_MAP?.[type]?.day,
    },
    {
      name: "fok",
      value: "fok",
      description:
        "A Fill or Kill (FOK) order is only executed if the entire order quantity can be filled, otherwise the order is canceled.",
      disabled: !TIF_MAP?.[type?.toLowerCase()]?.fok,
    },
    {
      name: "ioc",
      value: "ioc",
      description:
        "An Immediate Or Cancel (IOC) order requires all or part of the order to be executed immediately. ",
      disabled: !TIF_MAP?.[type]?.ioc,
    },
    {
      name: "gtc",
      value: "gtc",
      description: "The order is good until canceled.",
      disabled: !TIF_MAP?.[type]?.gtc,
    },
    {
      name: "opg",
      value: "opg",
      description:
        "Use this TIF with a market/limit order type to submit “market on open” (MOO) and “limit on open” (LOO) orders. ",
      disabled: !TIF_MAP?.[type]?.opg,
    },
    {
      name: "cls",
      value: "cls",
      description:
        "Use this TIF with a market/limit order type to submit “market on close” (MOC) and “limit on close” (LOC) orders. ",
      disabled: !TIF_MAP?.[type]?.cls,
    },
  ];
}

/**
 * Function used to create a filename with today's date.
 *
 * @returns {string} Returns file path formatted MM-DD-YYYY.
 */
export function createTodaysFilename() {
  const today = new Date();

  return `${today.getMonth()}-${today.getDate()}-${today.getFullYear()}`;
}

/**
 * Function used to scrape Yahoo pages for relevant symbols.
 * @param {string} url The url to scrape.
 */
export async function scrapeYahooData(url = PENNY_SCRAPER) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on("console", () => {});
    await page.goto(url);

    const data = await page.evaluate(() => {
      const symbols = Array.from(
        document.querySelectorAll("a[data-test='symbol-link']")
      );
      return symbols.map((symbol) => symbol.textContent);
    });

    await browser.close();

    return data;
  } catch (error) {
    console.error("Error scraping data:", error);
  }
}

/**
 * Function used to scrape benzinga watchlists.
 * @param {string} url The url to scrape.
 */
export async function scrapeBenzinga(url = BENZINGA_SCRAPER) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on("console", () => {});
    await page.goto(url);

    const data = await page.evaluate(() => {
      const anchors = document.querySelectorAll(
        'td[class="ticker"] a[href*="/quote/"]'
      );
      const symbols = Array.from(anchors).map((anchor) => anchor.textContent);
      return symbols;
    });

    await browser.close();

    return data;
  } catch (error) {
    console.error("Error scraping data:", error);
  }
}

/**
 * Takes in the list of watched, shortable stocks provided and determines the appropriate action based on market trends.
 * Determine which stocks are the most appropriate to buy or sell, if any, based on ruleset:
 * Price: Ideally $2-20 (determined via scrapers)
 * Moving Average: The closing average within a ten percent margin floor of the current price.
 * RSI: Below 50, ideally above 30.
 * Slope: Positive slope over last 7 days.
 * @see https://www.incrediblecharts.com/indicators/momentum-indicator.php#:~:text=First%2C%20identify%20the%20trend%20direction,turns%20upwards%20when%20below%20zero.
 * @param {Array<string>} symbols The symbols as strings to analyze using yahoo finance. Example can be found in historical/ directory.
 * @returns {Array<object>} Returns an Array of objects.
 * @example Returns {
 *  symbol: 'TLRY',
 *  moving_average: 1.8099999904632569,
 *  rsi: 74.99998758237234,
 *  uptrend: false,
 *  slope: 0.01799999475479126
 *  }
 *
 */
export async function determineAppropriateStocks(symbols) {
  const analysis = symbols.map((symbol) =>
    analyzeStock(symbol).catch(() => {
      return {
        symbol,
        moving_average: "N/A/",
        rsi: 0,
        uptrend: false,
        slope: 0,
        quotes: [],
      };
    })
  );

  const results = await Promise.all(analysis);
  return results;
}

/**
 * Function used to fetch the last 50 days of an individual asset.
 * Using momentum strategy.
 * @see https://www.incrediblecharts.com/indicators/momentum-indicator.php#:~:text=First%2C%20identify%20the%20trend%20direction,turns%20upwards%20when%20below%20zero.
 * @param {string} symbol Takes in the string of the symbol.
 * @returns {object} Returns the trend of each individual stock.
 */
export async function analyzeStock(symbol) {
  const period1 = new Date();
  period1.setDate(period1.getDate() - 50);
  const { quotes } = await yahooFinance.chart(symbol, { period1 });

  const closing_prices = quotes?.map((t) => t?.close);
  const moving_average = calculateMovingAverage(closing_prices, 14);
  const slope = calculateTrendlineSlope(closing_prices);
  const rsi = calculateRSI(closing_prices, 14);

  const data = {
    symbol,
    moving_average,
    rsi,
    uptrend: slope > 0 && rsi < 70 && rsi > 30,
    slope,
    quotes,
  };

  return data;
}

/**
 * Function used to calculate the moving average given a period.
 * @see https://corporatefinanceinstitute.com/resources/equities/moving-average/
 * @param {Array<number>} data List of numbers reflecting prices.
 * @param {number} period The number of periods, defaults to 5 (last 5 days market open).
 * @returns {number} Returns the moving average of the supplied period.
 */
export function calculateMovingAverage(data, period = 5) {
  const sum = data.slice(-period).reduce((acc, num) => acc + num, 0);
  const ma = sum / (period < data?.length ? data.length : period);

  return ma;
}

/**
 * Function used to calculate the RSI (Relative Strength Index) of the period.
 * A value of 70 or above indicates that the market is overbought and may be due for a correction.
 * A value of 30 or below indicates that the market is oversold and may be ripe for a bounce.
 * @see https://www.freshbooks.com/en-gb/hub/other/relative-strength-index
 * @param {Array<number>} data List of numbers reflecting prices.
 * @param {number} period The length of the period - defaults to the last 5 days (last 5 days market open).
 * @returns {number} Returns the RSI of the supplied period.
 */
export function calculateRSI(data, period = 5) {
  let avgUpwardChange = 0;
  let avgDownwardChange = 0;

  // Calculate initial averages
  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      avgUpwardChange += change;
    } else {
      avgDownwardChange -= change;
    }
  }

  avgUpwardChange /= period;
  avgDownwardChange /= period;

  // Calculate RSI using smoothed average
  const rsi = 100 - 100 / (1 + avgUpwardChange / (avgDownwardChange || 1));

  return rsi;
}

/**
 * Function used to find the trending slopeline.
 * @see https://www.quora.com/How-do-you-find-the-slope-of-a-trendline#:~:text=You%20just%20need%20two%20points,where%20m%20is%20the%20slope.
 * @param {Array} prices The prices historical data from yahoo.
 * @returns {number} Returns the slopeline.
 */
export function calculateTrendlineSlope(prices) {
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i + 1); // Time index array
  const y = prices;

  const xMean = x.reduce((acc, val) => acc + val, 0) / n;
  const yMean = y.reduce((acc, val) => acc + val, 0) / n;

  const numerator = x.reduce(
    (acc, xi, i) => acc + (xi - xMean) * (y[i] - yMean),
    0
  );
  const denominator = x.reduce((acc, xi) => acc + Math.pow(xi - xMean, 2), 0);

  return numerator / denominator;
}

/**
 * Function used to get the adjusted time based on provided (or defaulted) minutes ago.
 * @param {number} min_ago The number of minutes ago to check, defaults to 5;
 * @returns {Date} Returns the adjusted Date object.
 */
export function getAdjustedTime(min_ago = 5) {
  const now = new Date();

  const adjusted = new Date(now.getTime() - min_ago * 60 * 1000);

  return adjusted;
}

/**
 * Function used to print a graph and other deciding features.
 * @param {Array} array The array to log.
 */
export function drawSnapshot(array) {
  array?.map(({ symbol, uptrend, rsi, moving_average, slope, ask, quotes }) => {
    if (quotes?.length) {
      const colors = uptrend
        ? [asciichart.white, asciichart.blue]
        : [asciichart.yellow, asciichart.red];
      console.log(`\n----------------------${symbol}----------------------\n`);
      console.log(
        asciichart.plot(
          [
            quotes?.map((asset) => asset?.close),
            quotes?.map((asset) => asset?.open),
          ],
          {
            height: 5,
            colors,
            format(value) {
              return `${Number(value) < 10 ? "0" : ""}${Number(value).toFixed(
                10
              )}`;
            },
          }
        ),
        "\n"
      );
      console.log(
        `Uptrend: ${uptrend} \nRSI: ${rsi} \nMA: ${moving_average} \nSlope: ${slope} \nEstimated ask: ${
          ask || "N/A"
        }\n`
      );
      console.log(
        "\n------------------------------------------------\n"
      );
    } else {
      console.log(`${symbol} not available.`)
    }
  });
}
