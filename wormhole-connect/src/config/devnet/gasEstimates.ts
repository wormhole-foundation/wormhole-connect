import { GasEstimates, Route } from '../types';

export const DEVNET_GAS_ESTIMATES: GasEstimates = {
  ethereum: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 200000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 300000,
    },
  },
  wormchain: {
    [Route.Bridge]: {
      sendNative: 0,
      sendToken: 0,
      claim: 0,
    },
  },
  osmosis: {
    [Route.Bridge]: {
      sendNative: 750000,
      sendToken: 750000,
      claim: 700000,
    },
  },
  terra2: {
    [Route.Bridge]: {
      sendNative: 750000,
      sendToken: 750000,
      claim: 700000,
    },
  },
};
