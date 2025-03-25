# Running E2E Tests Locally

This guide provides instructions on how to run the Playwright E2E tests for Connect locally.

## Prerequisites

Before running the tests, ensure you have the following installed:

- Node.js (version 20 or later)
- npm (Node Package Manager)

## Setup

1. **Install dependencies**

   Make sure you have clean installed all dependencies:

   ```sh
   npm ci
   ```

2. **Install Playwright chromium browser**

   ```sh
   npx playwright install chromium --with-deps
   ```

3. **Set up environment variables**

   Make sure you have these variables added to your environment. You can add them to `.env` or `.env.local` files as well.

   ```env
   REACT_APP_TEST_EVM_ADDR=your_test_wallet_address
   REACT_APP_TEST_EVM_PK=your_test_wallet_private_key
   REACT_APP_TEST_CG_AK=your_coingecko_api_key
   ```

4. **Setup RPC endpoints**

   Make sure you have RPC endpoints configured as calling from localhost to default (free) RPCs might fail to fetch token balances.

## Running the Tests

1. **Local dev server**

   You do not need to run a local dev server before the tests as Playwright will start it automatically. If you already have a local dev server running at `http://localhost:5173/`, Playwright will use it as well.

2. **Run all tests**

   You can run all tests headless with:

   ```sh
   npm run test:e2e
   ```

   Or with Playwright UI:

   ```sh
   npm run test:e2e:ui
   ```

3. **Run a specific test**

   You can pass the path to a test file to run that one specifically:

   ```sh
   npm run test:e2e tests/e2e/specs/your-test-file.spec.ts
   ```

4. **Generate and view a test report**

   To generate and view a test report, use the following command:

   ```sh
   npx playwright show-report
   ```

## Debugging

To debug tests, you can run Playwright in UI mode:

```sh
npm run test:e2e:ui
```

This will open a browser window and allow you to see the tests running in real-time.
