import {
  ChainId,
  ChainName,
  Context,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Wallet } from "@xlabs-libs/wallet-aggregator-core"
import {
  EVMWeb3Wallet,
  EVMWalletConnectWallet,
} from "@xlabs-libs/wallet-aggregator-evm";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Connection as SolanaConnection } from "@solana/web3.js";
import { SolanaWallet } from "@xlabs-libs/wallet-aggregator-solana";
import { providers } from 'ethers';
import { registerSigner } from '../sdk/sdk';
import { WalletType } from 'store/wallet';
import { CHAINS_ARR } from 'sdk/config';

export enum TransferWallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

let walletConnection = {
  sending: undefined as Wallet | undefined,
  receiving: undefined as Wallet | undefined,
}

export type Connection = {
  connection: any;
  address: string;
  signer: providers.JsonRpcSigner;
};

const url = clusterApiUrl('testnet');
const connection = new SolanaConnection(url);

export const wallets = {
  evm: {
    metamask: new EVMWeb3Wallet(),
    walletConnect: new EVMWalletConnectWallet(),
  },
  solana: {
    phantom: new SolanaWallet(new PhantomWalletAdapter(), connection),
    solflare: new SolanaWallet(new SolflareWalletAdapter(), connection),
  }
}

const EVM_CHAINS = CHAINS_ARR.filter(c => c.context === Context.ETH).map(c => c.key);
const SOL_CHAINS = CHAINS_ARR.filter(c => c.context === Context.SOLANA).map(c => c.key)
export const walletAcceptedNetworks: Record<WalletType, ChainName[]> = {
  [WalletType.NONE]: CHAINS_ARR.map(c => c.key),
  [WalletType.METAMASK]: EVM_CHAINS,
  [WalletType.WALLET_CONNECT]: EVM_CHAINS,
  [WalletType.PHANTOM]: SOL_CHAINS,
  [WalletType.SOLFLARE]: SOL_CHAINS,
}

export const setWalletConnection = (type: TransferWallet, wallet: Wallet) => {
  walletConnection[type] = wallet;
}

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
  // const stringId = chainId.toString(16);
  // const hexChainId = '0x' + stringId;

  const w = walletConnection[type]! as any;
  if (!w) throw new Error('must connect wallet');

  // // if wallet is already on correct chain, return
  // if (connection.chainId == stringId) return;

  // // switch chains
  // // TODO: show switch network prompt for non-metamask wallets
  // await connection
  //   .request({
  //     method: 'wallet_switchEthereumChain',
  //     params: [{ chainId: hexChainId }],
  //   })
  //   .then((res: any) => console.log(res))
  //   .catch(async (e: any) => {
  //     const network = getNetworkByChainId(chainId);
  //     if (!network) return;
  //     const token = TOKENS[network.gasToken];
  //     const nativeCurrency = token && {
  //       name: token.symbol,
  //       symbol: token.symbol,
  //       decimals: token.decimals,
  //     };
  //     const env = REACT_APP_ENV! as 'MAINNET' | 'TESTNET';
  //     const rpc = CONFIG[env].rpcs[network.key];
  //     await connection.request({
  //       method: 'wallet_addEthereumChain',
  //       params: [
  //         {
  //           chainId: hexChainId,
  //           chainName: network.key,
  //           rpcUrls: [rpc],
  //           nativeCurrency,
  //         },
  //       ],
  //     });
  //     console.error(e);
  //   });
};

export const disconnect = async (type: TransferWallet) => {
  const w = walletConnection[type]! as any;
  if (!w) throw new Error('not connected');
  await w.disconnect();
}