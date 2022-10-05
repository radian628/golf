const uglify = require("uglify-js");
const fs = require("node:fs/promises");

(async () => {
    console.log("Minifying....");
    const output = uglify.minify((await fs.readFile("./parser.mjs")).toString());
    if (!output.code) {
        console.log("Error: ", output.error);
        process.exit(1);
    }
    await fs.writeFile("./parser.min.mjs", output.code);
    console.log("Done!");
    console.log("Final output length: " + output.code.length);
})();