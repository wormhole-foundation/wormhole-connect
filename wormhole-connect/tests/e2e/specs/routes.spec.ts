import { test, expect, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { compressToBase64 } from 'lz-string';

import { BridgeView } from '../views/bridge';
import { RedeemView } from '../views/redeem';
import { testConfigs } from '../config';

// Read from .env* files
// This is only for local testing overrides
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env.local') });

let page: Page;
let bridgeView: BridgeView;
let redeemView: RedeemView;
let isExternalUrl = false;

test.beforeAll(async ({ browser, baseURL }) => {
  // Set up Bridge and Redeem views
  page = await browser.newPage();
  bridgeView = new BridgeView(page);
  redeemView = new RedeemView(page);
  // Check if we are testing an external URL
  isExternalUrl = !baseURL?.startsWith('http://localhost');
});

test.afterAll(async () => {
  await page.close();
});

testConfigs.forEach(
  ({
    config,
    destinationAsset,
    destinationWallet,
    name,
    sourceAsset,
    sourceWallet,
    amount,
    waitForCompletion,
  }) => {
    test(`Should configure transaction for an external Connect host - ${name}`, async () => {
      test.skip(!isExternalUrl, 'Runs only for external URLs');

      // Navigate to brige view
      await page.goto('/');
      await page.waitForLoadState('load');

      // Verify key elements are present in bridge view
      await bridgeView.verifyElements();

      // Select source asset
      await bridgeView.selectSrcAsset(
        `chain-button-${sourceAsset.chain}`,
        `token-button-${sourceAsset.chain}-${sourceAsset.address}`,
        sourceAsset.symbol,
      );

      // Select destination asset
      await bridgeView.selectDestAsset(
        `chain-button-${destinationAsset.chain}`,
        `token-button-${destinationAsset.chain}-${destinationAsset.address}`,
        destinationAsset.symbol,
      );

      // Enter amount
      await bridgeView.enterAmount(amount);

      // Route should be visible and selected by default
      await expect(page.getByTestId(`route-${name}-selected`)).toBeVisible();
    });

    test(`Should complete transaction - ${name}`, async () => {
      test.skip(isExternalUrl, 'Runs only for localhost');

      const configQuery = compressToBase64(config);

      // Navigate to brige view
      await page.goto(`/?config=${configQuery}`);
      await page.waitForLoadState('load');

      // Verify key elements are present in bridge view
      await bridgeView.verifyElements();

      // Set source wallet
      await bridgeView.connectSrcWallet(sourceWallet.address);

      // Select source asset
      await bridgeView.selectSrcAsset(
        `chain-button-${sourceAsset.chain}`,
        `token-button-${sourceAsset.chain}-${sourceAsset.address}`,
        sourceAsset.symbol,
      );

      // Set destination wallet
      await bridgeView.connectDestWallet(destinationWallet.address);

      // Select destination asset
      await bridgeView.selectDestAsset(
        `chain-button-${destinationAsset.chain}`,
        `token-button-${destinationAsset.chain}-${destinationAsset.address}`,
        destinationAsset.symbol,
      );

      // Enter amount
      await bridgeView.enterAmount(amount);

      // Route should be visible and selected by default
      await expect(page.getByTestId(`route-${name}-selected`)).toBeVisible();

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

      if (waitForCompletion) {
        // Wait for transaction completion
        await redeemView.confirmTransactionState('Transaction completed');
      }
    });
  },
);
