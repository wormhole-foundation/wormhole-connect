# Wormhole Connect

Integration does not get easier than this. Wormhole Connect is an easy seamless experience that will help to bring all the functionality of the Wormhole Token Bridge right into your application.

## Integration instructions

1. (optional) Create a JSON config with customized values:

```ts
{
  "environment": "testnet",
  "networks": ["goerli", "mumbai"],
  "tokens": ["ETH", "WETH", "MATIC", "WMATIC"],
  "mode": "light"
  "customTheme": {} // import `Theme`
}
```

### Accepted values

Environment:
| Mainnet    | Testnet   |
| ---------- | --------- |
| mainnet    | testnet   |

Chains:
| Mainnet    | Testnet   |
| ---------- | --------- |
| ethereum   | goerli    |
| polygon    | mumbai    |
| bsc        | bsc       |
| avalanche  | fuji      |
| celo       | avalanche |
| moonbeam   | moonbase  |
| solana     | solana    |

Tokens:
| Mainnet | Testnet |
| ------- | ------- |
| ETH     | ETH     |
| WETH    | WETH    |
| USDC    | USDC    |
| MATIC   | MATIC   |
| WMATIC  | WMATIC  |
| BNB     | BNB     |
| WBNB    | WBNB    |
| AVAX    | AVAX    |
| WAVAX   | WAVAX   |
| FTM     | FTM     |
| WFTM    | WFTM    |
| CELO    | CELO    |
| GLMR    | GLMR    |
| WGLMR   | WGLMR   |
| SOL     | WSOL    |

Mode:
|      |       |
| ---- | ----- |
| dark | light |

Custom theme:

```js
import { dark, light, Theme } from '@wormhole-foundation/wormhole-connect';
```

2. Add a script and link tag

```html
<!-- paste below into index.html body -->
<script src="https://wormhole-foundation.github.io/wormhole-connect/main.js"></script>
<script src="https://wormhole-foundation.github.io/wormhole-connect/718.06852233.chunk.js"></script>
<link rel="https://wormhole-foundation.github.io/wormhole-connect/main.ba17183d.css" />
```

3. Embed it in your application

This is where your widget will appear. Specify an id of `wormhole-connect` and pass it the stringified json config to customize.

```jsx
// root element with id
<div id="wormhole-connect"></div>
// with customization
<div id="wormhole-connect" config='{"networks": ["goerli", "mumbai"], "tokens": ["ETH", "WETH", "MATIC", "WMATIC"], "theme": "light"}'></div>
// stringify JSON config
<div id="wormhole-connect" config={JSON.stringify(jsonConfig)} />
```

### React Applications

For React applications, you must add the script tags after the dom has been rendered:

```ts
class WormholeConnect extends React.Component {
  componentDidMount() {
    const version = '0.0.1-beta.0';
    const script = document.createElement("script");
    script.src = `https://www.unpkg.com/@wormhole-foundation/wormhole-connect@${version}/dist/main.js`;
    script.async = true;

    const link = document.createElement("link");
    link.href = `https://www.unpkg.com/@wormhole-foundation/wormhole-connect@${version}/dist/main.css`;

    document.body.appendChild(link);
    document.body.appendChild(script);
  }

  render() {
    return <div id="wormhole-connect"></div>
  }
}
```
