# Wormhole Connect

Wormhole Connect is a project to facilitate integration with the Wormhole protocol. It is thus far comprised of 3 components: wormhole-connect, sdk and builder. Below is a brief introduction on each, see the corresponding READMEs for more information.

### wormhole-connect

An app that brings all the functionality and utility of the Wormhole token bridge right into your application and removes all of the complexity. It is is built to be embedded within any application, simply copy a script tag or (future) install the npm package. Optionally, configure a number of parameters such as supported chains/tokens and theme.

### sdk

The beginning of a refactor of the existing sdk. It is written in Typescript and is built with ease-of-use in mind. It is organized into different `context` classes (i.e. evm, solana, terra, etc) which each implement the same methods with standardized parameters.

### builder

Initially this serves as a way to test integrating wormhole-connect. In the future, this will become a playground where developers can come to customize their integration by selecting the chain and tokens they would like to support as well as edit theme variables to make it blend seamlessly within their application.

## Setup

1) Link the sdk

```bash
cd ./sdk
npm i
npm run build
npm link
cd ../wormhole-connect
npm link @wormhole-foundation/wormhole-connect-sdk
```

2) Install

Run `npm i` at the root of the repo

3) Start

Start wormhole-connect UI and view in browser at localhost:3000
```bash
# in /wormhole-connect
npm run start # testnet
```

Start builder UI and view in browser at localhost:3000
```bash
# in /builder
npm run start
```

Render Connect with the following code 

```html
<!-- include in <head> -->
<script src="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.1-beta.2/dist/main.js" defer></script>
<link rel="https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.1-beta.2/dist/main.css" />

<!-- include in <body> -->
<div id="wormhole-connect"></div>
```

OR

```javascript
import WormholeBridge from '@wormhole-foundation/wormhole-connect';
function App() {
  return (
    <WormholeBridge />
  );
}
```

## Disclaimer

This SDK is an open source software SDK that leverages the Wormhole protocol, a cross chain messaging protocol. The SDK does not process payments. THIS SDK AND THE WORMHOLE PROTOCOL ARE PROVIDED "AS IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND. By using or accessing this SDK or Wormhole, you agree that no developer or entity involved in creating, deploying, maintaining, operating this SDK or Wormhole, or causing or supporting any of the foregoing, will be liable in any manner for any claims or damages whatsoever associated with your use, inability to use, or your interaction with other users of, this SDK or Wormhole, or this SDK or Wormhole themselves, including any direct, indirect, incidental, special, exemplary, punitive or consequential damages, or loss of profits, cryptocurrencies, tokens, or anything else of value. By using or accessing this SDK, you represent that you are not subject to sanctions or otherwise designated on any list of prohibited or restricted parties or excluded or denied persons, including but not limited to the lists maintained by the United States' Department of Treasury's Office of Foreign Assets Control, the United Nations Security Council, the European Union or its Member States, or any other government authority.

Wormhole Connect is an NPM package that interacts with the Wormhole protocol. You assume all risks associated with using the SDK, the Wormhole protocol, and digital assets and decentralized systems generally, including but not limited to, that: (a) digital assets are highly volatile; (b) using digital assets is inherently risky due to both features of such assets and the potential unauthorized acts of third parties; (c) you may not have ready access to assets; and (d) you may lose some or all of your tokens or other assets. You agree that you will have no recourse against anyone else for any losses due to the use of the SDK or Wormhole. For example, these losses may arise from or relate to: (i) incorrect information; (ii) software or network failures; (iii) corrupted cryptocurrency wallet files; (iv) unauthorized access; (v) errors, mistakes, or inaccuracies; or (vi) third-party activities.
