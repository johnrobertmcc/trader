import Alpaca from "@alpacahq/alpaca-trade-api";
import { createTIFOptions } from "./index.js";
import { config } from "dotenv";
import { select, input, confirm } from "@inquirer/prompts";
import yahooFinance from "yahoo-finance2";


export const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_API_SECRET,
  paper: process.env.PAPER,
});


config();

/**
 * Function used to buy all stocks (else defaults to the eligible stocks found through main.js).
 * @see https://docs.alpaca.markets/reference/postorder
 * @param {object} order The order as provided.
 */
export default async function buy(order) {
  console.log("jr buying...", order);
}

/**
 * Wrapper for the CLI that allows the user to select via Inquirer.
 * @see https://github.com/SBoudrias/Inquirer.js
 */
export async function buyCLI() {
  console.clear();

  const symbol = await input({
    message: "Which stock (symbol) would you like to buy?",
  });

  /**
   * Determine how much cash is available in account and the price of the quote.
   * @see https://docs.alpaca.markets/reference/getaccount-1
   * @see https://github.com/gadicc/node-yahoo-finance2
   */
  const { buying_power } = await alpaca.getAccount();
  const { quoteType, ask } = await yahooFinance.quote(symbol);
  const max_shares = Math.floor(buying_power / ask);

  const qty = await input({
    message: `How many would shares would you like to buy? Max Allowed:`,
    default: max_shares,
  });

  const time_in_force = await select({
    message: "Select a package manager",
    choices: createTIFOptions(quoteType.toLowerCase()),
  });

  const additional = await confirm({
    message: "Do you want to add additional parameters?",
    default: false,
  });

  const optional_attr = {};

  if (additional) {
    const limit_price = await input({
      message: "Limit price",
      default: null,
    });
    const stop_price = await input({
      message: "Stop price",
      default: null,
    });
    const extended_hours = await input({
      message: "Extended Hours?",
      default: false,
    });
    const take_profit = await input({
      message: "Take profit $:",
      default: null,
    });
    const stop_loss = await input({
      message: "Stop loss:",
      default: null,
    });
    const trail_price = await input({
      message: "Trail price:",
      default: null,
    });
    const trail_percent = await input({
      message: "Trail percent:",
      default: null,
    });

    if (limit_price !== null) optional_attr.limit_price = limit_price;
    if (stop_price !== null) optional_attr.stop_price = stop_price;
    if (extended_hours !== null) optional_attr.extended_hours = extended_hours;
    if (take_profit !== null) optional_attr.take_profit = take_profit;
    if (stop_loss !== null) optional_attr.stop_loss = stop_loss;
    if (trail_price !== null) optional_attr.trail_price = trail_price;
    if (trail_percent !== null) optional_attr.trail_percent = trail_percent;
  }
  const order = {
    side: "buy",
    time_in_force,
    symbol,
    qty,
    ...optional_attr,
  };
  console.log(order);

  const confirmed = await confirm({
    message: "Does this look correct?",
    default: true,
  });

  if (confirmed) {
    buy(order);
  }
}

// Check if the script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const functionName = process.argv[2]; // Get the function name from the command-line arguments
  const functionArgs = process.argv.slice(3); // Get the rest of the arguments

  if (functionName) {
    import("./buy.mjs")
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
