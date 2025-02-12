import readline from "readline";
import asciichart from "asciichart";
// Function to clear the terminal
const clearTerminal = () => {
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
};

// Function to print text in a specific quadrant
const printInQuadrant = (x, y, text) => {
  readline.cursorTo(process.stdout, x, y);
  console.log(text);
};

// Clear the terminal
clearTerminal();

// Get terminal dimensions
const width = process.stdout.columns;
const height = process.stdout.rows;

// Calculate quadrant dimensions
const halfWidth = Math.floor(width / 2);
const halfHeight = Math.floor(height / 2);

// Text to display in each quadrant
const quadrant1Text = "Quadrant 1: Top-left";
const quadrant2Text = "Quadrant 2: Top-right";
const quadrant3Text = "Quadrant 3: Bottom-left";
const quadrant4Text = "Quadrant 4: Bottom-right";

// // Print text to each quadrant
// printInQuadrant(
//   0,
//   0,
//   asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
//     height: 10,
//     colors: [asciichart.white],
//     format(value) {
//       return Number(value).toFixed(10);
//     },
//   })
// );
// printInQuadrant(
//   halfWidth,
//   0,
//   asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
//     height: 10,
//     colors: [asciichart.white],
//     format(value) {
//       return Number(value).toFixed(10);
//     },
//   })
// );
// printInQuadrant(
//   0,
//   halfHeight,
//   asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
//     height: 10,
//     colors: [asciichart.white],
//     format(value) {
//       return Number(value).toFixed(10);
//     },
//   })
// );
// printInQuadrant(
//   halfWidth,
//   halfHeight,
//   asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
//     height: 10,
//     colors: [asciichart.white],
//     format(value) {
//       return Number(value).toFixed(10);
//     },
//   })
// );

console.log(
  asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
    height: 5,
    colors: [asciichart.white],
    format(value) {
      return Number(value).toFixed(10);
    },
  })
);

console.log("\n\n\n");

console.log(
  asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
    height: 5,
    colors: [asciichart.white],
    format(value) {
      return Number(value).toFixed(10);
    },
  })
);
console.log("\n\n\n");

console.log(
  asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
    height: 5,
    colors: [asciichart.white],
    format(value) {
      return Number(value).toFixed(10);
    },
  })
);
console.log("\n\n\n");

console.log(
  asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
    height: 5,
    colors: [asciichart.white],
    format(value) {
      return Number(value).toFixed(10);
    },
  })
);
console.log("\n\n\n");

console.log(
  asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
    height: 5,
    colors: [asciichart.white],
    format(value) {
      return Number(value).toFixed(10);
    },
  })
);

console.log("\n\n\n");
console.log(
  asciichart.plot([1, 2, 3, 6, 4, 3, 7, 8, 6], {
    height: 5,
    colors: [asciichart.white],
    format(value) {
      return Number(value).toFixed(10);
    },
  })
);
