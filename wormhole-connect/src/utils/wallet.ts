import {
  AptosContext,
  ChainId,
  ChainName,
  Context,
  WormholeContext,
  SendResult
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
import { SeiTransaction, SeiWallet } from '@xlabs-libs/wallet-aggregator-sei';
import { Transaction, ConfirmOptions } from '@solana/web3.js';
import { registerSigner, wh } from '../sdk';
import { CHAINS, CHAINS_ARR } from '../config';
import { getNetworkByChainId } from 'utils';
import { WH_CONFIG } from '../config';
import { TransactionBlock } from '@mysten/sui.js';
import { AptosWallet } from '@xlabs-libs/wallet-aggregator-aptos';
import { Types } from 'aptos';
import {
  AptosSnapAdapter,
  AptosWalletAdapter,
  BitkeepWalletAdapter,
  FewchaWalletAdapter,
  MartianWalletAdapter,
  NightlyWalletAdapter as NightlyWalletAdapterAptos,
  PontemWalletAdapter,
  RiseWalletAdapter,
  SpikaWalletAdapter,
  WalletAdapterNetwork,
} from '@manahippo/aptos-wallet-adapter';
import { ContractReceipt } from 'ethers';

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
  aptos: {
    aptos: new AptosWallet(new AptosWalletAdapter()),
    martian: new AptosWallet(new MartianWalletAdapter()),
    rise: new AptosWallet(new RiseWalletAdapter()),
    nightly: new AptosWallet(new NightlyWalletAdapterAptos()),
    pontem: new AptosWallet(new PontemWalletAdapter()),
    fewcha: new AptosWallet(new FewchaWalletAdapter()),
    spika: new AptosWallet(new SpikaWalletAdapter()),
    snap: new AptosWallet(
      new AptosSnapAdapter({
        network:
          WH_CONFIG.env === 'MAINNET'
            ? WalletAdapterNetwork.Mainnet
            : WalletAdapterNetwork.Testnet,
      }),
    ),
    bitkeep: new AptosWallet(new BitkeepWalletAdapter()),
  },
};

export const walletAcceptedNetworks = (
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

export const signAptosTransaction = async (
  payload: Types.EntryFunctionPayload,
  walletType: TransferWallet,
) => {
  const wallet = walletConnection[walletType];
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  // The wallets do not handle Uint8Array serialization
  if (payload.arguments) {
    payload.arguments = payload.arguments.map((a: any) =>
      a instanceof Uint8Array ? Array.from(a) : a,
    );
  }

  return await (wallet as AptosWallet).signAndSendTransaction(
    payload as Types.TransactionPayload,
  );
};

export const signSeiTransaction = async (
  transaction: SeiTransaction,
  walletType: TransferWallet,
) => {
  const wallet = walletConnection[walletType];
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const seiWallet = wallet as SeiWallet;
  const result = await seiWallet.signAndSendTransaction(transaction);

  if (result.data?.code) {
    throw new Error(
      `Sei transaction failed with code ${result.data.code}. Log: ${result.data.rawLog}`,
    );
  }

  return result;
};

export const signAndSendTransaction = async (
  chain: ChainName,
  transaction: SendResult,
  walletType: TransferWallet,
  options?: ConfirmOptions,
): Promise<string> => {
  const network = CHAINS[chain]!;
  switch (network.context) {
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
    case Context.SUI: {
      const tx = await signSuiTransaction(
        transaction as TransactionBlock,
        walletType,
      );
      return tx.id;
    }
    case Context.APTOS: {
      const tx = await signAptosTransaction(
        transaction as Types.EntryFunctionPayload,
        walletType,
      );
      const aptosClient = (
        wh.getContext('aptos') as AptosContext<WormholeContext>
      ).aptosClient;
      await aptosClient.waitForTransaction(tx.id);
      return tx.id;
    }
    case Context.SEI: {
      const tx = await signSeiTransaction(
        transaction as SeiTransaction,
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
