import {
  ChainId,
  ChainName,
  Context,
  SendResult,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { postVaaSolanaWithRetry } from '@certusone/wormhole-sdk';
import { ContractReceipt } from 'ethers';
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
  ExodusWalletAdapter,
  BackpackWalletAdapter,
  NightlyWalletAdapter,
  BraveWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  clusterApiUrl,
  Connection as SolanaConnection,
  Transaction,
  ConfirmOptions,
} from '@solana/web3.js';
import { SolanaWallet } from '@xlabs-libs/wallet-aggregator-solana';

import { wh } from './sdk';
import { CHAINS, CHAINS_ARR, ENV, RPCS } from 'config';
import { getChainByChainId } from 'utils';

export enum TransferWallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
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

const tag = ENV === 'MAINNET' ? 'mainnet-beta' : 'devnet';
const connection = new SolanaConnection(RPCS.solana || clusterApiUrl(tag));

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
    exodus: new SolanaWallet(new ExodusWalletAdapter(), connection),
    backpack: new SolanaWallet(new BackpackWalletAdapter(), connection),
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    brave: new SolanaWallet(new BraveWalletAdapter(), connection),
  },
  aptos: {},
  cosmos: {},
  cosmosEvm: {},
};

export const walletAcceptedChains = (
  context: Context | undefined,
): ChainName[] => {
  if (!context) {
    return CHAINS_ARR.map((c) => c.key);
  }
  return CHAINS_ARR.filter((c) => c.context === context).map((c) => c.key);
};

export const setWalletConnection = (type: TransferWallet, wallet: Wallet) => {
  walletConnection[type] = wallet;
};
export const swapWalletConnections = () => {
  const temp = walletConnection.sending;
  walletConnection.sending = walletConnection.receiving;
  walletConnection.receiving = temp;
};

export const registerWalletSigner = (
  chain: ChainName | ChainId,
  type: TransferWallet,
) => {
  const w = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');
  const signer = w.getSigner();
  wh.registerSigner(chain, signer);
};

export const switchChain = async (
  chainId: number | string,
  type: TransferWallet,
): Promise<string | undefined> => {
  const w: Wallet = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');

  const config = getChainByChainId(chainId)!;
  const currentChain = w.getNetworkInfo().chainId;
  if (currentChain === chainId) return;
  if (config.context === Context.ETH) {
    try {
      // some wallets may not support chain switching
      await (w as EVMWallet).switchChain(chainId as number);
    } catch (e) {
      if (e instanceof NotSupported) return;
      throw e;
    }
  }
  if (config.context === Context.COSMOS) {
    throw new Error('Cosmos unexpected');
  }
  return w.getAddress();
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

export const signAndSendTransaction = async (
  chain: ChainName,
  transaction: SendResult,
  walletType: TransferWallet,
  options?: ConfirmOptions,
): Promise<string> => {
  const chainConfig = CHAINS[chain]!;
  switch (chainConfig.context) {
    case Context.ETH: {
      return (transaction as ContractReceipt).transactionHash;
    }
    case Context.SOLANA: {
      const tx = await signSolanaTransaction(
        transaction as Transaction,
        walletType,
        options,
      );
      return tx.id;
    }
    default:
      throw new Error(`Invalid context ${chainConfig.context}`);
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
