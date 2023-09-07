// Writing this as a helper to avoid having to touch code with every version change
// This simple file avoids introducing babel, webpack, or others into the build pipeline
// That said, there may be better alternatives to this, a hack to get the job done
const fs = require("fs");
const fileNames = ["./lib/cjs/index.js", "./lib/esm/index.js"];
const package = require("../package.json");
for (const fileName of fileNames) {
  fs.readFile(fileName, "utf8", (err, data) => {
    if (err) throw err;
    fs.writeFile(
      fileName,
      data.replace(
        "process.env.REACT_APP_CONNECT_CURRENT_VERSION",
        `"${package.version}"`
      ),
      "utf8",
      function (err) {
        if (err) throw err;
      }
    );
  });
}
