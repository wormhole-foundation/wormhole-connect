import { GasEstimates } from '../types';

export const DEVNET_GAS_ESTIMATES: GasEstimates = {
  ethereum: {
    sendNative: 100000,
    sendToken: 150000,
    sendNativeWithRelay: 200000,
    sendTokenWithRelay: 300000,
    claim: 200000,
  },
  wormchain: {
    sendNative: 0,
    sendToken: 0,
    claim: 0,
  },
  osmosis: {
    sendNative: 750000,
    sendToken: 750000,
    claim: 700000,
  },
  terra2: {
    sendNative: 750000,
    sendToken: 750000,
    claim: 700000,
  },
};
