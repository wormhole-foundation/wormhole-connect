import { test, expect } from '@playwright/test';

/**
 * Default config will have the following settings:
 * {
      network: 'mainnet',
      coinGeckoApiKey: 'CG-EDLftLaFEWYqZNsPVwBDAKCE',
      ui: { showInProgressWidget: true },
      routes: [
          ...DEFAULT_ROUTES,
        MayanRouteSWIFT,
      ]
    };
 */
const DEFAULT_CONFIG =
  'N4KABGB2CmAuDuB7ATgawFxgOQFsCGAlpDLFgDThgDGiRA4tFaogIIAOBA0tAJ6ZYBhOgFoAogBEAMgDNYkvADFRAdQCaARwBaAOQDOABQBq8AELiWnAaPKUArgUzAwugBaJ4ASUj7kiAObI0Lq6ygQAJn5wmLDIttBgAL4UEL62sEGYANqUEAB0%2BeKiCiwAqpIAKgD6AEoA8iXlogDKyRBgALJ4PHiQ1Yhp0E3KHgrlrQC6IAkA3CBAA';

const WALLET_ADDRESS = '0x49887A216375FDED17DC1aAAD4920c3777265614';
const ARB_USDC_CONTRACT = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

test.beforeEach(async ({ page }) => {
  // Mock CoinGecko API call for Arbitrum/USDC price
  await page.route('**/api/v3/simple/token_price/arbitrum-one?**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        [ARB_USDC_CONTRACT]: { usd: 0.999999 },
      }),
    });
  });

  // Navigate to the root page
  await page.goto(`http://localhost:5173/?config=${DEFAULT_CONFIG}`);
});

test('should select route', async ({ page }) => {
  // Wait for the main container to be visible
  await page.waitForSelector('#sample-app', {
    state: 'visible',
  });

  // Verify key elements are present
  await expect(page.getByTestId('bridge-view')).toBeVisible();
  await expect(page.getByTestId('bridge-view-header')).toBeVisible();
  await expect(page.getByTestId('source-asset-picker')).toBeVisible();
  await expect(page.getByTestId('dest-asset-picker')).toBeVisible();
  await expect(page.getByTestId('amount-input')).toBeVisible();

  // Set sending wallet and balances
  await page.evaluate((payload) => {
    globalThis.dispatchReduxAction({
      type: 'wallet/connectWallet',
      payload: {
        address: WALLET_ADDRESS,
        type: 'Ethereum',
        icon: '',
        name: 'Rabby Wallet',
      },
    });
    globalThis.dispatchReduxAction({
      type: 'transfer/updateBalances',
      payload: {
        address: '0x49887A216375FDED17DC1aAAD4920c3777265614',
        chain: 'Arbitrum',
        balances: {
          '["Arbitrum","native"]': {
            balance: {
              amount: '3463966950309885',
              decimals: 18,
            },
            lastUpdated: 1741189053957,
          },
          '["Arbitrum","0xaf88d065e77c8cC2239327C5EDb3A432268e5831"]': {
            balance: {
              amount: '205068313',
              decimals: 6,
            },
            lastUpdated: 1741189053957,
          },
        },
      },
    });
  });

  // Select sending asset
  await page.getByTestId('source-asset-picker').click();
  await page.getByTestId('chain-button-arbitrum').click();
  await page.getByTestId(`token-button-arbitrum-${ARB_USDC_CONTRACT}`).click();

  // Set receiving wallet
  await page.evaluate((payload) => {
    globalThis.dispatchReduxAction({
      type: 'wallet/connectReceivingWallet',
      payload: {
        address: WALLET_ADDRESS,
        type: 'Ethereum',
        icon: '',
        name: 'Rabby Wallet',
      },
    });
  });

  // Select receiving asset
  await page.getByTestId('dest-asset-picker').click();
  await page.getByTestId('chain-button-base').click();
  await page.getByTestId(`token-button-base-${BASE_USDC_CONTRACT}`).click();

  // Set amount
  await page.getByTestId('amount-input').getByPlaceholder('0').fill('1');
  // Expand all routes
  await page.getByTestId('other-routes-toggle').click();
  // At least one route should be selected
  await expect(page.getByTestId(/^route-(\w+)-selected$/)).toBeVisible();
  // Wait for Confirm transaction button to be enabled
  await expect(page.getByTestId('confirm-transaction-button')).toHaveText(
    'Confirm transaction',
  );
  await expect(page.getByTestId('confirm-transaction-button')).toBeEnabled();
  // Start the transaction
  await page.getByTestId('confirm-transaction-button').click();
  // It should fail as no actual wallet is connected
  await expect(page.getByTestId('send-error-message')).toBeVisible();
});
