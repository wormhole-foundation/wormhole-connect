const fs = require("fs");
const path = require("path");

// Path to your package.json
const packageJsonPath = path.join(__dirname, "wormhole-connect/package.json");

const payload = {
  "@wormhole-foundation/sdk-sui": "~/work/sdk/platforms/sui",
  "@wormhole-foundation/sdk-sui-core":
    "~/work/sdk/platforms/sui/protocols/core",
  "@wormhole-foundation/sdk-sui-tokenbridge":
    "~/work/sdk/platforms/sui/protocols/tokenBridge",
  "@wormhole-foundation/sdk-cosmwasm": "~/work/sdk/platforms/cosmwasm",
  "@wormhole-foundation/sdk-cosmwasm-core":
    "~/work/sdk/platforms/cosmwasm/protocols/core",
  "@wormhole-foundation/sdk-cosmwasm-ibc":
    "~/work/sdk/platforms/cosmwasm/protocols/ibc",
  "@wormhole-foundation/sdk-cosmwasm-tokenbridge":
    "~/work/sdk/platforms/cosmwasm/protocols/tokenBridge",
  "@wormhole-foundation/sdk-solana": "~/work/sdk/platforms/solana",
  "@wormhole-foundation/sdk-solana-cctp":
    "~/work/sdk/platforms/solana/protocols/cctp",
  "@wormhole-foundation/sdk-solana-core":
    "~/work/sdk/platforms/solana/protocols/core",
  "@wormhole-foundation/sdk-solana-tokenbridge":
    "~/work/sdk/platforms/solana/protocols/tokenBridge",
  "@wormhole-foundation/sdk-aptos": "~/work/sdk/platforms/aptos",
  "@wormhole-foundation/sdk-aptos-core":
    "~/work/sdk/platforms/aptos/protocols/core",
  "@wormhole-foundation/sdk-aptos-tokenbridge":
    "~/work/sdk/platforms/aptos/protocols/tokenBridge",
  "@wormhole-foundation/sdk-evm": "~/work/sdk/platforms/evm",
  "@wormhole-foundation/sdk-evm-cctp":
    "~/work/sdk/platforms/evm/protocols/cctp",
  "@wormhole-foundation/sdk-evm-core":
    "~/work/sdk/platforms/evm/protocols/core",
  "@wormhole-foundation/sdk-evm-portico":
    "~/work/sdk/platforms/evm/protocols/portico",
  "@wormhole-foundation/sdk-evm-tokenbridge":
    "~/work/sdk/platforms/evm/protocols/tokenBridge",
  "@wormhole-foundation/sdk-algorand": "~/work/sdk/platforms/algorand",
  "@wormhole-foundation/sdk-algorand-core":
    "~/work/sdk/platforms/algorand/protocols/core",
  "@wormhole-foundation/sdk-algorand-tokenbridge":
    "~/work/sdk/platforms/algorand/protocols/tokenBridge",
  "@wormhole-foundation/sdk-icons": "~/work/sdk/core/icons",
  "@wormhole-foundation/sdk-definitions": "~/work/sdk/core/definitions",
  "@wormhole-foundation/sdk-base": "~/work/sdk/core/base",
  "@wormhole-foundation/sdk-token-registry": "~/work/sdk/tokenRegistry",
  "@wormhole-foundation/sdk": "~/work/sdk/sdk",
  "@wormhole-foundation/sdk-connect": "~/work/sdk/connect",
};

// Read the package.json file
fs.readFile(packageJsonPath, "utf8", (err, data) => {
  if (err) {
    console.error(`Error reading file from disk: ${err}`);
    return;
  }

  try {
    // Parse the JSON data
    const packageJson = JSON.parse(data);

    // Add the "data" object to dependencies
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.overrides = packageJson.overrides || {};

    for (let key in payload) {
      packageJson.dependencies[key] = payload[key];
      packageJson.overrides[key] = payload[key];
    }

    // Convert the JSON object back to a string
    const updatedPackageJson = JSON.stringify(packageJson, null, 2);

    // Write the updated JSON back to the file
    fs.writeFile(packageJsonPath, updatedPackageJson, "utf8", (err) => {
      if (err) {
        console.error(`Error writing file to disk: ${err}`);
      } else {
        console.log("package.json has been updated");
      }
    });
  } catch (err) {
    console.error(`Error parsing JSON string: ${err}`);
  }
});
