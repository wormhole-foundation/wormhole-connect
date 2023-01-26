import { Network as Environment } from '@certusone/wormhole-sdk';
import { ethers } from 'ethers';
import { WormholeContext, ChainConfig, TokenConfig } from 'sdk';
import MAINNET_CONFIG, { MAINNET_TOKENS } from 'sdk/config/MAINNET';
import TESTNET_CONFIG, { TESTNET_TOKENS } from 'sdk/config/TESTNET';

let env: Environment = 'MAINNET'; // TODO: get from env
export const CONFIG = env === 'MAINNET' ? MAINNET_CONFIG : TESTNET_CONFIG;
export const CHAINS = CONFIG.chains;
export const CHAINS_ARR = Object.values(CHAINS) as ChainConfig[];
export const TOKENS = env === 'MAINNET' ? MAINNET_TOKENS : TESTNET_TOKENS;
export const TOKENS_ARR = Object.values(TOKENS) as TokenConfig[];

export const context = new WormholeContext(env);

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
