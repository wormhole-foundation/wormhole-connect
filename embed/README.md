# Wormhole Connect

Integration does not get easier than this. We are developing an easy seamless experience that will help to bring all the functionality of the Wormhole Token Bridge right into your application. It will be fully customizable, you will be able to configure which chains and tokens to support as well as customize the appearance.

Bear in mind that this is still under development, but we appreciate any feedback or suggestions you can offer.

## Integration instructions

1. Create a JSON config:

```json
{
  // accepted values: "goerli", "polygon", "bsc", "fuji", "fantom", "alfajores"
  "networks": ["goerli", "polygon"],
  // accepted values: "ETH", "WETH", "USDC", "MATIC", "WMATIC", "BNB", "WBNB", "AVAX", "WAVAX", "FTM", "WFTM", "CELO
  "tokens": ["ETH", "WETH", "MATIC", "WMATIC"],
  // accepted values: "light", "dark" or custom (future)
  "theme": "light"
}
```

2. Add a script and link tag

```html
<link href="TODO" rel="stylesheet" />
<script src="TODO"></script>
```

3. Embed it in your application

This is where your widget will appear. Specify an id of `wormhole-connect` and pass it the stringified json.

```jsx
<div id="wormhole-connect" config={JSON.stringify(jsonConfig)} />
```
