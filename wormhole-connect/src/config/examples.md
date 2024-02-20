
# Wormhole Connect - `config` examples

## Environment

This shows how to run Connect on mainnet.

```json
{
  "env": "mainnet"
}
```

## Custom RPC Endpoint

This shows how to change which RPC provider Connect uses for a particular network.

```json
{
  "rpcs": {
    "solana": "https://rpc.ankr.com/solana/ee827255553bb0fa9e0aaeab27e988707e60ea06ae36be0658b778072e94979e"
  }
}
```

## Arbitrary Token

This shows how to add an arbitrary token to your deployment of Connect.
Please note you will need to [register](https://portalbridge.com/advanced-tools/#/register)
your token with the Token Bridge to get the contract addresses necessary for it to work with Connect.

Thise example config limits Connect to the Solana and Ethereum networks,
and a handful of tokens including `BSKT` which is not built in by default
and provided under the `tokensConfig` key.

See [src/config/types.ts](https://github.com/wormhole-foundation/wormhole-connect/blob/development/wormhole-connect-loader/src/config/types.ts)
for the type definition of `TokensConfig`.

```json
{
  "networks": ["solana", "ethereum"],
  "tokens": ["ETH", "WETH", "MATIC", "WMATIC", "BSKT"],
  "tokensConfig": {
    "BSKT": {
      "key": "BSKT",
      "symbol": "BSKT",
      "nativeChain": "solana",
      "tokenId": {
        "chain": "solana",
        "address": "6gnCPhXtLnUD76HjQuSYPENLSZdG8RvDB1pTLM5aLSJA"
      },
      "coinGeckoId": "basket",
      "icon": "https://assets.coingecko.com/coins/images/34661/standard/BSKT_Logo.png?1705636891",
      "color": "#2894EE",
      "decimals": {
        "default": 5
      },
      "foreignAssets": {
        "ethereum": {
          "address": "0xbC0899E527007f1B8Ced694508FCb7a2b9a46F53",
          "decimals": 5
        },
        "bsc": {
          "address": "0xaF42A5df3C1C1427DA8FC0326bD7b030A9367e78",
          "decimals": 5
        },
        "polygon": {
          "address": "0x9a6a40CdF21a0AF417F1b815223FD92c85636c58",
          "decimals": 5
        },
        "avalanche": {
          "address": "0x6Ac048ae05E7E015accA2aA7Abd0Ec013e8E3a59",
          "decimals": 5
        },
        "sui": {
          "address": "0xd4d52a6bf452401c0c70a1d19ff6cec2933f22a548eae552f3e514f64f61703a::coin::COIN",
          "decimals": 5
        },
        "arbitrum": {
          "address": "0xa3210cd727fE6DAf8386af5623ba51A367E46263",
          "decimals": 5
        },
        "base": {
          "address": "0x7CCDbA6198db389cF37b714FD6573b73F3670236",
          "decimals": 5
        },
        "celo": {
          "address": "0x3fc50bc066aE2ee280876EeefADfdAbF6cA02894",
          "decimals": 5
        }
      }
    }
  }
}
```
