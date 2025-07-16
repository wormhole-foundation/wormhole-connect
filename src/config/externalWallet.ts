import { Chain, UnsignedTransaction } from '@wormhole-foundation/sdk';

export type WalletType = 'sending' | 'receiving';

export interface ExternalWalletState {
  isConnected: boolean;
  address?: string;
  chain?: Chain;
  walletName?: string;
  walletIcon?: string;
}

export interface TransactionRequest {
  chain: Chain;
  // TODO: consider using the platform's library type (e.g. ethers.TransactionRequest)
  transaction: UnsignedTransaction;
  walletType: WalletType;
}

export type WalletStateChangeCallback = (
  type: WalletType,
  state: ExternalWalletState,
) => void;

export interface ExternalWalletManager {
  /**
   * Get the current state of a wallet (sending or receiving)
   */
  getWalletState: (type: WalletType) => Promise<ExternalWalletState>;

  /**
   * Request the parent app to connect a wallet for the specified type and chain
   * @returns Promise<boolean> - true if connection was successful, false if user rejected
   */
  requestConnection: (type: WalletType, chain: Chain) => Promise<boolean>;

  /**
   * Request the parent app to disconnect a wallet
   */
  requestDisconnection: (type: WalletType) => Promise<void>;

  /**
   * Request the parent app to change the active address for a wallet
   */
  requestAddressChange: (type: WalletType, address: string) => Promise<void>;

  /**
   * Request the parent app to sign and send a transaction
   * @returns Promise<string> - transaction hash
   */
  signAndSendTransaction: (params: TransactionRequest) => Promise<string>;

  /**
   * Callback when Connect needs a wallet but none is connected
   * Parent can use this to show wallet connection UI
   */
  onWalletRequired: (type: WalletType, chain: Chain) => void;

  /**
   * Callback when Connect needs the wallet to switch to a different chain
   */
  onChainSwitchRequired: (type: WalletType, chain: Chain) => void;

  /**
   * Register a callback to be notified when wallet state changes in the parent app
   * Parent should call the provided callback whenever wallet state changes
   */
  onWalletStateChanged: (callback: WalletStateChangeCallback) => void;

  /**
   * Optional method to swap sending and receiving wallets
   * Called when user clicks the swap button in Connect's UI
   */
  swapWallets?: () => Promise<void>;
}
