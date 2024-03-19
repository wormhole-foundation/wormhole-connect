## Contributing

Contributions are welcome! To work on wormhole-connect locally you'll want to use `npm link` to make the changes to the SDK immediately available.

### Setup

1) Install

Run `npm i` at the root of the repo

2) Build

Run `npm run build` at the root fo the repo

3) Start

Start wormhole-connect UI:
```bash
# in /wormhole-connect
npm run start # testnet
```

Start builder UI:
```bash
# in /builder
npm run start
```

## Add a token

### Fill out token config

1. Create an entry for the token in `wormhole-connect/config/<mainnet/testnet>.ts`.
2. Ensure the `key` value is equal to the object key for easy lookup.
3. Add decimal values for default, Ethereum, Solana and Sui if applicable (i.e. if they vary from the default value)
4. If it's a native gas token, ensure that the wrapped version is also present and linked under `wrappedAsset`

### Add a token icon

1. Create a file under `icons/Tokens` labeled `<symbol>.tsx`.
2. Create a React component and paste the svg in the return.
3. Modify the svg to comply with react (mostly this is renaming attribute names with hyphens e.g. `view-box` to `viewBox`)
4. Ensure the width and height attributes are present on the root `<svg>` element and max height and width are set (`style={{ maxHeight: '100%', maxWidth: '100%' }}`)

## Setup

### Pre-commit hooks

Set up your pre-commit hook:

```bash
echo "./pre-commit.sh" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
chmod +x ./pre-commit.sh
```

## Maintaining OFAC sanctioned wallet list

From time to time, the CI may fail with the following error:

```
New addresses found, please update `SANCTIONED_WALLETS` in `src/consts/wallet.ts`.
```

This means that the list of sanctioned wallets has changed. To update the list, run the following command, which grabs the updated list of addresses:

```sh
$ ts-node wormhole-connect/scripts/ofac/getSdnList.ts
```

Copy the outputted list and paste it into `src/consts/wallet.ts` as the value of `SANCTIONED_WALLETS`.

## Publishing a pre release package to NPM

1. Make a GitHub pre-release
2. Tag it `development@0.1.3-beta.0`
3. Trigger the 'publish' GitHub action and fill in the tag when prompted, which will publish to NPM

## Publishing a production package to NPM

1. Make a GitHub release
2. Tag it `production@0.1.3`
3. Trigger the 'publish' GitHub action and fill in the tag when prompted, which will publish to NPM
