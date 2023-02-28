import {
  ChainId,
  ChainName,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWeb3Wallet,
  EVMWalletConnectWallet,
} from '@xlabs-libs/wallet-aggregator-evm';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection as SolanaConnection } from '@solana/web3.js';
import { SolanaWallet } from '@xlabs-libs/wallet-aggregator-solana';
import { Transaction, ConfirmOptions } from '@solana/web3.js';
import { registerSigner } from '../sdk/sdk';
import { WalletType } from 'store/wallet';
import { CHAINS_ARR } from 'sdk/config';
import { getNetworkByChainId } from 'utils';

export enum TransferWallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

let walletConnection = {
  sending: undefined as Wallet | undefined,
  receiving: undefined as Wallet | undefined,
};

const url = clusterApiUrl('devnet');
const connection = new SolanaConnection(url);

export const wallets = {
  evm: {
    metamask: new EVMWeb3Wallet(),
    walletConnect: new EVMWalletConnectWallet(),
  },
  solana: {
    phantom: new SolanaWallet(new PhantomWalletAdapter(), connection),
    solflare: new SolanaWallet(new SolflareWalletAdapter(), connection),
  },
};

const EVM_CHAINS = CHAINS_ARR.filter((c) => c.context === Context.ETH).map(
  (c) => c.key,
);
const SOL_CHAINS = CHAINS_ARR.filter((c) => c.context === Context.SOLANA).map(
  (c) => c.key,
);
export const walletAcceptedNetworks: Record<WalletType, ChainName[]> = {
  [WalletType.NONE]: CHAINS_ARR.map((c) => c.key),
  [WalletType.METAMASK]: EVM_CHAINS,
  [WalletType.WALLET_CONNECT]: EVM_CHAINS,
  [WalletType.PHANTOM]: SOL_CHAINS,
  [WalletType.SOLFLARE]: SOL_CHAINS,
};

export const setWalletConnection = (type: TransferWallet, wallet: Wallet) => {
  walletConnection[type] = wallet;
};

export const registerWalletSigner = (
  chain: ChainName | ChainId,
  type: TransferWallet,
) => {
  const w = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');
  const signer = w.getSigner();
  registerSigner(chain, signer);
};

export const switchNetwork = async (chainId: number, type: TransferWallet) => {
  const w = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');

  const config = getNetworkByChainId(chainId)!;
  if (config.context === Context.ETH) {
    await w.switchChain(chainId);
  }
};

export const disconnect = async (type: TransferWallet) => {
  const w = walletConnection[type]! as any;
  if (!w) throw new Error('not connected');
  await w.disconnect();
};

export const signSolanaTransaction = async (
  transaction: Transaction,
  options?: ConfirmOptions,
) => {
  const wallet = walletConnection.sending;
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const tx = await wallet?.signAndSendTransaction(transaction);
  return { transactionHash: tx.id };
};
