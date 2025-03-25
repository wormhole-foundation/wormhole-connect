import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { compressToBase64 } from 'lz-string';

import { BridgeView } from '../views/bridge';
import { RedeemView } from '../views/redeem';

// Read from .env* files
// This is only for local testing overrides
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env.local') });

const ARB_USDC_CONTRACT = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const BASE_USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

let configQuery: string;
let page: Page;
let bridgeView: BridgeView;
let redeemView: RedeemView;

// Annotate entire file as serial.
test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  // Generate query param for the default config
  const coinGeckoApiKey = process.env.REACT_APP_TEST_CG_AK;
  expect(coinGeckoApiKey).toBeDefined();
  const defaultConfig = `{
  network: 'mainnet',
  coinGeckoApiKey: '${coinGeckoApiKey}',
  ui: {
    showInProgressWidget: true,
    testOptions: {
      enableHeadlessSigner: true,
    },
  },
  routes: [
    MayanRouteSWIFT,
  ],
}`;

  configQuery = compressToBase64(defaultConfig);

  // Set up Bridge and Redeem views
  page = await browser.newPage();
  bridgeView = new BridgeView(page);
  redeemView = new RedeemView(page);
});

test.afterAll(async () => {
  await page.close();
});

test('should configure transaction', async () => {
  // Navigate to brige view
  await page.goto(`http://localhost:5173/?config=${configQuery}`);

  // Verify key elements are present in bridge view
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
});

test('should initiate transaction', async () => {
  // Start transaction
  await bridgeView.startTransaction();

  // Check for nonce error and retry once
  if (await bridgeView.hasNonceError()) {
    console.log('Nonce error detected, retrying transaction');
    await bridgeView.startTransaction();
  }

  // Wait for Redeem view
  await redeemView.verifyElements();

  // Verify transaction status as submitted
  await redeemView.confirmTransactionState('Transaction submitted');

  // Wait for transaction completion
  await redeemView.confirmTransactionState('Transaction completed');
});
