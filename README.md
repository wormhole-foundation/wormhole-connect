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
yarn link
cd ../wormhole-connect
yarn link @wormhole-foundation/wormhole-connect-sdk
```

2) Install

Run `yarn` at the root of the repo

3) Start

```bash
# in /wormhole-connect
yarn start # testnet
yarn start-prod # mainnet

# in /builder
yarn start
```
