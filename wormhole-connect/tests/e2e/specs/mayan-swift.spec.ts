import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { BridgeView } from '../views/bridge';

// Read from .env* files
// This is only for local testing overrides
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

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

const ARB_USDC_CONTRACT = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

let page: Page;

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
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

  const bridgeView = new BridgeView(page);
  await bridgeView.verifyElements();

  // Set source wallet
  await bridgeView.connectSrcWallet(process.env.REACT_APP_TEST_EVM_ADDR);

  // Select source asset
  await bridgeView.selectSrcAsset(
    'chain-button-arbitrum',
    `token-button-arbitrum-${ARB_USDC_CONTRACT}`,
  );

  // Set destination wallet
  await bridgeView.connectDestWallet(process.env.REACT_APP_TEST_EVM_ADDR);

  // Select destination asset
  await bridgeView.selectDestAsset(
    'chain-button-base',
    `token-button-base-${BASE_USDC_CONTRACT}`,
  );

  // Enter amount
  await bridgeView.enterAmount('1');

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
