import WalletImg from '../../wallet.svg';
import {
  Address,
  ChainId,
  SendTransactionResult,
  Wallet,
} from '@xlabs-libs/wallet-aggregator-core';

export const MANUAL_WALLET_NAME = 'Manual Wallet';

const CONNECTED = 'connected';
const DISCONNECTED = 'disconnected';

export class ManualWallet extends Wallet {
  private chainId?: ChainId;
  constructor(private address: Address, private connected = false) {
    super();
  }

  async connect({ chainId }: { chainId: ChainId }): Promise<string[]> {
    this.connected = true;
    this.chainId = chainId;
    this.emit(CONNECTED);
    return [CONNECTED];
  }

  getIcon() {
    return WalletImg;
  }

  getName() {
    return MANUAL_WALLET_NAME;
  }

  async disconnect() {
    this.emit(DISCONNECTED);
    this.connected = false;
  }

  getAddress() {
    return this.address;
  }

  getAddresses() {
    return [this.address];
  }

  async getBalance() {
    return '0';
  }

  isConnected() {
    return this.connected;
  }

  supportsChain(chainId: ChainId): boolean {
    // manual wallet supports all chains
    return true;
  }

  getUrl(): string {
    return '';
  }

  setMainAddress(address: Address): void {
    this.address = address;
  }

  getNetworkInfo() {
    return {
      chainId: this.chainId,
    };
  }

  getChainId(): ChainId {
    if (this.connected && this.chainId) {
      return this.chainId;
    }
    throw new Error('Wallet not connected');
  }

  getFeatures(): any[] {
    return [];
  }

  signTransaction(tx: any): Promise<any> {
    throw new Error('Method not supported.');
  }

  sendTransaction(tx: any): Promise<SendTransactionResult<any>> {
    throw new Error('Method not supported.');
  }

  signMessage(msg: any): Promise<any> {
    throw new Error('Method not supported.');
  }

  signAndSendTransaction(tx: any): Promise<SendTransactionResult<any>> {
    throw new Error('Method not supported.');
  }
}
