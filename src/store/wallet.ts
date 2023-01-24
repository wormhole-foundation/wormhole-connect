import { createSlice } from '@reduxjs/toolkit';
import TESTNET_CONFIG from 'sdk/config/TESTNET';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import { providers } from 'ethers';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { registerSigner } from 'utils/sdk';
const { REACT_APP_ENV, REACT_APP_INFURA_KEY } = process.env;

let connection: any; // instance of web3Modal connection
let web3: any; // instance of ethers web3Provider

const mainnetRpcs = {}; // TODO:
const testnetRpcs = {
  5: TESTNET_CONFIG.rpcs.goerli,
  97: TESTNET_CONFIG.rpcs.bsc,
  43113: TESTNET_CONFIG.rpcs.fuji,
  4002: TESTNET_CONFIG.rpcs.fantom,
};

export async function openWalletModal(theme: any) {
  console.log('connecting wallet');

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

  try {
    connection = await web3Modal.connect();
  } catch (err: unknown) {
    // NOTE: just swallow this error, don't need to
    // alert sentry if the modal was closed by the user
    if ((err as any).message === 'Modal closed by user') {
      return;
    }
    throw err;
  }
  web3 = new Web3(connection);
  const provider = new providers.Web3Provider(connection, 'any');
  const signer = provider.getSigner();

  console.log('connection', connection);
  console.log('signer', signer);
  console.log('web3', web3);
  registerSigner(signer);

  // listen to events
  // connection.on('accountsChanged', async () => {
  //   if (connection.isMetaMask) {
  //     location.reload()
  //     return
  //   }
  //   await dispatch('checkAllowed')
  // })
  // connection.on('chainChanged', async (chainId: number) => {
  //   console.log('network change', chainId)
  //   // get name of network and set in store
  //   const id = BigNumber.from(chainId).toNumber()
  //   const network = getNetworkByChainID(id)
  //   if (network) {
  //     // network supported, setting wallet network
  //     await dispatch('setWalletNetwork', network.name)
  //   } else {
  //     // network not supported, clearing network
  //     await dispatch('setWalletNetwork', '')
  //   }
  // })

  // // get and set address
  // const address = await signer.getAddress()
  // dispatch('setWalletAddress', address)

  // // set network, if supported
  // const { chainId } = connection
  // const chainIdNum = BigNumber.from(chainId).toNumber()
  // const network = getNetworkByChainID(chainIdNum)
  // if (network) {
  //   dispatch('setWalletNetwork', network.name)
  //   dispatch('setOriginNetwork', network.name)
  // } else {
  //   console.log('network not supported')
  // }

  // await dispatch('checkAllowed')
  // commit(types.SET_WALLET_CONNECTION, true)
}

export enum WalletType {
  NONE = 0,
  METAMASK,
  TRUST_WALLET,
}

export interface WalletState {
  sending: {
    connected: boolean;
    type: WalletType;
    address: string;
  };
  receiving: {
    connected: boolean;
    type: WalletType;
    address: string;
  };
}

const initialState: WalletState = {
  sending: {
    connected: false,
    type: WalletType.NONE,
    address: '',
  },
  receiving: {
    connected: false,
    type: WalletType.NONE,
    address: '',
  },
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state: WalletState) => {
      console.log('connect sending wallet');
      // TODO: open wallet modal
      state.sending.connected = true;
      state.sending.address = '0x1234...5678';
    },
    connectReceivingWallet: (state: WalletState) => {
      console.log('connect receiving wallet');
      state.receiving.connected = true;
      state.receiving.address = '0x8765...4321';
    },
  },
});

export const { connectWallet, connectReceivingWallet } = walletSlice.actions;

export default walletSlice.reducer;
