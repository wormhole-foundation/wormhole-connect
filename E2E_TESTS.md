# Wormhole Connect E2E Test Documentation

## Overview

Wormhole Connect uses Playwright for end-to-end testing to ensure the bridge functionality works correctly across different routes and configurations. This documentation covers the test framework structure, setup instructions, and guidelines for writing and maintaining tests.

## Framework Architecture

### Technology Stack
- **Framework**: Playwright Test Framework
- **Language**: TypeScript
- **Test Pattern**: Page Object Model (POM)
- **Test Runner**: `@playwright/test`

### Directory Structure

The E2E tests are organized in the `tests/e2e/` directory with the following structure:

- **config/** - Contains test configuration files. The `index.ts` file defines all the test scenarios for different bridge routes (like MayanSwap and CCTP), including source/destination chains, assets, and amounts. The `types.ts` file provides TypeScript interfaces for type safety.

- **specs/** - Houses the actual test files. Currently contains `routes.spec.ts` which is the main test suite that runs all bridge route tests using the configurations defined in the config directory.

- **views/** - Implements the Page Object Model pattern with classes for each view in the application. The `bridge.ts` file handles all interactions with the main bridge interface (wallet connections, asset selection, transactions), while `redeem.ts` manages the post-transaction redemption view.

- **README.md** - A quick reference guide for setting up and running the tests locally.

## Setup Instructions

### Prerequisites
- Node.js 20 or higher
- npm (comes with Node.js)
- Test wallet with funds on supported chains (only required for tests with actual transactions)

### Environment Configuration

For running transaction tests (tests without `@noWallet` tag), you need to set the following environment variables. You can either create a `.env` file in the project root or export them directly in your terminal:

**Option 1: Using .env file**
```bash
# Test wallet configuration (only needed for transaction tests)
REACT_APP_TEST_EVM_ADDR=your_test_wallet_address
REACT_APP_TEST_EVM_PK=your_test_wallet_private_key

# API keys
REACT_APP_TEST_CG_AK=your_coingecko_api_key
```

**Option 2: Export directly in terminal**
```bash
export REACT_APP_TEST_EVM_ADDR=your_test_wallet_address
export REACT_APP_TEST_EVM_PK=your_test_wallet_private_key
export REACT_APP_TEST_CG_AK=your_coingecko_api_key
```

⚠️ **Security Note**: Never commit `.env` files or expose private keys in code.

**Note**: Configuration tests (`@noWallet` tag) can run without any environment setup.

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

## Running Tests

### Available Commands

```bash
# Run all tests headless
npm run test:e2e

# Run tests with Playwright UI (recommended for debugging)
npm run test:e2e:ui

# Run only tests that require wallet interaction
npm run test:e2e:with-wallet

# Run only configuration tests (no wallet needed)
npm run test:e2e:without-wallet
```

### Playwright Configuration

The `playwright.config.ts` file controls how tests are executed. Here are the key settings and what they mean:

```typescript
{
  testDir: './tests/e2e/specs',           // Where test files are located
  timeout: 120000,                        // 120 seconds max per test
  expect: {
    timeout: 60000                        // 60 seconds for assertions
  },
  use: {
    baseURL: 'http://localhost:5173',     // Local dev server URL
    screenshot: 'only-on-failure',        // Captures UI on test failure
    trace: 'on-first-retry',              // Records detailed trace on retry
    video: 'off'                          // Video recording disabled
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] } // Uses Chromium browser only
  }],
  webServer: {
    command: 'npm run dev',               // Starts dev server if not running
    port: 5173,
    reuseExistingServer: true             // Uses existing server if available
  },
  // CI-specific settings
  ...(process.env.CI && {
    retries: 2,                           // Retry failed tests twice in CI
    workers: 1                            // Single worker to avoid conflicts
  })
}
```

These settings ensure tests run reliably both locally and in CI environments, with appropriate timeouts for blockchain operations and automatic dev server management.

## Test Structure

### Test Categories

We have two categories of tests based on whether they require wallet interaction:

1. **Configuration Tests** (`@noWallet` tag)
   - These tests verify that the bridge interface loads and configures correctly
   - They don't require any wallet connection or funds
   - Quick to run and ideal for CI/CD pipelines
   - Examples:
     - Verify UI elements load correctly
     - Test route availability
     - Check asset selection works
     - Validate form interactions

2. **Transaction Tests** (no tag)
   - These tests perform actual bridge transactions
   - Require a funded test wallet and environment setup
   - Take longer to run due to blockchain interactions
   - Examples:
     - Complete bridge transactions
     - Test actual token transfers
     - Verify transaction success/failure handling
     - Check redemption process

### Test Flow

1. **Setup Phase**
   - Load environment variables
   - Create page and view instances
   - Navigate to app with compressed config

2. **Configuration Phase**
   - Select source/destination chains
   - Choose assets
   - Enter transfer amount

3. **Transaction Phase**
   - Connect wallets (headless)
   - Initiate bridge transaction
   - Handle potential errors (e.g., nonce issues)

4. **Verification Phase**
   - Confirm transaction submission
   - Wait for transaction completion (optional)
   - Verify redeem view appears

## Page Objects

Page Objects are classes that encapsulate all interactions with specific pages or views in the application. They help keep tests clean and maintainable by separating the test logic from the UI interaction details.

### Current Page Objects

1. **Bridge View** (`views/bridge.ts`)
   - Handles all interactions with the main bridging interface
   - Manages wallet connections, asset selection, and transaction initiation

2. **Redeem View** (`views/redeem.ts`)
   - Handles the post-transaction redemption interface
   - Verifies transaction completion and redemption status

## Test Configuration

### Route Configurations (`config/index.ts`)

Currently supported routes:
1. **MayanSwapSWIFT** - Solana to EVM transfers
2. **CCTPExecutor** - Circle CCTP transfers

Each configuration includes:
- Test name
- Source/destination chains
- Asset details
- Transfer amounts
- Wallet configurations

### Adding New Routes

To add a new route test:

1. Add configuration to `config/index.ts`:
```typescript
{
  name: "YourNewRoute",
  config: { /* route config */ },
  sourceChain: "chainName",
  sourceAsset: "assetName",
  destinationChain: "destChainName",
  destinationAsset: "destAssetName",
  amount: "1",
  sourceWallet: { /* wallet config */ },
  destinationWallet: { /* wallet config */ }
}
```

2. Tests will automatically include the new configuration

## Best Practices

### Writing Tests

1. **Use data-testid**: All interactive elements should have `data-testid` attributes
2. **Page Object Pattern**: Keep selectors and interactions in view classes
3. **Data-Driven**: Externalize test data in config files
4. **Error Handling**: Include retry logic for transient failures
5. **Console Monitoring**: Check for console errors during test execution

### Maintenance

1. **Update Selectors**: When UI changes, update page objects
2. **Test Data**: Keep test configurations current with supported routes
3. **Environment**: Ensure test wallets have sufficient funds
4. **Dependencies**: Keep Playwright and other deps updated

### Debugging

1. **Use UI Mode**: `npm run test:e2e:ui` for interactive debugging
2. **Screenshots**: Check `test-results/` for failure screenshots
3. **Traces**: Use Playwright trace viewer for detailed execution logs
4. **Console Logs**: Bridge view captures console output

## Headless Wallet Integration

UI automation uses a custom approach to connect wallets without UI interaction:

1. Exposes Redux store to window object
2. Dispatches wallet connection actions directly
3. Simulates wallet behavior programmatically
4. Avoids flaky UI-based wallet interactions

Example code below executes in the browser context and directly dispatches a wallet connection action to the Redux store, bypassing the need to click through wallet UI popups.
```typescript
await page.evaluate((config) => {
  window.store.dispatch(connectWallet(config));
}, walletConfig);
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Nightly builds

CI-specific configuration:
- Increased timeouts
- Retry failed tests twice
- Single worker to avoid conflicts
- Headless mode only

## Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Check private key format
   - Verify wallet has funds
   - Ensure correct network

2. **Nonce Errors**
   - Tests include automatic retry
   - May indicate RPC issues
   - Check network connectivity

3. **Timeout Errors**
   - Increase timeout in config
   - Check if dev server is running
   - Verify network connectivity

4. **Element Not Found**
   - Update selectors in page objects
   - Check if UI has changed
   - Verify `data-testid` attributes exist

## Viewing Test Results

### Local Test Results

When running tests locally, Playwright provides several ways to view results:

1. **Terminal Output**
   - Shows real-time test progress
   - Displays pass/fail status for each test
   - Includes error messages and stack traces

2. **HTML Report**
   ```bash
   # Generate and open HTML report after test run
   npx playwright show-report
   ```
   - Interactive report with test details
   - Screenshots of failures
   - Test execution timeline
   - Can filter by status (passed, failed, skipped)

3. **Test Artifacts** (located in `test-results/`)
   - Screenshots on failure
   - Test traces (can be viewed with `npx playwright show-trace trace.zip`)
   - Video recordings (if enabled)

4. **UI Mode** (best for debugging)
   ```bash
   npm run test:e2e:ui
   ```
   - Watch tests run in real-time
   - Step through test execution
   - Inspect page state at each step
   - Time-travel debugging

### GitHub Workflow Results

For tests running in CI/CD:

1. **GitHub Actions Tab**
   - Navigate to repository → Actions tab
   - Click on the workflow run
   - View test logs in real-time or after completion

2. **Test Summary**
   - GitHub automatically displays test results summary
   - Shows number of passed/failed/skipped tests
   - Includes test duration

3. **Artifacts**
   - Failed test screenshots and traces are uploaded as artifacts
   - Download from the workflow run page
   - Artifacts include:
     - `playwright-report/` - HTML report
     - `test-results/` - Screenshots and traces
   
4. **Viewing Artifacts**
   ```bash
   # After downloading artifacts
   unzip playwright-report.zip
   npx playwright show-report playwright-report
   ```
