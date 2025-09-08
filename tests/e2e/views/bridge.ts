import { expect, type Locator, type Page } from '@playwright/test';

const NONCE_ERROR = new RegExp('nonce has already been used', 'mi');

export class BridgeView {
  private readonly srcAssetPicker: Locator;
  private readonly destAssetPicker: Locator;
  private readonly amountInput: Locator;
  private readonly _confirmButton: Locator;
  private readonly logs: Array<{ text: string; type: string }> = [];

  constructor(public readonly page: Page) {
    this.srcAssetPicker = page.getByRole('button', {
      name: 'Select source asset',
    });
    this.destAssetPicker = page.getByRole('button', {
      name: 'Select destination asset',
    });
    this.amountInput = page.getByRole('textbox', { name: 'Amount input' });
    this._confirmButton = page.getByRole('button', {
      name: 'Confirm transaction',
    });

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
            type: 'Evm',
            icon: '',
            name: 'Test Wallet',
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
            type: 'Evm',
            icon: '',
            name: 'Test Wallet',
          },
        });
      },
      { address },
    );
  }

  async selectAsset(
    assetPicker: Locator,
    chainName: string,
    tokenSymbol: string,
    tokenAddress: string,
  ) {
    await assetPicker.click();

    // Wait for the chain button to be clickable
    // This works whether it's in a modal, drawer, or inline
    const chainButton = this.page.getByRole('button', {
      name: `Select ${chainName}`,
    });
    await chainButton.waitFor({ state: 'visible' });
    await chainButton.click();

    // Wait for search input to be visible after chain selection
    // We need to use the specific token address to find the exact token
    const searchInput = this.page.getByRole('textbox', { name: 'Search' });
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill(tokenAddress);
    await this.page.waitForTimeout(500); // Wait for search results to update

    // Wait for the token to be visible in search results
    const tokenButton = this.page.getByRole('button', {
      name: `Select ${tokenSymbol}`,
    });
    await tokenButton.waitFor({ state: 'visible' });
    await tokenButton.click();
  }

  async selectSrcAsset(
    chainName: string,
    tokenSymbol: string,
    tokenAddress: string,
  ) {
    await this.selectAsset(
      this.srcAssetPicker,
      chainName,
      tokenSymbol,
      tokenAddress,
    );
  }

  async selectDestAsset(
    chainName: string,
    tokenSymbol: string,
    tokenAddress: string,
  ) {
    await this.selectAsset(
      this.destAssetPicker,
      chainName,
      tokenSymbol,
      tokenAddress,
    );
  }

  async enterAmount(amount: string) {
    await this.amountInput.fill(amount);
  }

  async setupTransaction(
    sourceAsset: any,
    destinationAsset: any,
    amount: string,
    sourceWallet?: any,
    destinationWallet?: any,
  ) {
    // Verify key elements are present in bridge view
    await this.verifyElements();

    // Connect wallets if needed
    if (sourceWallet) {
      await this.connectSrcWallet(sourceWallet.address);
    }

    // Select source asset
    await this.selectSrcAsset(
      sourceAsset.chain,
      sourceAsset.symbol,
      sourceAsset.address!,
    );

    // Connect destination wallet if needed
    if (destinationWallet) {
      await this.connectDestWallet(destinationWallet.address);
    }

    // Select destination asset
    await this.selectDestAsset(
      destinationAsset.chain,
      destinationAsset.symbol,
      destinationAsset.address!,
    );

    // Enter amount
    await this.enterAmount(amount);
  }

  async verifyRouteSelection(routeName: string) {
    // Click the link to open Routes modal
    const routeToggle = this.page.getByRole('button', {
      name: 'View other routes',
    });
    await routeToggle.waitFor({ state: 'visible' });
    await routeToggle.click();

    // Route should be visible and selected by default
    await expect(
      this.page.getByRole('button', { name: `Select ${routeName} route` }),
    ).toBeVisible();

    // Close the routes modal/drawer
    const closeButton = this.page.getByRole('button', { name: /Close routes/ });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Wait for modal to close
    await expect(closeButton).not.toBeVisible();
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
