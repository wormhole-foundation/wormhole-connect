import { createSlice } from '@reduxjs/toolkit';
import { CONFIG } from '@sdk';
import Web3Modal from 'web3modal';
import { providers } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { registerSigner } from 'utils/sdk';
const { REACT_APP_ENV, REACT_APP_INFURA_KEY } = process.env;

let connection: any;

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

export async function openWalletModal(
  theme: any,
  isReceiving?: boolean,
): Promise<Connection> {
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
      hover: theme.palette.options.hover,
    },
  });

  let walletConnection;
  try {
    walletConnection = await web3Modal.connect();
  } catch (err: unknown) {
    if ((err as any).message !== 'Modal closed by user') {
      throw err;
    }
  }
  if (!walletConnection) throw new Error('failed to establish connection');
  const provider = new providers.Web3Provider(walletConnection, 'any');
  const signer = provider.getSigner();
  const address = await signer.getAddress();

  console.log('address', address);
  console.log('connection', walletConnection);
  console.log('signer', signer);

  if (!isReceiving) {
    connection = walletConnection;
    console.log(connection);
    registerSigner(signer);
  }
  return { connection: walletConnection, address, signer };
}

export enum WalletType {
  NONE = 0,
  METAMASK,
  TRUST_WALLET,
}

export interface WalletState {
  sending: {
    type: WalletType;
    address: string;
  };
  receiving: {
    type: WalletType;
    address: string;
  };
}

const initialState: WalletState = {
  sending: {
    type: WalletType.NONE,
    address: '',
  },
  receiving: {
    type: WalletType.NONE,
    address: '',
  },
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state: WalletState, { payload }: { payload: string }) => {
      console.log('connect sending wallet');
      state.sending.address = payload;
    },
    connectReceivingWallet: (
      state: WalletState,
      { payload }: { payload: string },
    ) => {
      console.log('connect receiving wallet');
      state.receiving.address = payload;
    },
  },
});

export const { connectWallet, connectReceivingWallet } = walletSlice.actions;

export default walletSlice.reducer;
