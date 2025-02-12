import Alpaca from "@alpacahq/alpaca-trade-api";
import asciichart from "asciichart";
import { calculateTrendlineSlope, getAdjustedTime } from "../shared/utils/index.js";

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_API_SECRET,
  paper: process.env.PAPER,
});

const now = new Date();
const eight_thirty_am = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  8,
  30,
  0,
  0
);
const four_thirty_pm = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  16,
  30,
  0,
  0
);

/**
 * @typedef {Object} Bar The bar returned from Alpaca.
 * @property {Number} ClosePrice The last closing price as a float.
 * @property {Number} HighPrice The highest price available as a float.
 * @property {Number} LowPrice The lowest price available as a float.
 * @property {Number} TradeCount The last number of trades available.
 * @property {Number} OpenPrice The price you probs gun get.
 * @property {Date} Timestamp ISO3 date timestamp.
 * @property {Number} Volume The volumn of shares.
 * @property {Number} VWAP I don't cook I don't clean.
 * @example Returns {
 *   ClosePrice: 2.43,
 *   HighPrice: 2.49,
 *   LowPrice: 2.3,
 *   TradeCount: 508,
 *   OpenPrice: 2.3,
 *   Timestamp: '2024-08-16T20:30:00Z',
 *   Volume: 154356,
 *   VWAP: 2.404982
 * }
 */
/**
 * Function used to get historical price data for trendlines.
 * @param {object} attributes The attributes descrtuctured
 * @param {string} attributes.symbol The asset's symbol.
 * @param {string} attributes.timeframe Defaults to "10MIN", used to determine how often the trend should be captured.
 * @param {DateConstructor} attributes.start The start period.
 * @param {DateConstructor} attributes.end The end period
 * @returns {Array.<Bar>} Returns an array of bars as object.
 */
export async function getBars({
  symbol,
  timeframe = alpaca.newTimeframe(10, alpaca.timeframeUnit.MIN),
  start = eight_thirty_am,
  end = four_thirty_pm,
}) {
  const got = [];
  try {
    const bars = alpaca.getBarsV2(symbol, {
      start,
      end,
      timeframe,
      limit: 500,
    });
    for await (let b of bars) {
      got.push(b);
    }
  } catch (e) {
    console.log(e?.message);
  } finally {
    return Promise.resolve(got);
  }
}

/**
 * Function used to plot a current trend and the comparative slope.
 * @param {Array} trend An array of trend.
 * @param {Array} slope The slope to compare
 */
export function plotDaily(trend, slope = []) {
  console.log(
    asciichart.plot(trend, slope, {
      height: 20,
      colors: [asciichart.green, asciichart.yellow],
      format: (x) => x.toFixed(10),
    })
  );
}

/**
 * Function used to check if the trades made today made sense or if you're just an idiot.
 */
export async function getYesterdaysSlope(symbol) {
  const yesterdays_slope = await getBars({ symbol });

  const slope = calculateTrendlineSlope(
    yesterdays_slope.map(({ VWAP }) => VWAP)
  );
  console.log("jr", yesterdays_slope, slope);
}

/**
 * Function used to check if the current trend holds water or not.
 * @param   {string} symbol The symbol to check.
 * @param {Number} start The start time in minutes, defaults to 60 minutes ago.
 * @param {Number} end The end time in minutes, defaults to 15 minutes ago.
 * @returns {Array} Returns the ClosePrices of the bars.
 */
export async function checkCurrentTrend(
  symbol,
  start = 60,
  end = 15,
  timeframe = "1MIN"
) {
  const current_trend = await getBars({
    symbol,
    start: getAdjustedTime(start),
    end: getAdjustedTime(end),
    timeframe,
  });

  return current_trend.map(({ ClosePrice }) => ClosePrice);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const functionName = process.argv[2];
  const functionArgs = process.argv.slice(3);

  if (functionName) {
    import("./gametime.mjs")
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

const test = [
  {
    ClosePrice: 3.5,
    HighPrice: 3.58,
    LowPrice: 3.5,
    TradeCount: 480,
    OpenPrice: 3.5105,
    Timestamp: "2024-08-15T12:30:00Z",
    Volume: 289629,
    VWAP: 3.559683,
  },
  {
    ClosePrice: 3.58,
    HighPrice: 3.58,
    LowPrice: 3.5,
    TradeCount: 387,
    OpenPrice: 3.51,
    Timestamp: "2024-08-15T13:00:00Z",
    Volume: 139220,
    VWAP: 3.537899,
  },
  {
    ClosePrice: 3.63,
    HighPrice: 3.965,
    LowPrice: 3.54,
    TradeCount: 24201,
    OpenPrice: 3.58,
    Timestamp: "2024-08-15T13:30:00Z",
    Volume: 11022228,
    VWAP: 3.738315,
  },
  {
    ClosePrice: 3.835,
    HighPrice: 3.9,
    LowPrice: 3.605,
    TradeCount: 12534,
    OpenPrice: 3.63,
    Timestamp: "2024-08-15T14:00:00Z",
    Volume: 5645446,
    VWAP: 3.762286,
  },
  {
    ClosePrice: 3.82,
    HighPrice: 3.835,
    LowPrice: 3.73,
    TradeCount: 6005,
    OpenPrice: 3.83,
    Timestamp: "2024-08-15T14:30:00Z",
    Volume: 2417974,
    VWAP: 3.78772,
  },
  {
    ClosePrice: 3.672,
    HighPrice: 3.85,
    LowPrice: 3.67,
    TradeCount: 4987,
    OpenPrice: 3.81,
    Timestamp: "2024-08-15T15:00:00Z",
    Volume: 2145395,
    VWAP: 3.75267,
  },
  {
    ClosePrice: 3.685,
    HighPrice: 3.7499,
    LowPrice: 3.625,
    TradeCount: 5348,
    OpenPrice: 3.675,
    Timestamp: "2024-08-15T15:30:00Z",
    Volume: 2539694,
    VWAP: 3.680141,
  },
  {
    ClosePrice: 3.775,
    HighPrice: 3.78,
    LowPrice: 3.68,
    TradeCount: 3776,
    OpenPrice: 3.684,
    Timestamp: "2024-08-15T16:00:00Z",
    Volume: 1934976,
    VWAP: 3.720413,
  },
  {
    ClosePrice: 3.685,
    HighPrice: 3.81,
    LowPrice: 3.665,
    TradeCount: 4171,
    OpenPrice: 3.7705,
    Timestamp: "2024-08-15T16:30:00Z",
    Volume: 2056204,
    VWAP: 3.746398,
  },
  {
    ClosePrice: 3.5938,
    HighPrice: 3.69,
    LowPrice: 3.49,
    TradeCount: 5981,
    OpenPrice: 3.6825,
    Timestamp: "2024-08-15T17:00:00Z",
    Volume: 3389242,
    VWAP: 3.567203,
  },
  {
    ClosePrice: 3.565,
    HighPrice: 3.695,
    LowPrice: 3.5601,
    TradeCount: 4729,
    OpenPrice: 3.595,
    Timestamp: "2024-08-15T17:30:00Z",
    Volume: 2896699,
    VWAP: 3.617864,
  },
  {
    ClosePrice: 3.475,
    HighPrice: 3.5799,
    LowPrice: 3.45,
    TradeCount: 4083,
    OpenPrice: 3.57,
    Timestamp: "2024-08-15T18:00:00Z",
    Volume: 2230356,
    VWAP: 3.498703,
  },
  {
    ClosePrice: 3.535,
    HighPrice: 3.54,
    LowPrice: 3.46,
    TradeCount: 3299,
    OpenPrice: 3.4797,
    Timestamp: "2024-08-15T18:30:00Z",
    Volume: 2013356,
    VWAP: 3.491278,
  },
  {
    ClosePrice: 3.55,
    HighPrice: 3.56,
    LowPrice: 3.505,
    TradeCount: 3977,
    OpenPrice: 3.535,
    Timestamp: "2024-08-15T19:00:00Z",
    Volume: 2551914,
    VWAP: 3.525248,
  },
  {
    ClosePrice: 3.61,
    HighPrice: 3.66,
    LowPrice: 3.55,
    TradeCount: 8056,
    OpenPrice: 3.555,
    Timestamp: "2024-08-15T19:30:00Z",
    Volume: 4704651,
    VWAP: 3.612452,
  },
  {
    ClosePrice: 3.58,
    HighPrice: 3.6,
    LowPrice: 3.5701,
    TradeCount: 80,
    OpenPrice: 3.6,
    Timestamp: "2024-08-15T20:00:00Z",
    Volume: 545389,
    VWAP: 3.598294,
  },
  {
    ClosePrice: 3.5491,
    HighPrice: 3.6,
    LowPrice: 3.52,
    TradeCount: 126,
    OpenPrice: 3.5802,
    Timestamp: "2024-08-15T20:30:00Z",
    Volume: 75150,
    VWAP: 3.547202,
  },
];
