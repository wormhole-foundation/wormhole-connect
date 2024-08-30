## Contributing

Bug fixes and enhancements are welcome!

*Please don't open pull requests to add tokens to Connect.* Instead, use the `tokensConfig` parameter in `config` to add tokens into your deployment of Connect.

### Setup

Development happens inside the `wormhole-connect` directory at the top level of the repo.

```
cd wormhole-connect
```

1) Install dependencies

```
npm i
```

2) Start demo app with Vite

```
npm run start
```

This should start a local server at localhost:5173.

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
