import { ethers } from 'ethers';
import { WormholeContext, ChainConfig, TokenConfig } from 'sdk';
import MAINNET_CONFIG, { MAINNET_TOKENS } from 'sdk/config/MAINNET';
import TESTNET_CONFIG, { TESTNET_TOKENS } from 'sdk/config/TESTNET';

const env = 'TESTNET'; // TODO: get from env
export const CONFIG = env === 'TESTNET' ? TESTNET_CONFIG : MAINNET_CONFIG;
export const CHAINS = CONFIG.chains;
export const CHAINS_ARR = Object.values(CHAINS) as ChainConfig[];
export const TOKENS = env === 'TESTNET' ? TESTNET_TOKENS : MAINNET_TOKENS;
export const TOKENS_ARR = Object.values(TOKENS) as TokenConfig[];

const context = new WormholeContext(env);

export const registerSigner = (signer: any) => {
  console.log('registering signer', signer);
  context.registerSigner('goerli', signer);
};

export const sendTransfer = async () => {
  console.log('preparing send');
  console.log('context:', context);
  const parsed = ethers.utils.parseUnits('0.01', 18);
  const receipt = await context.send(
    'native',
    parsed.toString(),
    'goerli',
    '0x7D414a4223A5145d60Ce4c587d23f2b1a4Db50e4',
    'fuji',
    '0x7D414a4223A5145d60Ce4c587d23f2b1a4Db50e4',
    undefined,
    // { gasLimit: 250000 },
  );
  return receipt;
};
