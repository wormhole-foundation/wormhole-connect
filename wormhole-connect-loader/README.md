# Wormhole Connect

Integration does not get easier than this. Wormhole Connect is an easy seamless experience that will help to bring all the functionality of the Wormhole Token Bridge right into your application.

## Integrate with script/link tags

> IMPORTANT! For the best performance and functionality, you should provide your own custom rpc endpoints for each supported network.

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
| Mainnet    | Testnet   |
| ---------- | --------- |
| mainnet    | testnet   |

<br>

Networks (`networks`):
| Mainnet    | Testnet       |
| ---------- | ------------- |
| ethereum   | goerli        |
| polygon    | mumbai        |
| bsc        | bsc           |
| avalanche  | fuji          |
| celo       | avalanche     |
| moonbeam   | moonbasealpha |
| solana     | solana        |
| sui        | sui           |
| aptos      | aptos         |
| base       | basegoerli    |

<br>

Tokens (`tokens`):
| Mainnet     | Testnet  |
| ----------- | -------- |
| ETH         | ETH      |
| WETH        | WETH     |
| USDCeth     | USDCeth  |
| WBTC        |          |
| USDT        |          |
| DAI         |          |
| BUSD        |          |
| MATIC       | MATIC    |
| WMATIC      | WMATIC   |
| USDCpolygon |          |
| BNB         | BNB      |
| WBNB        | WBNB     |
| USDCbnb     |          |
| AVAX        | AVAX     |
| WAVAX       | WAVAX    |
| USDCavax    |          |
| FTM         | FTM      |
| WFTM        | WFTM     |
| CELO        | CELO     |
| GLMR        | GLMR     |
| WGLMR       | WGLMR    |
| SOL         | WSOL     |
| SUI         | SUI      |
| USDCsol     |          |
| APT         | APT      |
| ETHbase     | ETHbase  |
| WETHbase    | WETHbase |


<br>

Mode (`mode`):
|      |       |
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
<div id="wormhole-connect" config='{"env":"mainnet","tokens":["ETH","WETH","WBTC","USDCeth"]}' />
```

### 2. Add a script and link tag

```html
<!-- paste below into index.html body -->
<script src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.8/dist/main.js"></script>
<link href="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.8/dist/main.css" />
```

Note that the `wormhole-connect` div with your config has to be present _before_ the scripts are loaded.  If your application loads it after, you may need to add the scripts like this:

```js
function mount () {
  const script = document.createElement("script");
  script.src = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.6/dist/main.js";
  script.async = true;

  const link = document.createElement("link");
  link.href = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.6/dist/main.css";

  document.body.appendChild(script);
  document.body.appendChild(link);
}
```

## Integrate with React

```jsx
import WormholeBridge from '@wormhole-foundation/wormhole-connect';
function App() {
  return (
    <WormholeBridge />
  );
}
```

(Optional) Specify supported networks/tokens and custom RPC endpoints. Your users may encounter rate limits using public RPC endpoints if you do not provide your own
```jsx
import WormholeBridge, { WormholeConnectConfig } from '@wormhole-foundation/wormhole-connect';
const config: WormholeConnectConfig = {
  env: "mainnet",
  networks: ["ethereum", "polygon", "solana"],
  tokens: ["ETH", "WETH", "MATIC", "WMATIC"],
  rpc: {
    ethereum: "https://rpc.ankr.com/eth",
    solana: "https://rpc.ankr.com/solana",
  }
}

function App() {
  return (
    <WormholeBridge config={config} />
  );
}
```

(Optional) Customize theme
```jsx
import WormholeBridge, { light, Theme, WormholeConnectConfig } from '@wormhole-foundation/wormhole-connect';
import lightblue from '@mui/material/colors/lightBlue';

// alters the `light` theme
const customized: Theme = light;
customized.success = lightblue;
customized.background.default = 'transparent';
customized.button.action = '#81c784';
customized.button.actionText = '#000000';

const config: WormholeConnectConfig = {
  mode: 'light',
  customTheme: customized,
}

function App() {
  return (
    <WormholeBridge config={config} />
  );
}
```

(Optional) Create fully customized theme
```jsx
import WormholeBridge, { Theme, OPACITY, WormholeConnectConfig } from '@wormhole-foundation/wormhole-connect';
import lightblue from '@mui/material/colors/lightBlue';
import grey from '@mui/material/colors/grey';
import green from '@mui/material/colors/green';
import orange from '@mui/material/colors/orange';

const customized: Theme = {
  primary: grey,
  secondary: grey,
  divider: '#ffffff' + OPACITY[20],
  background: {
    default: '#232323',
  },
  text: {
    primary: '#ffffff',
    secondary: grey[500],
  },
  error: red,
  info: lightblue,
  success: green,
  warning: orange,
  button: {
    primary: '#ffffff' + OPACITY[20],
    primaryText: '#ffffff',
    disabled: '#ffffff' + OPACITY[10],
    disabledText: '#ffffff' + OPACITY[40],
    action: orange[300],
    actionText: '#000000',
    hover: '#ffffff' + OPACITY[7],
  },
  options: {
    hover: '#474747',
    select: '#5b5b5b',
  },
  card: {
    background: '#333333',
    secondary: '#474747',
    elevation: 'none',
  },
  popover: {
    background: '#1b2033',
    secondary: '#ffffff' + OPACITY[5],
    elevation: 'none',
  },
  modal: {
    background: '#474747',
  },
};
const config: WormholeConnectConfig = {
  mode: 'dark',
  customTheme: customized,
}

function App() {
  return (
    <WormholeBridge config={config} />
  );
}
```
