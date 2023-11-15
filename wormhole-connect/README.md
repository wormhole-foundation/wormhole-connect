# Wormhole Connect

Integration does not get easier than this. Wormhole Connect is an easy seamless experience that will help to bring all the functionality of the Wormhole Token Bridge right into your application.

## Customizer

Customize and integrate via our no-code solution: https://connect-in-style.wormhole.com/

## Integration instructions

1. (optional) Create a JSON config with customized values:

```ts
{
  // accepted values for testnet:
  //  ["goerli", "mumbai", "bsc", "fuji", "fantom", "alfajores", "moonbasealpha", "solana", "sui", "aptos", "sei", "arbitrumgoerli", "optimismgoerli", "basegoerli"]
  // accepted values for mainnet:
  //  ["ethereum", "bsc", "polygon", "avalanche", "fantom", "celo", "moonbeam", "solana", "sui", "aptos", "arbitrum", "optimism", "base"]
  "networks": ["goerli", "mumbai"],
  // accepted values: "ETH", "WETH", "USDC", "MATIC", "WMATIC", "BNB", "WBNB", "AVAX", "WAVAX", "FTM", "WFTM", "CELO
  "tokens": ["ETH", "WETH", "MATIC", "WMATIC"],
  // accepted values: "light", "dark" or custom (future)
  "theme": "light"
}
```

> See the full config for supported chains [here](https://github.com/wormhole-foundation/wormhole-connect/tree/development/wormhole-connect/src/config)

2. Add a script and link tag

```html
<!-- paste below into index.html body -->
<script src="https://wormhole-foundation.github.io/wormhole-connect/main.js"></script>
<script src="https://wormhole-foundation.github.io/wormhole-connect/718.06852233.chunk.js"></script>
<link
  rel="https://wormhole-foundation.github.io/wormhole-connect/main.ba17183d.css"
/>
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
    const link = document.createElement('link');
    link.src =
      'https://wormhole-foundation.github.io/wormhole-connect/main.ba17183d.css';
    link.async = true;

    const script1 = document.createElement('script');
    script1.src =
      'https://wormhole-foundation.github.io/wormhole-connect/718.06852233.chunk.js';
    script1.async = true;

    const script2 = document.createElement('script');
    script2.src =
      'https://wormhole-foundation.github.io/wormhole-connect/main.js';
    script2.async = true;

    document.body.appendChild(link);
    document.body.appendChild(script1);
    document.body.appendChild(script2);
  }

  render() {
    return <div id="wormhole-connect"></div>;
  }
}
```
