import { GasEstimates, Route } from '../types';

export const MAINNET_GAS_ESTIMATES: GasEstimates = {
  ethereum: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 300000,
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
      claim: 300000,
    },
    [Route.ETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
    },
    [Route.wstETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
    },
  },
  polygon: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 300000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 250000,
    },
    [Route.TBTC]: {
      sendToken: 150000,
      claim: 300000,
    },
    [Route.ETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 600000,
    },
    [Route.wstETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 600000,
    },
  },
  bsc: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 200000,
      claim: 300000,
    },
    [Route.Relay]: {
      sendNative: 200000,
      sendToken: 300000,
    },
    [Route.ETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
    },
    [Route.wstETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
    },
  },
  avalanche: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 300000,
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
      sendNative: 100000,
      sendToken: 150000,
      claim: 300000,
    },
    [Route.Relay]: {
      sendNative: 250000,
      sendToken: 300000,
    },
  },
  celo: {
    [Route.Bridge]: {
      sendNative: 150000,
      sendToken: 150000,
      claim: 300000,
    },
    [Route.Relay]: {
      sendNative: 300000,
      sendToken: 300000,
    },
  },
  moonbeam: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 150000,
      claim: 300000,
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
      sendToken: 150000,
      claim: 300000,
    },
  },
  sui: {
    [Route.Bridge]: {
      sendNative: 5000000,
      sendToken: 5000000,
      claim: 200000000,
    },
    [Route.Relay]: {
      sendNative: 5000000,
      sendToken: 5000000,
    },
  },
  aptos: {
    [Route.Bridge]: {
      sendNative: 40,
      sendToken: 40,
      claim: 1250,
    },
  },
  sei: {
    [Route.Bridge]: {
      sendNative: 1000000,
      sendToken: 1000000,
      claim: 1000000,
    },
  },
  base: {
    [Route.Bridge]: {
      sendNative: 1000000,
      sendToken: 1000000,
      claim: 1000000,
    },
    [Route.Relay]: {
      sendNative: 300000,
      sendToken: 500000,
    },
    [Route.CCTPManual]: {
      sendToken: 300000,
      claim: 500000,
    },
    [Route.CCTPRelay]: {
      sendToken: 300000,
    },
    [Route.TBTC]: {
      sendToken: 150000,
      claim: 300000,
    },
    [Route.ETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
    },
    [Route.wstETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
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
  arbitrum: {
    [Route.Bridge]: {
      sendNative: 1000000,
      sendToken: 1000000,
      claim: 4000000,
    },
    [Route.CCTPManual]: {
      sendToken: 800000,
      claim: 4000000,
    },
    [Route.CCTPRelay]: {
      sendToken: 1500000,
    },
    [Route.TBTC]: {
      sendToken: 1000000,
      claim: 4000000,
    },
    [Route.ETHBridge]: {
      sendNative: 3000000,
      sendToken: 3000000,
      claim: 4500000,
    },
    [Route.wstETHBridge]: {
      sendNative: 3000000,
      sendToken: 300000,
      claim: 4500000,
    },
  },
  optimism: {
    [Route.Bridge]: {
      sendNative: 100000,
      sendToken: 100000,
      claim: 300000,
    },
    [Route.CCTPManual]: {
      sendToken: 100000,
      claim: 300000,
    },
    [Route.CCTPRelay]: {
      sendToken: 150000,
    },
    [Route.TBTC]: {
      sendToken: 100000,
      claim: 300000,
    },
    [Route.ETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
    },
    [Route.wstETHBridge]: {
      sendNative: 300000,
      sendToken: 300000,
      claim: 450000,
    },
  },
  klaytn: {
    [Route.Bridge]: {
      sendNative: 2000000,
      sendToken: 3000000,
      claim: 4000000,
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
};
