## Setup

### Pre-commit hooks

Set up your pre-commit hook:

```bash
echo "./pre-commit.sh" > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
chmod +x ./pre-commit.sh
```

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
