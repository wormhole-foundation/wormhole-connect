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

        // Navigate to brige view
        await page.goto(`/?config=${configQuery}`);
        await page.waitForLoadState('load');

        // Verify key elements are present in bridge view
        await bridgeView.verifyElements();

        const sourceChain = sourceAsset.chain;

        // Select source asset
        await bridgeView.selectSrcAsset(
          sourceChain,
          sourceAsset.symbol,
          sourceAsset.address!,
        );

        const destinationChain = destinationAsset.chain;

        // Select destination asset
        await bridgeView.selectDestAsset(
          destinationChain,
          destinationAsset.symbol,
          destinationAsset.address!,
        );

        // Enter amount
        await bridgeView.enterAmount(amount);

        // Click the link to open Routes modal
        const routeToggle = page.getByRole('button', {
          name: 'View other routes',
        });
        await routeToggle.isVisible();
        await routeToggle.click();

        // Route should be visible and selected by default
        await expect(
          page.getByRole('button', { name: `Select ${name} route` }),
        ).toBeVisible();
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

      // Navigate to brige view
      await page.goto(`/?config=${configQuery}`);
      await page.waitForLoadState('load');

      // Verify key elements are present in bridge view
      await bridgeView.verifyElements();

      // Set source wallet
      await bridgeView.connectSrcWallet(sourceWallet.address);

      const sourceChain = sourceAsset.chain;

      // Select source asset
      await bridgeView.selectSrcAsset(
        sourceChain,
        sourceAsset.symbol,
        sourceAsset.address!,
      );

      // Set destination wallet
      await bridgeView.connectDestWallet(destinationWallet.address);

      const destinationChain = destinationAsset.chain;

      // Select destination asset
      await bridgeView.selectDestAsset(
        destinationChain,
        destinationAsset.symbol,
        destinationAsset.address!,
      );

      // Enter amount
      await bridgeView.enterAmount(amount);

      // Click the link to open Routes modal
      const routeToggle = page.getByRole('button', {
        name: 'View other routes',
      });
      await routeToggle.isVisible();
      await routeToggle.click();

      // Route should be visible and selected by default
      await expect(
        page.getByRole('button', { name: `Select ${name} route` }),
      ).toBeVisible();

      // Close the routes modal/drawer
      await page.getByRole('button', { name: /Close routes/ }).click();

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
