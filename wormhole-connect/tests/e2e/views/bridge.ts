import { expect, Locator, Page } from '@playwright/test';

export class BridgeView {
  private readonly srcAssetPicker: Locator;
  private readonly destAssetPicker: Locator;
  private readonly amountInput: Locator;
  private readonly confirmButton: Locator;

  constructor(public readonly page: Page) {
    this.srcAssetPicker = page.getByTestId('source-asset-picker');
    this.destAssetPicker = page.getByTestId('dest-asset-picker');
    this.amountInput = page.getByTestId('amount-input');
    this.confirmButton = page.getByTestId('confirm-transaction-button');
  }

  // Verify key elements are present in Bridge view
  async verifyElements() {
    await expect(this.srcAssetPicker).toBeVisible();
    await expect(this.destAssetPicker).toBeVisible();
    await expect(this.amountInput).toBeVisible();
  }

  async connectSrcWallet(address: string | undefined) {
    expect(address).not.toBeUndefined();
    await this.page.evaluate(
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
      },
      { address },
    );
  }

  async connectDestWallet(address: string | undefined) {
    expect(address).not.toBeUndefined();
    await this.page.evaluate(
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
      { address },
    );
  }

  async selectSrcAsset(chainTestId: string, tokenTestId: string) {
    await this.srcAssetPicker.click();
    await this.page.getByTestId(chainTestId).click();
    await this.page.getByTestId(tokenTestId).click();
  }

  async selectDestAsset(chainTestId: string, tokenTestId: string) {
    await this.destAssetPicker.click();
    await this.page.getByTestId(chainTestId).click();
    await this.page.getByTestId(tokenTestId).click();
  }

  async enterAmount(amount: string) {
    await this.amountInput.getByPlaceholder('0').fill(amount);
  }

  async startTransaction() {
    await expect(this.confirmButton).toHaveText('Confirm transaction');
    await expect(this.confirmButton).toBeEnabled();
    await this.confirmButton.click();
    await expect(this.confirmButton).toHaveText('Preparing transaction');
  }
}
