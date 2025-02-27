# Wormhole Connect [![Documentation](https://img.shields.io/badge/Documentation-2a67c9)](https://docs.wormhole.com/wormhole/wormhole-connect/overview) [![npm version](https://img.shields.io/npm/v/@wormhole-foundation/wormhole-connect.svg)](https://www.npmjs.com/package/@wormhole-foundation/wormhole-connect) ![CI build](https://github.com/wormhole-foundation/wormhole-connect/actions/workflows/build.yml/badge.svg)

Wormhole Connect is a customizable React widget for cross-chain asset transfers powered by Wormhole.

[![Wormhole Connect running on Portal Bridge](https://i.imgur.com/KDoPxaD.png)](https://portalbridge.com/)

Connect is powered by the [Wormhole TypeScript SDK](https://github.com/wormhole-foundation/wormhole-sdk-ts). Developers interested in building their
own interface for Wormhole bridging functionality are encouraged to explore the SDK!

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

If you're not using React, you can still embed Connect on your website by using the hosted version:

```ts
import {
  wormholeConnectHosted,
} from '@wormhole-foundation/wormhole-connect';

const container = document.getElementById('connect')!;

wormholeConnectHosted(container);
```


You can provide `config` and `theme` parameters in a second function argument:

```ts
import {
  wormholeConnectHosted,
} from '@wormhole-foundation/wormhole-connect';

const container = document.getElementById('connect')!;

wormholeConnectHosted(container, {
  config: {
    rpcs: {
      ...
    }
  },
  theme: {
    background: {
      default: '#004547',
    }
  }
});
```

## Configuration

Wormhole Connect is highly customizable via two props: `config` and `theme`. Here is an example which
limits it to two chains and customizes the background color:

```tsx
import WormholeConnect, {
  WormholeConnectConfig, WormholeConnectPartialTheme
} from '@wormhole-foundation/wormhole-connect';

const config: WormholeConnectConfig = {
  chains: ['Ethereum', 'Solana']
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

### Network (`network`):

Values: `Mainnet` | `Testnet` | `Devnet`

Connect renders in Mainnet mode by default, but you can switch it to testnet by setting `network` to `Testnet`:

```ts
const config: WormholeConnectConfig = {
  network: 'Testnet'
}
```

### Choosing Chains (`chains`):

You can provide a whitelist of chains to limit which ones Connect offers.

```ts
const config: WormholeConnectConfig = {
  chains: ['Ethereum', 'Solana']
}
```

See [`chains.ts`](https://github.com/wormhole-foundation/wormhole-sdk-ts/blob/main/core/base/src/constants/chains.ts) in the SDK. By default, Connect offers a subset of chains for both `mainnet` and `testnet`:

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
| Arbitrum | ArbitrumSepolia |
| Optimism | OptimismSepolia |
| Scroll | Scroll |
| Blast | Blast |
| Xlayer | Xlayer |
| Mantle | Mantle |
| Worldchain | Worldchain |
| Unichain | Unichain |
| Berachain | |

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

### Configuring Custom NTT (Native Token Transfer) Tokens

To configure a custom NTT token, pass your NTT config to the `nttRoutes` helper function, which will add the NTT routes to the `routes` array. You can find the definition for the NTT config [here](https://github.com/wormhole-foundation/example-native-token-transfers/blob/6a1a3d9e6d1a2045fb1688c2b53c9ac145cb40bc/sdk/route/src/types.ts#L34).

```ts
const config: WormholeConnectConfig = {
  routes: [
    ...nttRoutes({
      tokens: {
        // Your custom NTT configs go here
        // See: https://github.com/wormhole-foundation/wormhole-connect/blob/9548507ca68dfd249bf84057889dc61553b17b5f/wormhole-connect/src/components/DemoApp/consts.ts#L3 for an example NTT config
      }
    })
    // other routes
  ]
}
```

Each `token` address specified in the NTT config must have a corresponding entry in `tokensConfig`, whether it is a built-in or custom token.

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

### Learn More

Please read [the full Connect documentation](https://docs.wormhole.com/wormhole/wormhole-connect/overview) to see what else is possible!

## Contributing

We welcome contributions and bug fixes. Please see [CONTRIBUTING.md](https://github.com/wormhole-foundation/wormhole-connect/blob/development/CONTRIBUTING.md)


## Disclaimer

This SDK is an open source software SDK that leverages the Wormhole protocol, a cross chain messaging protocol. The SDK does not process payments. THIS SDK AND THE WORMHOLE PROTOCOL ARE PROVIDED "AS IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND. By using or accessing this SDK or Wormhole, you agree that no developer or entity involved in creating, deploying, maintaining, operating this SDK or Wormhole, or causing or supporting any of the foregoing, will be liable in any manner for any claims or damages whatsoever associated with your use, inability to use, or your interaction with other users of, this SDK or Wormhole, or this SDK or Wormhole themselves, including any direct, indirect, incidental, special, exemplary, punitive or consequential damages, or loss of profits, cryptocurrencies, tokens, or anything else of value. By using or accessing this SDK, you represent that you are not subject to sanctions or otherwise designated on any list of prohibited or restricted parties or excluded or denied persons, including but not limited to the lists maintained by the United States' Department of Treasury's Office of Foreign Assets Control, the United Nations Security Council, the European Union or its Member States, or any other government authority.

Wormhole Connect is an NPM package that interacts with the Wormhole protocol. You assume all risks associated with using the SDK, the Wormhole Connect NPM package, the Wormhole protocol, and digital assets and decentralized systems generally, including but not limited to, that: (a) digital assets are highly volatile; (b) using digital assets is inherently risky due to both features of such assets and the potential unauthorized acts of third parties; (c) you may not have ready access to assets; and (d) you may lose some or all of your tokens or other assets. You agree that you will have no recourse against anyone else for any losses due to the use of the SDK or Wormhole. For example, these losses may arise from or relate to: (i) incorrect information; (ii) software or network failures; (iii) corrupted cryptocurrency wallet files; (iv) unauthorized access; (v) errors, mistakes, or inaccuracies; or (vi) third-party activities.

