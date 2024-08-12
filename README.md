# Wormhole Connect
[![Documentation](https://img.shields.io/badge/Documentation-2a67c9)](https://docs.wormhole.com/wormhole/wormhole-connect/overview) [![npm version](https://img.shields.io/npm/v/@wormhole-foundation/wormhole-connect.svg)](https://www.npmjs.com/package/@wormhole-foundation/wormhole-connect) ![CI build](https://github.com/wormhole-foundation/wormhole-connect/actions/workflows/build.yml/badge.svg)

Wormhole Connect is a customizable React widget for cross-chain asset transfers powered by Wormhole.

[![Wormhole Connect running on Portal Bridge](https://i.imgur.com/sZJKw8e.png)](https://portalbridge.com/)

## Demo

Wormhole Connect is deployed live in several production apps. Here are a few:

- [Portal Bridge](https://portalbridge.com/)
- [Jupiter](https://jup.ag/bridge/wormhole)
- [PancakeSwap](https://bridge.pancakeswap.finance/wormhole)


## Getting Started 

### Via NPM for React apps (Recommended)

If you're using React, you can import the `<WormholeConnect />` component directly into your JSX:

#### Installation

```bash
npm i @wormhole-foundation/wormhole-connect
```

#### Using the component

```javascript
import WormholeConnect from '@wormhole-foundation/wormhole-connect';

function App() {
  return (
    <WormholeConnect />
  );
}
```

### Alternative: hosted version via CDN (for any website)

If you're not using React, you can still embed Connect on your website by using the hosted version. Simply copy and paste the following code into your HTML body:

```html
<!-- Mounting point. Include in <body> -->
<div id="wormhole-connect"></div>

<!-- Dependencies -->
<script type="module" src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.3.0/dist/main.js" defer></script>
<link rel="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.3.0/dist/main.css" />
```

Note that the `#wormhole-connect` element has to be present _before_ the scripts are loaded.

You can customize and integrate Connect via our no-code solution: https://connect-in-style.wormhole.com/

## Configuration

Wormhole Connect is highly customizable via two props: `config` and `theme`. Here is an example which
limits it to two chains and customizes the background color:

```tsx
import WormholeConnect, {
  WormholeConnectConfig, WormholeConnectPartialTheme
} from '@wormhole-foundation/wormhole-connect';

const config: WormholeConnectConfig = {
  networks: ['Ethereum', 'Solana']
};

const theme: WormholeConnectPartialTheme = {
  background: {
    default: '#212b4a'
  }
};

function App() {
  return (
    <WormholeConnect config={config} theme={theme} />
  )
}
```

If using the hosted version, provide `config` and `theme` as JSON-serialized strings on the mount point:

```html
<div id="wormhole-connect" data-config="{...}" data-theme="{...}"></div>
```

Below are some of the more commonly used config options. See
[the full Connect docs](https://docs.wormhole.com/wormhole/wormhole-connect/overview) for more complete
documentation and examples of the different config options.

### Environment (`env`):

Connect renders in mainnet mode by default, but you can switch it to testnet by setting `env` to `testnet`.

```ts
const config: WormholeConnectConfig = {
  env: 'testnet'
}
```

### RPC Endpoints (`rpcs`):

We strongly recommend that you configure your own custom RPC endpoints for each network your application needs. The default public RPCs may be throttled or rate limited.

```ts
const config: WormholeConnectConfig = {
  rpcs: {
    Solana: 'https://mainnet.helius-rpc.com/?api-key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    Ethereum: 'https://rpc.ankr.com/eth/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  }
}
```

### Custom Tokens (`tokensConfig`)

You can add arbitrary tokens to the Connect tokens menu by providing a `tokensConfig` key.

```ts
const config: WormholeConnectConfig = {
  tokensConfig: {
    ...
  }
}
```

See the "Arbitrary Token" example in [the config docs](https://docs.wormhole.com/wormhole/wormhole-connect/configuration#arbitrary-token).

Please note you have to [register a token](https://portalbridge.com/advanced-tools/#/register) with the token bridge before you can use it in Connect.

### Configuring Custom NTT (Native Token Transfer) Groups
To configure custom NTT groups, include an `nttGroups` key in your configuration.

```ts
const config: WormholeConnectConfig = {
  nttGroups: {
    // Your custom NTT groups go here
  }
}
```

For a practical example of how to structure your custom NTT groups, refer to the [nttGroups.ts](https://github.com/wormhole-foundation/wormhole-connect/blob/development/wormhole-connect/src/config/testnet/nttGroups.ts) file.

Please note that the `tokenKey` specified in your custom NTT group must correspond to an existing entry in the tokensConfig, whether it's a built-in or a custom token.

### Custom Theme

You can also customize Connect's color scheme by providing a `WormholeConnectTheme` as the `theme` prop.
By default, Connect renders using the `dark` theme.

```jsx
import WormholeConnect, {
  dark,
  WormholeConnectTheme,
} from "@wormhole-foundation/wormhole-connect";

// alters the `dark` theme
const customized: WormholeConnectTheme = dark;
customized.success = '#212b4a';
customized.background.default = "navy";
customized.button.action = "#81c784";
customized.button.actionText = "#000000";

export default function App() {
  return <WormholeConnect theme={customized} />;
}
```

You can change the `theme` prop to dynamically change Connect's colors, for example when your application
switches from light to dark mode.

See the definitions of `WormholeConnectTheme` and `dark` in [theme.ts](https://github.com/wormhole-foundation/wormhole-connect/blob/development/wormhole-connect/src/theme.ts) for type definitions.

### Choosing Networks (`networks`):

You can provide a whitelist of networks to limit which ones Connect offers.


```ts
const config: WormholeConnectConfig = {
  networks: ['Ethereum', 'Solana']
}
```

By default, it offers its full built-in list for both `mainnet` and `testnet`:

| `mainnet` | `testnet` |
| ---------- | ------------- |
| Ethereum | Sepolia |
| Polygon | |
| Bsc | Bsc |
| Avalanche | Avalanche |
| Celo | Celo |
| Moonbeam | Moonbeam |
| Solana | Solana |
| Sui | Sui |
| Aptos | Aptos |
| Base | BaseSepolia |
| Osmosis | Osmosis |
| Evmos | Evmos |
| Kujira | Kujira |
| Injective | Injective |
| Klaytn | Klaytn |
| Arbitrum | ArbitrumSepolia |
| Optimism | OptimismSepolia |
| Scroll | Scroll |
| Blast | Blast |
| Xlayer | Xlayer |

> Osmosis support is in beta, reach out to a Wormhole contributor for early access.

### Learn More

Please read [the full Connect documentation](https://docs.wormhole.com/wormhole/wormhole-connect/overview) to see what else is possible!

## Contributing

We welcome contributions and bug fixes. Please see [CONTRIBUTING.md](https://github.com/wormhole-foundation/wormhole-connect/blob/development/CONTRIBUTING.md)


## Disclaimer

This SDK is an open source software SDK that leverages the Wormhole protocol, a cross chain messaging protocol. The SDK does not process payments. THIS SDK AND THE WORMHOLE PROTOCOL ARE PROVIDED "AS IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND. By using or accessing this SDK or Wormhole, you agree that no developer or entity involved in creating, deploying, maintaining, operating this SDK or Wormhole, or causing or supporting any of the foregoing, will be liable in any manner for any claims or damages whatsoever associated with your use, inability to use, or your interaction with other users of, this SDK or Wormhole, or this SDK or Wormhole themselves, including any direct, indirect, incidental, special, exemplary, punitive or consequential damages, or loss of profits, cryptocurrencies, tokens, or anything else of value. By using or accessing this SDK, you represent that you are not subject to sanctions or otherwise designated on any list of prohibited or restricted parties or excluded or denied persons, including but not limited to the lists maintained by the United States' Department of Treasury's Office of Foreign Assets Control, the United Nations Security Council, the European Union or its Member States, or any other government authority.

Wormhole Connect is an NPM package that interacts with the Wormhole protocol. You assume all risks associated with using the SDK, the Wormhole Connect NPM package, the Wormhole protocol, and digital assets and decentralized systems generally, including but not limited to, that: (a) digital assets are highly volatile; (b) using digital assets is inherently risky due to both features of such assets and the potential unauthorized acts of third parties; (c) you may not have ready access to assets; and (d) you may lose some or all of your tokens or other assets. You agree that you will have no recourse against anyone else for any losses due to the use of the SDK or Wormhole. For example, these losses may arise from or relate to: (i) incorrect information; (ii) software or network failures; (iii) corrupted cryptocurrency wallet files; (iv) unauthorized access; (v) errors, mistakes, or inaccuracies; or (vi) third-party activities.


