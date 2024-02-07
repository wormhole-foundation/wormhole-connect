import { GasEstimates, Route } from '../types';

export const TESTNET_GAS_ESTIMATES: GasEstimates = {
  goerli: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 200000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 300000,
    },
    [Route.CCTPManual]: {
      sendToken: 150000,
      claim: 300000,
    },
    [Route.CCTPRelay]: {
      sendToken: 300000,
    },
    [Route.TBTC]: {
      sendToken: 150000,
      claim: 200000,
    },
  },
  mumbai: {
    [Route.Bridge]: {
      sendNative: 200000,
      sendToken: 150000,
      claim: 200000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 250000,
    },
    [Route.TBTC]: {
      sendToken: 200000,
      claim: 300000,
    },
  },
  bsc: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 200000,
      claim: 175000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 300000,
    },
  },
  fuji: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 200000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 300000,
    },
    [Route.CCTPManual]: {
      sendToken: 150000,
      claim: 300000,
    },
    [Route.CCTPRelay]: {
      sendToken: 300000,
    },
  },
  fantom: {
    [Route.Bridge]: {
      sendNative: 150000,
      sendToken: 150000,
      claim: 200000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 300000,
    },
  },
  alfajores: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 100000,
      claim: 175000,
    },
    [Route.Relay]: {
      sendNative: 300000,
      sendToken: 300000,
    },
  },
  moonbasealpha: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 200000,
      claim: 200000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 300000,
    },
  },
  solana: {
    [Route.Bridge]: {
      sendNative: 15000,
      sendToken: 15000,
      claim: 25000,
    },
    [Route.Relay]: {
      sendNative: 15000,
      sendToken: 15000,
    },
    [Route.TBTC]: {
      sendToken: 15000,
      claim: 25000,
    },
  },
  sui: {
    [Route.Bridge]: {
      sendNative: 20000000,
      sendToken: 20000000,
      claim: 20000000,
    },
    [Route.Relay]: {
      sendNative: 20000000,
      sendToken: 20000000,
    },
  },
  aptos: {
    [Route.Bridge]: {
      sendNative: 34,
      sendToken: 34,
      claim: 615,
    },
  },
  sei: {
    [Route.Bridge]: {
      sendNative: 1000000,
      sendToken: 1000000,
      claim: 1000000,
    },
  },
  basegoerli: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 1000000,
      claim: 1000000,
    },
    [Route.Relay]: {
      sendNative: 300000,
      sendToken: 300000,
    },
    [Route.CCTPManual]: {
      sendToken: 300000,
      claim: 500000,
    },
    [Route.CCTPRelay]: {
      sendToken: 300000,
    },
    [Route.TBTC]: {
      sendToken: 300000,
      claim: 500000,
    },
  },
  klaytn: {
    [Route.Bridge]: {
      sendNative: 2000000,
      sendToken: 3000000,
      claim: 4000000,
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
      sendNative: 0,
      sendToken: 0,
      claim: 0,
    },
  },
  arbitrumgoerli: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 150000,
    },
    [Route.CCTPManual]: {
      sendToken: 150000,
    },
    [Route.CCTPRelay]: {
      sendToken: 300000,
    },
    [Route.TBTC]: {
      sendToken: 150000,
      claim: 300000,
    },
  },
  optimismgoerli: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 100000,
      claim: 100000,
    },
    [Route.CCTPManual]: {
      sendToken: 150000,
    },
    [Route.CCTPRelay]: {
      sendToken: 300000,
    },
    [Route.TBTC]: {
      sendToken: 150000,
      claim: 300000,
    },
  },
  cosmoshub: {
    [Route.Bridge]: {
      sendNative: 0,
      sendToken: 0,
      claim: 0,
    },
  },
  evmos: {
    [Route.Bridge]: {
      sendNative: 0,
      sendToken: 0,
      claim: 0,
    },
  },
  kujira: {
    [Route.Bridge]: {
      sendNative: 0,
      sendToken: 0,
      claim: 0,
    },
  },
  sepolia: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 200000,
    },
  },
  arbitrum_sepolia: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 200000,
    },
  },
  base_sepolia: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 200000,
    },
  },
  optimism_sepolia: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 200000,
    },
  },
};
