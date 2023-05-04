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
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SlopeWalletAdapter,
  SolongWalletAdapter,
  TorusWalletAdapter,
  ExodusWalletAdapter,
  BackpackWalletAdapter,
  NightlyWalletAdapter,
  BloctoWalletAdapter,
  BraveWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection as SolanaConnection } from '@solana/web3.js';
import { SolanaWallet } from '@xlabs-libs/wallet-aggregator-solana';
import { Transaction, ConfirmOptions } from '@solana/web3.js';
import { registerSigner } from '../sdk';
import { CHAINS, CHAINS_ARR } from '../config';
import { getNetworkByChainId } from 'utils';
import { WH_CONFIG } from '../config';
import { TransactionBlock } from '@mysten/sui.js';

export enum TransferWallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

export enum WalletType {
  NONE = 0,
  EVM,
  SOLANA,
  SUI,
}

export const TYPES_TO_CONTEXTS: Partial<Record<WalletType, Context>> = {
  [WalletType.EVM]: Context.ETH,
  [WalletType.SOLANA]: Context.SOLANA,
  [WalletType.SUI]: Context.SUI,
};

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

const tag = WH_CONFIG.env === 'MAINNET' ? 'mainnet-beta' : 'devnet';
const connection = new SolanaConnection(
  WH_CONFIG.rpcs.solana || clusterApiUrl(tag),
);

export const wallets = {
  evm: {
    metamask: new MetamaskWallet(),
    walletConnect: new WalletConnectLegacyWallet(),
  },
  solana: {
    phantom: new SolanaWallet(new PhantomWalletAdapter(), connection),
    solflare: new SolanaWallet(new SolflareWalletAdapter(), connection),
    clover: new SolanaWallet(new CloverWalletAdapter(), connection),
    coin98: new SolanaWallet(new Coin98WalletAdapter(), connection),
    slope: new SolanaWallet(new SlopeWalletAdapter(), connection),
    solong: new SolanaWallet(new SolongWalletAdapter(), connection),
    torus: new SolanaWallet(new TorusWalletAdapter(), connection),
    exodus: new SolanaWallet(new ExodusWalletAdapter(), connection),
    backpack: new SolanaWallet(new BackpackWalletAdapter(), connection),
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    blocto: new SolanaWallet(new BloctoWalletAdapter(), connection),
    brave: new SolanaWallet(new BraveWalletAdapter(), connection),
  },
};

const EVM_CHAINS = CHAINS_ARR.filter((c) => c.context === Context.ETH).map(
  (c) => c.key,
);
const SOL_CHAINS = CHAINS_ARR.filter((c) => c.context === Context.SOLANA).map(
  (c) => c.key,
);
const SUI_CHAINS = CHAINS_ARR.filter((c) => c.context === Context.SUI).map(
  (c) => c.key,
);
export const walletAcceptedNetworks: Record<WalletType, ChainName[]> = {
  [WalletType.NONE]: CHAINS_ARR.map((c) => c.key),
  [WalletType.EVM]: EVM_CHAINS,
  [WalletType.SOLANA]: SOL_CHAINS,
  [WalletType.SUI]: SUI_CHAINS,
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
  walletType: TransferWallet,
  options?: ConfirmOptions,
) => {
  const wallet = walletConnection[walletType];
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  return await (wallet as SolanaWallet).signAndSendTransaction({
    transaction,
    options,
  });
};

export const signSuiTransaction = async (
  transactionBlock: TransactionBlock,
  walletType: TransferWallet,
) => {
  const wallet = walletConnection[walletType];
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  return await wallet.signAndSendTransaction({ transactionBlock });
};

export const signAndSendTransaction = async (
  chain: ChainName,
  transaction: any,
  walletType: TransferWallet,
  options?: ConfirmOptions,
): Promise<string> => {
  const network = CHAINS[chain]!;
  switch (network.context) {
    case Context.ETH: {
      return transaction.transactionHash;
    }
    case Context.SOLANA: {
      const tx = await signSolanaTransaction(
        transaction as Transaction,
        walletType,
        options,
      );
      return tx.id;
    }
    case Context.SUI: {
      const tx = await signSuiTransaction(
        transaction as TransactionBlock,
        walletType,
      );
      return tx.id;
    }
    default:
      return '';
  }
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
