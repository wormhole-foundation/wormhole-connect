## Overview

This repository has 3 important, protected branches: `development` (default), `staging` and `production`.

- Day-to-day development happens targeting the default `development` branch.
- Periodically, a release is cut from the development branch by merging it into `staging`. At that point, the staging branch may be deployed in a test environment for testing on testnets. We aim to keep the staging branch stable.
- Once the new development(s) have been tested in the test environment, the `staging` branch is merged into the `production` branch. After a period of testing on mainnet, the NPM package will be updated from the `production` branch.
- Release notes for the `staging` branch will be marked as "pre-release". Release notes for the `production` branch will be marked as regular releases.

We aim to use GitHub Issues as the task management system to track work.

- If you'd like to contribute but unsure what, refer to the list of open tasks in the issue list.
- We always welcome pull requests that improve Wormhole Connect. In case you would like to work on a specific task, please let us know by commenting in the issue. Be sure to reference the original task in the PR(s) that you submit.
- Discussion threads are an excellent place to discuss future improvement plans or ask the maintainers any questions. If you have a cool idea for Wormhole Connect, open a discussion thread about it.
- If you notice a problem but you're unsure how to fix it, please open a new issue if the problem hasn't been reported yet.

## Publish to NPM

1. Create a PR against `production`
2. In `/sdk`, run `npm i && npm run lint && npm run build`
3. In `/wormhole-connect`, run `npm i && npm run lint && npm run build`
4. Copy `/wormhole-connect/build/static/js/main.xxxxx.js` and `/wormhole-connect/build/static/css/main.xxxxx.css` into `wormhole-connect-loader/dist`. Rename to `main.js` and `main.css` respectively.
5. Bump the version in `/wormhole-connect-loader` package.json
6. Update the script/link tag links to match the version that will be published (e.g. "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.1-beta.1/dist/main.js")
7. In `/wormhole-connect-loader`, run `npm i && npm run build`
8. Wait for PR approval
9. Create a tag (e.g. `wormhole-connect@0.0.1-beta.1`)
10. Release package from `/wormhole-connect-loader`

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
