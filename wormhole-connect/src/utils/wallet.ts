import {
  CONFIG,
  ChainId,
  ChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';
import Web3Modal from 'web3modal';
import { providers } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { registerSigner } from '../sdk/sdk';
import { getNetworkByChainId } from 'utils';
import { TOKENS } from 'sdk/config';
const { REACT_APP_ENV, REACT_APP_INFURA_KEY } = process.env;

export enum Wallet {
  SENDING = 'sending',
  RECEIVING = 'receiving',
}

let sendingWallet = {
  connection: undefined as any,
  modal: undefined as any,
};

let receivingWallet = {
  connection: undefined as any,
  modal: undefined as any,
};

export type Connection = {
  connection: any;
  address: string;
  signer: providers.JsonRpcSigner;
};

const mainnetRpcs = {}; // TODO:
const testnetRpcs = {
  5: CONFIG.TESTNET.rpcs.goerli,
  97: CONFIG.TESTNET.rpcs.bsc,
  43113: CONFIG.TESTNET.rpcs.fuji,
  4002: CONFIG.TESTNET.rpcs.fantom,
};

export const openWalletModal = async (
  theme: any,
  isReceiving?: boolean,
): Promise<Connection> => {
  console.log('getting wallet connection');

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        rpc: REACT_APP_ENV === 'MAINNET' ? mainnetRpcs : testnetRpcs,
        infuraId: REACT_APP_INFURA_KEY, // required
      },
      // display: {
      //   description: 'Supported: LedgerLive',
      // },
    },
  };

  const web3Modal = new Web3Modal({
    providerOptions, // required
    cacheProvider: false,
    theme: {
      background: theme.palette.card.background,
      main: theme.palette.text.primary,
      secondary: theme.palette.text.secondary,
      border: 'none',
      hover: theme.palette.popover.secondary,
    },
  });

  let connection;
  try {
    connection = await web3Modal.connect();
  } catch (err: unknown) {
    if ((err as any).message !== 'Modal closed by user') {
      throw err;
    }
  }
  if (!connection) throw new Error('failed to establish connection');
  const provider = new providers.Web3Provider(connection, 'any');
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  console.log('address', address);
  console.log('connection', connection);
  console.log('signer', signer);

  if (isReceiving) {
    receivingWallet.connection = connection;
    receivingWallet.modal = web3Modal;
  } else {
    sendingWallet.connection = connection;
    sendingWallet.modal = web3Modal;
  }
  return { connection, address, signer };
};

export const registerWalletSigner = (
  chain: ChainName | ChainId,
  wallet: Wallet,
) => {
  if (wallet === Wallet.SENDING) {
    const provider = new providers.Web3Provider(
      sendingWallet.connection,
      'any',
    );
    const signer = provider.getSigner();
    registerSigner(chain, signer);
  } else {
    const provider = new providers.Web3Provider(
      receivingWallet.connection,
      'any',
    );
    const signer = provider.getSigner();
    registerSigner(chain, signer);
  }
};

export const switchNetwork = async (chainId: number, type: Wallet) => {
  const stringId = chainId.toString(16);
  const hexChainId = '0x' + stringId;

  const connection =
    type === Wallet.SENDING
      ? sendingWallet.connection
      : receivingWallet.connection;
  if (!connection) throw new Error('must connect wallet');

  // if wallet is already on correct chain, return
  if (connection.chainId == stringId) return;

  // switch chains
  // TODO: show switch network prompt for non-metamask wallets
  await connection
    .request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    })
    .then((res: any) => console.log(res))
    .catch(async (e: any) => {
      const network = getNetworkByChainId(chainId);
      if (!network) return;
      const token = TOKENS[network.gasToken];
      const nativeCurrency = token && {
        name: token.symbol,
        symbol: token.symbol,
        decimals: token.decimals,
      };
      const env = REACT_APP_ENV! as 'MAINNET' | 'TESTNET';
      const rpc = CONFIG[env].rpcs[network.key];
      await connection.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: hexChainId,
            chainName: network.key,
            rpcUrls: [rpc],
            nativeCurrency,
          },
        ],
      });
      console.error(e);
    });
};

export const disconnect = async (type: string) => {
  if (type === Wallet.SENDING) {
    await sendingWallet.modal.clearCachedProvider();
  } else {
    await receivingWallet.modal.clearCachedProvider();
  }
};
