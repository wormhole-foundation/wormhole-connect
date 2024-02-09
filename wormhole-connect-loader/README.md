# Wormhole Connect

Integration does not get easier than this. Wormhole Connect is an easy seamless experience that will help to bring all the functionality of the Wormhole Token Bridge right into your application.

## Customizer

Customize and integrate via our no-code solution: https://connect-in-style.wormhole.com/


## Integrate with script/link tags

> We recommend that you configure your own custom RPC endpoints for each used network for the best performance. The default public RPCs may be throttled or rate limited.  

> Osmosis support is in beta, reach out to a Wormhole contributor for early access.

### 1. (Optional) Create a JSON config with customized values:

```ts
{
  "env": "testnet",
  "networks": ["goerli", "mumbai"],
  "tokens": ["ETH", "WETH", "MATIC", "WMATIC"],
  "mode": "light",
  "customTheme": {} // see src/theme.ts
}
```

#### Accepted values

Environment (`env`):
| Mainnet | Testnet |
| ---------- | --------- |
| mainnet | testnet |

<br>

Networks (`networks`):
| Mainnet | Testnet |
| ---------- | ------------- |
| ethereum | goerli, sepolia |
| polygon | mumbai |
| bsc | bsc |
| avalanche | fuji |
| celo | avalanche |
| moonbeam | moonbasealpha |
| solana | solana |
| sui | sui |
| aptos | aptos |
| base | basegoerli, base_sepolia |
| osmosis | osmosis |
| evmos | evmos |
| kujira | kujira |
| klaytn | klaytn |
| arbitrum | arbitrumgoerli, arbitrum_sepolia |
| optimism | optimismgoerli, optimism_sepolia |

<br>

Tokens (`tokens`):
| Mainnet | Testnet |
| ----------- | -------- |
| ETH | ETH, ETHsepolia |
| WETH | WETH, WETHsepolia |
| USDCeth | USDCeth |
| WBTC | |
| USDT | |
| DAI | |
| BUSD | |
| MATIC | MATIC |
| WMATIC | WMATIC |
| USDCpolygon | |
| BNB | BNB |
| WBNB | WBNB |
| USDCbnb | |
| AVAX | AVAX |
| WAVAX | WAVAX |
| USDCavax | USDCavax |
| FTM | FTM |
| WFTM | WFTM |
| CELO | CELO |
| GLMR | GLMR |
| WGLMR | WGLMR |
| SOL | WSOL |
| PYTH | |
| SUI | SUI |
| USDCsol | |
| APT | APT |
| ETHarbitrum | ETHarbitrum, ETHarbitrum_sepolia |
| WETHarbitrum | WETHarbitrum, WETHarbitrum_sepolia |
| USDCarbitrum | USDCarbitrum|
| ETHoptimism | ETHoptimism, ETHoptimism_sepolia |
| WETHoptimism | WETHoptimism, WETHoptimism_sepolia |
| USDCoptimism | USDCoptimism|
| ETHbase | ETHbase, ETHbase_sepolia |
| WETHbase | WETHbase, WETHbase_sepolia |
| tBTC | tBTC |
| tBTCpolygon | tBTCpolygon |
| tBTCoptimism | tBTCoptimism |
| tBTCarbitrum | tBTCarbitrum |
| tBTCbase | tBTCbase |
| tBTCsol | tBTCsol |
| WETHpolygon | |
| WETHbsc | |
| wstETH | wstETH |
| wstETHarbitrum | |
| wstETHoptimism | |
| wstETHpolygon | |
| wstETHbase | |


<br>

Routes (`routes`)
| Mainnet | Testnet |
| -------- | ---------|
| bridge | bridge |
| relay | relay |
| cctpManual | cctpManual |
| cctpRelay | cctpRelay |
| cosmosGateway | cosmosGateway |
| tbtc | tbtc |
| ethBridge | |
| wstETHBridge | |

<br>

Mode (`mode`):
| | |
| ---- | ----- |
| dark | light |

<br>

Theme (`customTheme`)

See [theme.ts](https://github.com/wormhole-foundation/wormhole-connect/blob/development/wormhole-connect-loader/src/theme.ts) for examples

### 2. Add your config

Add a container div with the id `wormhole-connect`. This is where the bridge will be rendered.

```html
<div id="wormhole-connect" />
```

If you created a config from step 1, [stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) it and assign to the `config` attribute on the container element.

```html
<div
  id="wormhole-connect"
  config='{"env":"mainnet","tokens":["ETH","WETH","WBTC","USDCeth"]}'
/>
```

### 2. Add a script and link tag

```html
<!-- paste below into index.html body -->
<script type="module" src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.2.0/dist/main.js"></script>
<link
  href="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.2.0/dist/main.css"
/>
```

Note that the `wormhole-connect` div with your config has to be present _before_ the scripts are loaded. If your application loads it after, you may need to add the scripts like this:

```js
function mount() {
  const script = document.createElement("script");
  script.src =
    "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.2.0/dist/main.js";
  script.async = true;
  script.type = "module";

  const link = document.createElement("link");
  link.href =
    "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.2.0/dist/main.css";

  document.body.appendChild(script);
  document.body.appendChild(link);
}
```

## Integrate with React

```jsx
import WormholeBridge from "@wormhole-foundation/wormhole-connect";
function App() {
  return <WormholeBridge />;
}
```

(Optional) Specify supported networks/tokens and custom RPC endpoints. Your users may encounter rate limits using public RPC endpoints if you do not provide your own

```jsx
import WormholeBridge, {
  WormholeConnectConfig,
} from "@wormhole-foundation/wormhole-connect";
const config: WormholeConnectConfig = {
  env: "mainnet",
  networks: ["ethereum", "polygon", "solana"],
  tokens: ["ETH", "WETH", "MATIC", "WMATIC"],
  rpcs: {
    ethereum: "https://rpc.ankr.com/eth",
    solana: "https://rpc.ankr.com/solana",
  },
};

function App() {
  return <WormholeBridge config={config} />;
}
```

(Optional) Customize theme

```jsx
import WormholeBridge, {
  light,
  Theme,
  WormholeConnectConfig,
} from "@wormhole-foundation/wormhole-connect";
import lightblue from "@mui/material/colors/lightBlue";

// alters the `light` theme
const customized: Theme = light;
customized.success = lightblue;
customized.background.default = "transparent";
customized.button.action = "#81c784";
customized.button.actionText = "#000000";

const config: WormholeConnectConfig = {
  mode: "light",
  customTheme: customized,
};

function App() {
  return <WormholeBridge config={config} />;
}
```

(Optional) Create fully customized theme

```jsx
import WormholeBridge, {
  Theme,
  OPACITY,
  WormholeConnectConfig,
} from "@wormhole-foundation/wormhole-connect";
import lightblue from "@mui/material/colors/lightBlue";
import grey from "@mui/material/colors/grey";
import green from "@mui/material/colors/green";
import orange from "@mui/material/colors/orange";

const customized: Theme = {
  primary: grey,
  secondary: grey,
  divider: "#ffffff" + OPACITY[20],
  background: {
    default: "#232323",
  },
  text: {
    primary: "#ffffff",
    secondary: grey[500],
  },
  error: red,
  info: lightblue,
  success: green,
  warning: orange,
  button: {
    primary: "#ffffff" + OPACITY[20],
    primaryText: "#ffffff",
    disabled: "#ffffff" + OPACITY[10],
    disabledText: "#ffffff" + OPACITY[40],
    action: orange[300],
    actionText: "#000000",
    hover: "#ffffff" + OPACITY[7],
  },
  options: {
    hover: "#474747",
    select: "#5b5b5b",
  },
  card: {
    background: "#333333",
    secondary: "#474747",
    elevation: "none",
  },
  popover: {
    background: "#1b2033",
    secondary: "#ffffff" + OPACITY[5],
    elevation: "none",
  },
  modal: {
    background: "#474747",
  },
};
const config: WormholeConnectConfig = {
  mode: "dark",
  customTheme: customized,
};

function App() {
  return <WormholeBridge config={config} />;
}
```

## Configuration Options

### Wallet Connect Project ID

Required in order to display Wallet Connect as a wallet option. You can get a project ID on https://cloud.walletconnect.com/. Refer to the wallet connect [documentation](https://docs.walletconnect.com/advanced/migration-from-v1.x/overview) for more information on v2.

### Toggle Hamburguer Menu

By setting the `showHamburgerMenu` option to **false**, you can deactivate the hamburger menu, causing the links to be positioned at the bottom.

#### Add extra menu entry

By setting the `showHamburgerMenu` option to **false**, you can use the `menu` array to add extra links.

|property|description|
|--|--|
|`menu[].label`|link name to show up|
|`menu[].href`|target url or urn|
|`menu[].target`|anchor standard target, by default `_blank`|
|`menu[].order`|order where the new item should be injected|

#### Sample configuration

```json
{
  "showHamburgerMenu": false,
  "menu": [
    {
      "label": "Advance Tools",
      "href": "https://portalbridge.com",
      "target": "_self",
      "order": 1
    }
  ]
}
```

### CoinGecko API Key

If you have a CoinGecko API Plan, you can include the API key in the configuration. In case you do not have the API key, [follow this steps](https://apiguide.coingecko.com/getting-started/getting-started).

### More Networks

Specify a set of extra networks to be displayed on the network selection modal, each of them linking to a different page/dApp/mobile app the user will be redirected to.

|Property|description||
|:--|:--|:--:|
|`moreNetworks.href`| Default value for missing network hrefs | mandatory|
|`moreNetworks.target`| Default value for missing network link targets | optional, defaults to `_self`
|`moreNetworks.description` | Brief description that should be displayed as tooltip when the user hover an more network icon. Used as default for missing network descriptions | optional |
|`moreNetworks.networks[].icon` | URL data encoded icon to display | mandatory|
|`moreNetworks.networks[].href` | Network href to redirect to. If present, the values `{:sourceChain}` and `{:targetChain}` are replaced with the selected currently selected chains before redirecting | optional |
|`moreNetworks.networks[].label` | Display text | mandatory |
|`moreNetworks.networks[].name` | Unique network key | optional, defaults to a snake_case version of the label |
|`moreNetworks.networks[].description` | Description value | optional, defaults to `moreNetworks.description`|
|`moreNetworks.networks[].target` | href target value | optional, defaults to `moreNetworks.target`|
| `moreNetworks.networks[].showOpenInNewIcon` | Disable top right open in new icon | optional, defaults to **true** if target is `_blank` or **false** if target is `_self`|

```json
{
  ...
  "moreNetworks": {
    "href": "https://example.com",
    "target": "_blank",
    "description": "brief description that should be displayed as tooltip when the user over an more network icon",
    "networks": [
      {
        "icon": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='91' height='91' viewBox='0 0 91 91' fill='none'%3E%3Ccircle cx='45.5' cy='45.5' r='45.5' fill='%23E8E8EC'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M26.833 25.8333C26.2807 25.8333 25.833 26.281 25.833 26.8333V63.1666C25.833 63.7189 26.2807 64.1666 26.833 64.1666H63.1663C63.7186 64.1666 64.1663 63.7189 64.1663 63.1666V48.7333C64.1663 48.4571 63.9425 48.2333 63.6663 48.2333C63.3902 48.2333 63.1663 48.4571 63.1663 48.7333V63.1666H26.833V26.8333L41.2663 26.8333C41.5425 26.8333 41.7663 26.6094 41.7663 26.3333C41.7663 26.0571 41.5425 25.8333 41.2663 25.8333H26.833ZM64.0199 25.9797C64.0321 25.9919 64.0435 26.0046 64.0542 26.0177L64.1663 26.324L64.1663 26.3342V37.5333C64.1663 37.8094 63.9425 38.0333 63.6663 38.0333C63.3902 38.0333 63.1663 37.8094 63.1663 37.5333V27.5404L41.6199 49.0868C41.4246 49.2821 41.1081 49.2821 40.9128 49.0868C40.7175 48.8915 40.7175 48.575 40.9128 48.3797L62.4592 26.8333H52.4663C52.1902 26.8333 51.9663 26.6094 51.9663 26.3333C51.9663 26.0571 52.1902 25.8333 52.4663 25.8333H63.666H63.6663C63.6823 25.8333 63.6983 25.834 63.7143 25.8355C63.7632 25.8402 63.8116 25.8521 63.8577 25.8712C63.9167 25.8956 63.972 25.9318 64.0199 25.9797Z' fill='%230F1022'/%3E%3Cpath d='M63.1663 63.1666V64.1666H64.1663V63.1666H63.1663ZM26.833 63.1666H25.833V64.1666H26.833V63.1666ZM26.833 26.8333L26.833 25.8333L25.833 25.8333V26.8333H26.833ZM41.2663 26.8333L41.2663 25.8333H41.2663L41.2663 26.8333ZM64.0542 26.0177L64.9934 25.6742L64.9356 25.5161L64.8292 25.3857L64.0542 26.0177ZM64.0199 25.9797L64.727 25.2726L64.727 25.2726L64.0199 25.9797ZM64.1663 26.324L65.1662 26.3158L65.1648 26.1429L65.1054 25.9806L64.1663 26.324ZM64.1663 26.3342L65.1664 26.3342L65.1663 26.326L64.1663 26.3342ZM63.1663 27.5404H64.1663V25.1261L62.4592 26.8333L63.1663 27.5404ZM40.9128 49.0868L40.2057 49.7939L40.2057 49.7939L40.9128 49.0868ZM40.9128 48.3797L40.2057 47.6726L40.2057 47.6726L40.9128 48.3797ZM62.4592 26.8333L63.1663 27.5404L64.8734 25.8333H62.4592V26.8333ZM63.7143 25.8355L63.8096 24.8401L63.8095 24.8401L63.7143 25.8355ZM63.8577 25.8712L64.2401 24.9472L64.24 24.9472L63.8577 25.8712ZM26.833 26.8333V26.8333V24.8333C25.7284 24.8333 24.833 25.7287 24.833 26.8333H26.833ZM26.833 63.1666V26.8333H24.833V63.1666H26.833ZM26.833 63.1666H26.833H24.833C24.833 64.2712 25.7284 65.1666 26.833 65.1666V63.1666ZM63.1663 63.1666H26.833V65.1666H63.1663V63.1666ZM63.1663 63.1666V65.1666C64.2709 65.1666 65.1663 64.2712 65.1663 63.1666H63.1663ZM63.1663 48.7333V63.1666H65.1663V48.7333H63.1663ZM63.6663 49.2333C63.3902 49.2333 63.1663 49.0094 63.1663 48.7333H65.1663C65.1663 47.9048 64.4948 47.2333 63.6663 47.2333V49.2333ZM64.1663 48.7333C64.1663 49.0094 63.9425 49.2333 63.6663 49.2333V47.2333C62.8379 47.2333 62.1663 47.9048 62.1663 48.7333H64.1663ZM64.1663 63.1666V48.7333H62.1663V63.1666H64.1663ZM26.833 64.1666H63.1663V62.1666H26.833V64.1666ZM25.833 26.8333V63.1666H27.833V26.8333H25.833ZM41.2663 25.8333L26.833 25.8333L26.833 27.8333L41.2663 27.8333L41.2663 25.8333ZM40.7663 26.3333C40.7663 26.0571 40.9902 25.8333 41.2663 25.8333V27.8333C42.0948 27.8333 42.7663 27.1617 42.7663 26.3333H40.7663ZM41.2663 26.8333C40.9902 26.8333 40.7663 26.6094 40.7663 26.3333H42.7663C42.7663 25.5048 42.0948 24.8333 41.2663 24.8333V26.8333ZM26.833 26.8333H41.2663V24.8333H26.833V26.8333ZM64.8292 25.3857C64.7971 25.3464 64.763 25.3086 64.727 25.2726L63.3128 26.6868C63.3012 26.6752 63.2899 26.6628 63.2793 26.6497L64.8292 25.3857ZM65.1054 25.9806L64.9934 25.6742L63.1151 26.3611L63.2271 26.6675L65.1054 25.9806ZM65.1663 26.326L65.1662 26.3158L63.1663 26.3322L63.1664 26.3425L65.1663 26.326ZM65.1663 37.5333V26.3342H63.1663V37.5333H65.1663ZM63.6663 39.0333C64.4948 39.0333 65.1663 38.3617 65.1663 37.5333H63.1663C63.1663 37.2571 63.3902 37.0333 63.6663 37.0333V39.0333ZM62.1663 37.5333C62.1663 38.3617 62.8379 39.0333 63.6663 39.0333V37.0333C63.9425 37.0333 64.1663 37.2571 64.1663 37.5333H62.1663ZM62.1663 27.5404V37.5333H64.1663V27.5404H62.1663ZM42.327 49.7939L63.8734 28.2475L62.4592 26.8333L40.9128 48.3797L42.327 49.7939ZM40.2057 49.7939C40.7915 50.3797 41.7412 50.3797 42.327 49.7939L40.9128 48.3797C41.108 48.1844 41.4246 48.1844 41.6199 48.3797L40.2057 49.7939ZM40.2057 47.6726C39.6199 48.2584 39.6199 49.2081 40.2057 49.7939L41.6199 48.3797C41.8152 48.575 41.8152 48.8915 41.6199 49.0868L40.2057 47.6726ZM61.7521 26.1261L40.2057 47.6726L41.6199 49.0868L63.1663 27.5404L61.7521 26.1261ZM52.4663 27.8333H62.4592V25.8333H52.4663V27.8333ZM50.9663 26.3333C50.9663 27.1617 51.6379 27.8333 52.4663 27.8333V25.8333C52.7425 25.8333 52.9663 26.0571 52.9663 26.3333H50.9663ZM52.4663 24.8333C51.6379 24.8333 50.9663 25.5048 50.9663 26.3333H52.9663C52.9663 26.6094 52.7425 26.8333 52.4663 26.8333V24.8333ZM63.666 24.8333H52.4663V26.8333H63.666V24.8333ZM63.6663 24.8333H63.666V26.8333H63.6663V24.8333ZM63.8095 24.8401C63.7619 24.8355 63.7141 24.8333 63.6663 24.8333V26.8333C63.6505 26.8333 63.6347 26.8325 63.619 26.831L63.8095 24.8401ZM64.24 24.9472C64.1011 24.8897 63.9559 24.8541 63.8096 24.8401L63.619 26.831C63.5706 26.8264 63.5221 26.8146 63.4754 26.7952L64.24 24.9472ZM64.727 25.2726C64.5845 25.1301 64.4184 25.0209 64.2401 24.9472L63.4754 26.7952C63.4151 26.7702 63.3594 26.7334 63.3128 26.6868L64.727 25.2726Z' fill='%230F1022'/%3E%3C/svg%3E",
        "name": "more",
        "label": "More networks",
        "href": "https://portalbridge.com/#/transfer",
        "showOpenInNewIcon": false,
      }
    ]
  }
  ...
}
```

### More Tokens

Show a special entry on the select tokens modal which redirects the user to a different page/dApp/mobile app.

|Property|description||
|:--|:--|:--:|
|`moreTokens.label`| Display text | mandatory|
|`moreTokens.href`| URL to redirect to. If present, the values `{:sourceChain}` and `{:targetChain}` are replaced with the selected currently selected chains before redirecting | mandatory|
|`moreTokens.target`| href target | optional, defaults to `_self`


### Explorer 

Enable explorer button to allow users to search for his transactions on a given explorer filtering by his wallet address

|Property|description||
|:--|:--|:--:|
|`explorer.label`| Display text | optional, defaults to `Transactions`|
|`explorer.href`| URL of the explorer, for instance https://wormholescan.com/. If present, the values `{:address}` is replaced with the connected wallet address| mandatory|
|`explorer.target`| href target | optional, defaults to `_blank`