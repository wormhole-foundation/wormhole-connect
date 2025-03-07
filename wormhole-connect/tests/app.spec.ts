import { test, expect, Page } from '@playwright/test';

/**
 * Default config will have the following settings:
 * {
      network: 'mainnet',
      coinGeckoApiKey: 'CG-EDLftLaFEWYqZNsPVwBDAKCE',
      ui: {
        showInProgressWidget: true,
        testOptions: {
          enableHeadlessSigner: true,
        },
      },
      routes: [
        MayanRouteSWIFT,
      ]
    };
 */
const DEFAULT_CONFIG =
  'N4KABGB2CmAuDuB7ATgawFxgOQFsCGAlpDLFgDThgDGiRA4tFaogIIAOBA0tAJ6ZYBhOgFoAogBEAMgDNYkvADFRAdQCaARwBaAOQDOABQBq8AELiWnAaPKUArgUygIEXQAtE8AJKR9yRAHNkaF1dZQIAE384TFhkW2gKZzBYYNgAeTZYAkRIXUdKJOhIPAAjABtoAAloPHCKkIBlAn8YZBi4hIKwAF9Enr6%2FWxS8sABtLoA6KfFRBRYAVUkAFQB9ACU0%2BaXRBr6IAFk8HjxINcQh6AblTwUlvoBdEG6AbhAgA';

const WALLET_ADDRESS = '0x49887A216375FDED17DC1aAAD4920c3777265614';
const ARB_USDC_CONTRACT = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

let page: Page;

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();

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
});

test.afterAll(async () => {
  await page.close();
});

test('should configure transaction', async () => {
  // Navigate to the root page
  await page.goto(`http://localhost:5173/?config=${DEFAULT_CONFIG}`);

  // Wait for the main container to be visible
  await page.waitForSelector('#sample-app', {
    state: 'visible',
  });

  // Verify key elements are present in bridge view
  await expect(page.getByTestId('bridge-view')).toBeVisible();
  await expect(page.getByTestId('bridge-view-header')).toBeVisible();
  await expect(page.getByTestId('source-asset-picker')).toBeVisible();
  await expect(page.getByTestId('dest-asset-picker')).toBeVisible();
  await expect(page.getByTestId('amount-input')).toBeVisible();

  // Set sending wallet and balances
  await page.evaluate(
    (payload) => {
      globalThis.dispatchReduxAction({
        type: 'wallet/connectWallet',
        payload: {
          address: payload.address,
          type: 'Ethereum',
          icon: '',
          name: 'Rabby Wallet',
        },
      });
      globalThis.dispatchReduxAction({
        type: 'transfer/updateBalances',
        payload: {
          address: payload.address,
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
    },
    { address: WALLET_ADDRESS },
  );

  // Select sending asset
  await page.getByTestId('source-asset-picker').click();
  await page.getByTestId('chain-button-arbitrum').click();
  await page.getByTestId(`token-button-arbitrum-${ARB_USDC_CONTRACT}`).click();

  // Set receiving wallet
  await page.evaluate(
    (payload) => {
      globalThis.dispatchReduxAction({
        type: 'wallet/connectReceivingWallet',
        payload: {
          address: payload.address,
          type: 'Ethereum',
          icon: '',
          name: 'Rabby Wallet',
        },
      });
    },
    { address: WALLET_ADDRESS },
  );

  // Select receiving asset and set amount
  await page.getByTestId('dest-asset-picker').click();
  await page.getByTestId('chain-button-base').click();
  await page.getByTestId(`token-button-base-${BASE_USDC_CONTRACT}`).click();
  await page.getByTestId('amount-input').getByPlaceholder('0').fill('1');

  // Mayan Swift route should be visible and selected by default
  await expect(page.getByTestId('route-MayanSwapSWIFT-selected')).toBeVisible();

  // Verify Confirm transaction button and start transaction
  const confirmButton = page.getByTestId('confirm-transaction-button');
  await expect(confirmButton).toHaveText('Confirm transaction');
  await expect(confirmButton).toBeEnabled();
});

test('should initiate transaction', async () => {
  // Start transaction
  const confirmButton = page.getByTestId('confirm-transaction-button');
  await confirmButton.click();
  // Wait for Confirm transaction button to be in Preparing state
  await expect(confirmButton).toHaveText('Preparing transaction');

  // Wait for Redeem view
  await expect(page.getByTestId('redeem-view')).toBeVisible({ timeout: 30000 });

  // Verify transaction status as submitted
  const statusHeader = page.getByTestId('redeem-view-status-header');
  await expect(statusHeader).toHaveText('Transaction submitted');
  // Wait for transaction completion
  await expect(statusHeader).toHaveText('Transaction complete', {
    timeout: 30000,
  });
});
