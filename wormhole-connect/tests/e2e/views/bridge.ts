import { expect, Locator, Page } from '@playwright/test';

export class BridgeView {
  private readonly srcAssetPicker: Locator;
  private readonly destAssetPicker: Locator;
  private readonly amountInput: Locator;

  constructor(public readonly page: Page) {
    this.srcAssetPicker = this.page.getByTestId('source-asset-picker');
    this.destAssetPicker = this.page.getByTestId('dest-asset-picker');
    this.amountInput = this.page.getByTestId('amount-input');
  }

  async goto(config: string) {
    await this.page.goto(`http://localhost:5173/?config=${config}`);
  }

  // Verify key elements are present in bridge view
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
}
