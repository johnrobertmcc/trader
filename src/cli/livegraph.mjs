import WebSocket from "ws";
import { config } from "dotenv";
import asciichart from "asciichart";

config();

/**
 * Test function used to open a websocket connection via Alpaca
 * and watch for changes in real time.
 * @param {string} symbol The symbol to watch.
 */
async function connect(symbol) {
  const ws = new WebSocket("wss://stream.data.alpaca.markets/v2/iex");
  let subscribed = false;
  let prices = [];

  ws.on("open", () => {
    console.log("Connected to the server");

    const authMessage = {
      action: "auth",
      key: `${process.env.ALPACA_API_KEY}`,
      secret: `${process.env.ALPACA_API_SECRET}`,
    };

    ws.send(JSON.stringify(authMessage));
    ws.send(JSON.stringify({ action: "subscribe", trades: [symbol] }));
  });

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    const buffer = Buffer.from(message);
    const jsonString = buffer.toString("utf8");

    let data;
    try {
      data = JSON.parse(jsonString);
      if (data?.[0]?.T === "subscription") {
        subscribed = true;
      }
      if (data?.[0]?.p) {
        prices.push(data?.[0]?.p);
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    } finally {
      if (subscribed && prices?.length) {
        // console.log(data?.[0]);
        console.clear();
        console.log(
          asciichart.plot(prices, {
            height: 20,
            colors: [asciichart.white],
            format(value) {
              return Number(value).toFixed(10);
            },
          })
        );
      }
    }
  });

  ws.on("close", () => {
    console.log("Disconnected from the server. Reconnecting...");
    setTimeout(connect, 1000);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error.message);
    ws.close();
  });
}

export function createWebSocket(symbol = "AAPL") {
  let ws;

  connect(symbol);
  return ws;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const functionName = process.argv[2];
  const functionArgs = process.argv.slice(3);

  if (functionName) {
    import("./livegraph.mjs")
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
