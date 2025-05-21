import { expect, Locator, Page } from '@playwright/test';

const NONCE_ERROR = new RegExp('nonce has already been used', 'mi');

export class BridgeView {
  private readonly srcAssetPicker: Locator;
  private readonly destAssetPicker: Locator;
  private readonly amountInput: Locator;
  private readonly _confirmButton: Locator;
  private readonly logs: Array<{ text: string; type: string }> = [];

  constructor(public readonly page: Page) {
    this.srcAssetPicker = page.getByTestId('source-asset-picker');
    this.destAssetPicker = page.getByTestId('dest-asset-picker');
    this.amountInput = page.getByTestId('amount-input');
    this._confirmButton = page.getByTestId('confirm-transaction-button');

    // Start listening for console logs
    page.on('console', (msg) => {
      this.logs.push({ text: msg.text(), type: msg.type() });
    });
  }

  // Getter for confirmButton
  get confirmButton(): Locator {
    return this._confirmButton;
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

  async selectSrcAsset(
    chainTestId: string,
    tokenTestId: string,
    tokenSymbol: string,
  ) {
    await this.srcAssetPicker.click();
    await this.page
      .getByTestId('token-search-list-input')
      .getByRole('textbox')
      .fill(tokenSymbol);
    await this.page.getByTestId(chainTestId).click();
    await this.page.getByTestId(tokenTestId).click();
  }

  async selectDestAsset(
    chainTestId: string,
    tokenTestId: string,
    tokenSymbol: string,
  ) {
    await this.destAssetPicker.click();
    await this.page
      .getByTestId('token-search-list-input')
      .getByRole('textbox')
      .fill(tokenSymbol);
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

  async hasNonceError() {
    // Wait for the confirm button not to be in progress before checking the logs
    try {
      await expect(this.confirmButton).not.toHaveText('Preparing transaction');
      return this.logs.some(
        (log) => log.type === 'error' && NONCE_ERROR.test(log.text),
      );
    } catch (e) {
      // If confirm button is still visible with preparing transaction text,
      // it means the transaction is still in progress after a timeout.
      // We can fail the test here.
      if (
        (await this.confirmButton.isVisible()) &&
        (await this.confirmButton.textContent()) === 'Preparing transaction'
      ) {
        throw e;
      }
    }

    // If the confirm button is not visible, it means the transaction is submitted
    // and we can safely ignore the error.
    return false;
  }
}
