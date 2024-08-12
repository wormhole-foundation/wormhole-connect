## Wormhole Connect SDK

An SDK that wraps the core Wormhole SDK and provides a convenient API to interact with the Wormhole Token Bridge protocol.

Here is an example showing how to send a token across chains using this SDK:

```ts
const context = new WormholeContext('MAINNET');

// interact easily with any chain!
// supports EVM, Solana, Terra, etc
const tokenId = {
  chain: 'Ethereum',
  address: '0x123...',
};

const receipt = context.send(
  tokenId,
  '10', // amount
  'Ethereum', // sending chain
  '0x789...', // sender address
  'Moonbeam', // destination chain
  '0x789...', // recipient address on destination chain
);
```
