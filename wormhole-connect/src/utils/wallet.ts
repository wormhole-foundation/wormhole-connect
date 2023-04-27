import {
  ChainId,
  ChainName,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { postVaaSolanaWithRetry } from '@certusone/wormhole-sdk';
import { NotSupported, Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWallet,
  MetamaskWallet,
  WalletConnectLegacyWallet,
} from '@xlabs-libs/wallet-aggregator-evm';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection as SolanaConnection } from '@solana/web3.js';
import { SolanaWallet } from '@xlabs-libs/wallet-aggregator-solana';
import { Transaction, ConfirmOptions } from '@solana/web3.js';
import { registerSigner } from '../sdk';
import { CHAINS_ARR } from '../config';
import { getNetworkByChainId } from 'utils';

export enum TransferWallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

export enum WalletType {
  NONE = 0,
  METAMASK,
  WALLET_CONNECT,
  PHANTOM,
  SOLFLARE,
}

interface AssetInfo {
  address: string;
  symbol: string;
  decimals: number;
  chainId?: number;
}

let walletConnection = {
  sending: undefined as Wallet | undefined,
  receiving: undefined as Wallet | undefined,
};

const url = clusterApiUrl('devnet');
const connection = new SolanaConnection(url);

export const wallets = {
  evm: {
    metamask: new MetamaskWallet(),
    walletConnect: new WalletConnectLegacyWallet(),
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
  const w: Wallet = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');

  const config = getNetworkByChainId(chainId)!;
  const currentChain = w.getNetworkInfo().chainId;
  if (currentChain === chainId) return;
  if (config.context === Context.ETH) {
    try {
      // some wallets may not support chain switching
      await (w as EVMWallet).switchChain(chainId);
    } catch (e) {
      if (e instanceof NotSupported) return;
      throw e;
    }
  }
};

export const disconnect = async (type: TransferWallet) => {
  const w = walletConnection[type]! as any;
  if (!w) return;
  await w.disconnect();
};

export const watchAsset = async (asset: AssetInfo, type: TransferWallet) => {
  const w = walletConnection[type]! as EVMWallet;
  // check in case the actual type is not EVMWallet
  if (!w || !w.watchAsset) return;
  await w.watchAsset({
    type: 'ERC20',
    options: asset,
  });
};

export const signSolanaTransaction = async (
  transaction: Transaction,
  type: TransferWallet,
  options?: ConfirmOptions,
) => {
  const wallet = walletConnection[type];
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const tx = await (wallet as SolanaWallet).signAndSendTransaction({
    transaction,
    options
  });
  return { transactionHash: tx.id };
};

export const postVaa = async (
  connection: any,
  coreContract: string,
  signedVAA: Buffer,
) => {
  const wallet = walletConnection.receiving;
  if (!wallet) throw new Error('not connected');
  const pk = (wallet as any).adapter.publicKey;
  const MAX_VAA_UPLOAD_RETRIES_SOLANA = 5;

  await postVaaSolanaWithRetry(
    connection,
    wallet.signTransaction.bind(wallet), // Solana Wallet Signer
    coreContract,
    pk.toString(),
    Buffer.from(signedVAA),
    MAX_VAA_UPLOAD_RETRIES_SOLANA,
  );
};
