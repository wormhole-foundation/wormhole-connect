import { expect, Locator, Page } from '@playwright/test';

export class RedeemView {
  private readonly mainContainer: Locator;
  private readonly statusHeader: Locator;

  constructor(public readonly page: Page) {
    this.mainContainer = page.getByTestId('redeem-view');
    this.statusHeader = page.getByTestId('redeem-view-status-header');
  }

  // Verify key elements are present in Redeem view
  async verifyElements() {
    await expect(this.mainContainer).toBeVisible();
    await expect(this.statusHeader).toBeVisible();
  }

  async confirmTransactionState(status: string) {
    await expect(this.statusHeader).toHaveText(status);
  }
}
