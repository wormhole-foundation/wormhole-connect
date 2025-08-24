import { test, expect, type Page } from '@playwright/test';
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

test.beforeAll(async ({ browser, baseURL }) => {
  // Set up Bridge and Redeem views
  page = await browser.newPage();
  bridgeView = new BridgeView(page);
  redeemView = new RedeemView(page);
});

test.afterAll(async () => {
  await page.close();
});

testConfigs.forEach(
  ({
    config,
    enabled,
    destinationAsset,
    destinationWallet,
    name,
    sourceAsset,
    sourceWallet,
    amount,
    waitForCompletion,
  }) => {
    test(
      `Should configure transaction - ${name}`,
      { tag: '@noWallet' },
      async () => {
        test.skip(!enabled, `Test ${name} is disabled`);
        test.skip(
          !sourceAsset.address,
          `Test ${name} is missing source token address`,
        );
        test.skip(
          !destinationAsset.address,
          `Test ${name} is missing destination token address`,
        );

        const configQuery = compressToBase64(config);

        // Navigate to bridge view
        await page.goto(`/?config=${configQuery}`);
        await page.waitForLoadState('load');

        // Set up bridge transaction with no wallets
        await bridgeView.setupTransaction(
          sourceAsset,
          destinationAsset,
          amount,
        );

        // Verify route selection
        await bridgeView.verifyRouteSelection(name);
      },
    );

    test(`Should complete transaction - ${name}`, async () => {
      test.skip(!enabled, `Test ${name} is disabled`);
      test.skip(
        !sourceAsset.address,
        `Test ${name} is missing source token address`,
      );
      test.skip(
        !destinationAsset.address,
        `Test ${name} is missing destination token address`,
      );

      const configQuery = compressToBase64(config);

      // Navigate to bridge view
      await page.goto(`/?config=${configQuery}`);
      await page.waitForLoadState('load');

      // Set up bridge transaction with wallets
      await bridgeView.setupTransaction(
        sourceAsset,
        destinationAsset,
        amount,
        sourceWallet,
        destinationWallet,
      );

      // Verify route selection
      await bridgeView.verifyRouteSelection(name);

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
