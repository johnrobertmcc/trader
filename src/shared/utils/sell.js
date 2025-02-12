import Alpaca from "@alpacahq/alpaca-trade-api";
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_API_SECRET,
  paper: process.env.PAPER,
});

/**
 * Finally, sell to make some fuckin MONEY.
 * Looks for trends of 10% profit at least.
 * I.e. -> buy at $3, sell at $3.60
 * @see https://docs.alpaca.markets/reference/postorder
 * @param {Array<object>} stocks List of stocks as an object, symbol is required.
 * @param {object} additional Any additional order fullfilments to add.
 */
export async function sell(order) {
  console.log("jr selling", order);
}
