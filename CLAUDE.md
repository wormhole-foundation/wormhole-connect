Wormhole Connect is an open-source React component frontend for the Wormhole SDK (@wormhole-foundation/sdk).

The purpose of Wormhole Connect is to be an easy way for web3/defi web apps to add a bridging feature.
Connect is used by many integrators. As such, Connect is highly customizable.

## Project Structure

Key directories include:
- `src/` - Main source code for the React component
- `lib/` - Built library output (gitignored)
- `dist/` - Distribution files (gitignored)
- `scripts/` - Build and utility scripts
- `tests/` - E2E tests using Playwright

## Commands

**Build**
- `npm run build:lib` - Main command to build the library
- `npm run lint` - Run ESLint checks
- `npm run lint:ci` - Stricter ESLint checks which run on GitHub CI

**Development**
- `npm run dev` - Start development server

## Important Files

- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts
- `src/exports/` - Different package entrypoints (executor, hosted, mayan, ntt)

## Code Style

- Uses Prettier with 2-space indentation, single quotes, trailing commas
- ESLint is configured with both standard and strict rule sets
- TypeScript is used throughout the codebase
