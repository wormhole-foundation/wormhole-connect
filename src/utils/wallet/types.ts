import type {
  amount,
  Chain,
  Network,
  UnsignedTransaction,
} from '@wormhole-foundation/sdk';
import type { TransferWallet } from '.';

export type Balance = {
  lastUpdated: number;
  balance: amount.Amount | null;
};

export type Balances = { [key: string]: Balance };

export type WalletEvents = {
  disconnect: () => void;
  accountsChanged: (accounts: string[]) => void;
};

export interface Wallet {
  getAddress(): string | undefined;

  getName(): string;

  getIcon(): string | undefined;

  getUrl(): string | undefined;

  /**
   * Connect the wallet to a specific chain.
   * @param options - Connection options object containing:
   *   - chainId: The chain ID to connect to (number for EVM, string for other platforms)
   * @returns Promise resolving to an array of connected addresses
   */
  connect(options?: { chainId: number | string }): Promise<string[]>;

  disconnect(): void;

  on<T extends keyof WalletEvents>(event: T, handler: WalletEvents[T]): void;

  off<T extends keyof WalletEvents>(event: T, handler: WalletEvents[T]): void;
}

export type WalletConnectedHandler = (
  wallet: Wallet,
  chain: Chain,
  type: TransferWallet,
) => void;

export type WalletProviderEvents = {
  walletConnected: WalletConnectedHandler;
};

export interface WormholeConnectWalletProvider {
  /**
   * Initiate a wallet connection, which may require user interaction (e.g., opening a wallet selection UI).
   * This is the active method for establishing new wallet connections.
   *
   * @param chain - The chain to connect to
   * @param type - Whether this is for sending or receiving
   * @param autoConnect - If true, attempt to connect automatically without user interaction
   * @returns Promise resolving to the connected wallet, or null if connection failed/was cancelled
   */
  connectWallet(
    chain: Chain,
    type: TransferWallet,
    autoConnect?: boolean,
  ): Promise<Wallet | null>;

  /**
   * Get an already connected wallet without requiring user interaction.
   * This is a passive method that only returns existing connections.
   *
   * @param chain - The chain to check for an existing connection
   * @param type - Whether to check for sending or receiving wallet
   * @returns The connected wallet, or null if no wallet is currently connected
   */
  getWallet(chain: Chain, type: TransferWallet): Wallet | null;

  signAndSendTransaction(
    chain: Chain,
    wallet: Wallet,
    transaction: UnsignedTransaction<Network, Chain>,
  ): Promise<string>;

  swapWallets(): void;

  on<T extends keyof WalletProviderEvents>(
    event: T,
    handler: WalletProviderEvents[T],
  ): void;

  off<T extends keyof WalletProviderEvents>(
    event: T,
    handler: WalletProviderEvents[T],
  ): void;
}
