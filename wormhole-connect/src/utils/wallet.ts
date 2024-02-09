import {
  AptosContext,
  ChainId,
  ChainName,
  ChainResourceMap,
  Context,
  WormholeContext,
  SendResult,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { CHAIN_ID_SEI, postVaaSolanaWithRetry } from '@certusone/wormhole-sdk';
import { ContractReceipt } from 'ethers';
import { NotSupported, Wallet } from '@xlabs-libs/wallet-aggregator-core';
import {
  EVMWallet,
  InjectedWallet,
  WalletConnectWallet,
} from '@xlabs-libs/wallet-aggregator-evm';
import {
  CosmosTransaction,
  CosmosWallet,
  getWallets as getCosmosWallets,
} from '@xlabs-libs/wallet-aggregator-cosmos';
import { getWallets as getCosmosEvmWallets } from '@xlabs-libs/wallet-aggregator-cosmos-evm';
import {
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SolongWalletAdapter,
  TorusWalletAdapter,
  NightlyWalletAdapter,
  WalletConnectWalletAdapter,
  BitgetWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork as SolanaNetwork } from '@solana/wallet-adapter-base';
import {
  clusterApiUrl,
  Connection as SolanaConnection,
  Transaction,
  ConfirmOptions,
} from '@solana/web3.js';
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
  WalletAdapterNetwork as AptosNetwork,
} from '@manahippo/aptos-wallet-adapter';
import { TransactionBlock } from '@mysten/sui.js';
import {
  SolanaWallet,
  getSolanaStandardWallets,
} from '@xlabs-libs/wallet-aggregator-solana';
import { SeiTransaction, SeiWallet } from '@xlabs-libs/wallet-aggregator-sei';
import { AptosWallet } from '@xlabs-libs/wallet-aggregator-aptos';
import { Types } from 'aptos';

import { wh } from './sdk';
import {
  CHAINS,
  CHAINS_ARR,
  ENV,
  REST,
  RPCS,
  WALLET_CONNECT_PROJECT_ID,
  isMainnet,
} from 'config';
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

const walletConnection = {
  sending: undefined as Wallet | undefined,
  receiving: undefined as Wallet | undefined,
};

const tag = ENV === 'MAINNET' ? 'mainnet-beta' : 'devnet';
const connection = new SolanaConnection(RPCS.solana || clusterApiUrl(tag));

const buildCosmosWallets = (evm?: boolean) => {
  const prepareMap = (map: ChainResourceMap) =>
    Object.keys(map).reduce((acc, k) => {
      const conf = CHAINS[k as ChainName];
      if (conf?.chainId && conf?.context === Context.COSMOS) {
        acc[conf.chainId] = map[k as ChainName]!;
      }
      return acc;
    }, {} as Record<string, string>);

  const rpcs = prepareMap(RPCS);
  const rests = prepareMap(REST);

  const wallets: CosmosWallet[] = evm
    ? (getCosmosEvmWallets(rpcs, rests) as any[] as CosmosWallet[])
    : getCosmosWallets(rpcs, rests);

  return wallets.reduce((acc, w: CosmosWallet) => {
    acc[w.getName()] = w;
    return acc;
  }, {} as Record<string, Wallet>);
};

const getWalletName = (wallet: Wallet) =>
  wallet.getName().toLowerCase().replace('wallet', '').trim();

export const wallets = {
  evm: {
    injected: new InjectedWallet(),
    ...(WALLET_CONNECT_PROJECT_ID
      ? {
          walletConnect: new WalletConnectWallet({
            connectorOptions: {
              projectId: WALLET_CONNECT_PROJECT_ID,
            },
          }),
        }
      : {}),
  },
  solana: {
    ...getSolanaStandardWallets(connection).reduce((acc, w) => {
      acc[getWalletName(w)] = w;
      return acc;
    }, {} as Record<string, Wallet>),
    //Override standard wallets with custom ones
    bitget: new SolanaWallet(new BitgetWalletAdapter(), connection),
    clover: new SolanaWallet(new CloverWalletAdapter(), connection),
    coin98: new SolanaWallet(new Coin98WalletAdapter(), connection),
    solong: new SolanaWallet(new SolongWalletAdapter(), connection),
    torus: new SolanaWallet(new TorusWalletAdapter(), connection),
    nightly: new SolanaWallet(new NightlyWalletAdapter(), connection),
    ...(WALLET_CONNECT_PROJECT_ID
      ? {
          walletConnect: new SolanaWallet(
            new WalletConnectWalletAdapter({
              network: isMainnet ? SolanaNetwork.Mainnet : SolanaNetwork.Devnet,
              options: {
                projectId: WALLET_CONNECT_PROJECT_ID,
              },
            }),
            connection,
          ),
        }
      : {}),
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
        network: isMainnet ? AptosNetwork.Mainnet : AptosNetwork.Testnet,
      }),
    ),
    bitkeep: new AptosWallet(new BitkeepWalletAdapter()),
  },
  cosmos: buildCosmosWallets(),
  cosmosEvm: buildCosmosWallets(true),
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
    await (w as CosmosWallet).switchChain(chainId as string);
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

export const signCosmosTransaction = async (
  transaction: CosmosTransaction,
  walletType: TransferWallet,
) => {
  const wallet = walletConnection[walletType];
  if (!wallet || !wallet.signAndSendTransaction) {
    throw new Error('wallet.signAndSendTransaction is undefined');
  }

  const cosmosWallet = wallet as CosmosWallet;
  const result = await cosmosWallet.signAndSendTransaction(transaction);

  if (result.data?.code) {
    throw new Error(
      `Cosmos transaction failed with code ${result.data.code}. Log: ${result.data.rawLog}`,
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
    case Context.COSMOS: {
      const tx = await signCosmosTransaction(
        transaction as CosmosTransaction,
        walletType,
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

export const simulateSeiTransaction = async (
  transaction: SeiTransaction,
  walletType: TransferWallet,
) => {
  const wallet = walletConnection[walletType] as SeiWallet;
  if (wallet?.getChainId() !== CHAIN_ID_SEI)
    throw new Error('Wallet is not for Sei chain');
  return wallet.calculateFee(transaction);
};
