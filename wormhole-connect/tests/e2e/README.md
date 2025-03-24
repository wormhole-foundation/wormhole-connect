# Running E2E Tests Locally

This guide provides instructions on how to run the Playwright E2E tests for Connect locally.

## Prerequisites

Before running the tests, ensure you have the following installed:

- Node.js (version 20 or later)
- npm (Node Package Manager)

## Setup

1. **Install dependencies**
   Make sure you have clean installed all dependencies:
   `npm ci`

1. **Set Up Environment Variables**
   Make sure you have these variables added to your environment. You can add them `.env` or `.env.local` files as well.

```
REACT_APP_TEST_EVM_ADDR=your_test_wallet_address
REACT_APP_TEST_EVM_PK=your_test_wallet_private_key
```

## Running the Tests

1. **Local dev server**
   You do not need to run local dev server before the tests as Playwright will start it automatically. If you already have local dev server running at `http://localhost:5173/`, Playwright will use it as well.

1. **Run all tests**
   You can run all tests with `npm run test:e2e` headless or `npm run test:e2e:ui` with Playwright UI.

1. **Run a specific test**
   You can pass the path to a test file to run that one specifically:
   `npm run test:e2e tests/e2e/specs/your-test-file.spec.ts`

1. **Generate a test report**
   To generate and view a test report, use the following command:
   `npx playwright show-report`
