# Wormhole Connect

Integration does not get easier than this. We are developing an easy seamless experience that will help to bring all the functionality of the Wormhole Token Bridge right into your application. You will be able to customize what chains/tokens you support as well as customize the appearance.

Bear in mind that this is still under development, but we appreciate any feedback or suggestions you can offer.

## Integration instructions

1. (optional) Create a JSON config with customized values:

```ts
{
  // accepted values: "goerli", "mumbai", "bsc", "fuji", "fantom", "alfajores"
  "networks": ["goerli", "mumbai"],
  // accepted values: "ETH", "WETH", "USDC", "MATIC", "WMATIC", "BNB", "WBNB", "AVAX", "WAVAX", "FTM", "WFTM", "CELO
  "tokens": ["ETH", "WETH", "MATIC", "WMATIC"],
  // accepted values: "light", "dark" or custom (future)
  "theme": "light"
}
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
