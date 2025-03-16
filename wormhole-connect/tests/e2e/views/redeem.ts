import { expect, Locator, Page } from '@playwright/test';

export class RedeemView {
  private readonly mainContainer: Locator;
  private readonly statusHeader: Locator;

  constructor(public readonly page: Page) {
    this.mainContainer = page.getByTestId('redeem-view');
    this.statusHeader = page.getByTestId('redeem-view-status-header');
  }

  // Verify key elements are present in Redeem view
  async verifyElements(timeout = 30000) {
    await expect(this.mainContainer).toBeVisible({ timeout });
    await expect(this.statusHeader).toBeVisible({ timeout });
  }

  async confirmTransactionState(status: string, timeout = 30000) {
    await expect(this.statusHeader).toHaveText(status, { timeout });
  }
}
