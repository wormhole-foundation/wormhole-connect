import { Network as Environment } from '@certusone/wormhole-sdk';
import { utils } from 'ethers';
import { WormholeContext, ChainConfig, TokenId, ChainId, ChainName } from 'sdk';
import { CONFIG as CONF } from 'sdk';
import { MAINNET_NETWORKS, MAINNET_TOKENS } from '../config/mainnet';
import { TESTNET_NETWORKS, TESTNET_TOKENS } from '../config/testnet';

import { PaymentOption } from 'store/transfer';
import { TokenConfig } from 'config/types';
import { getTokenDecimals } from 'utils';

const { REACT_APP_ENV } = process.env;
export const isProduction = REACT_APP_ENV === 'MAINNET';
export const CONFIG = isProduction ? CONF.MAINNET : CONF.TESTNET;
export const CHAINS = isProduction ? MAINNET_NETWORKS : TESTNET_NETWORKS;
export const CHAINS_ARR = Object.values(CHAINS) as ChainConfig[];
export const TOKENS = isProduction ? MAINNET_TOKENS : TESTNET_TOKENS;
export const TOKENS_ARR = Object.values(TOKENS) as TokenConfig[];
export const REQUIRED_CONFIRMATIONS = isProduction ? 13 : 1;

export const context = new WormholeContext(REACT_APP_ENV! as Environment);

export const registerSigner = (signer: any) => {
  console.log('registering signer', signer);
  context.registerSigner('goerli', signer);
};

// export const getTxDetails(chain: ChainName | ChainId, txHash: string) {
//   // TODO: get tx details by transaction receipt
//   const provider = context.mustGetProvider(nameOrDomain);
//   const receipt = await provider.getTransactionReceipt(transactionHash);
//   if (!receipt) {
//     throw new Error(`No receipt for ${transactionHash} on ${nameOrDomain}`);
//   }
//   const messages: any[] = [];
//     const bridge = core.Bridge__factory.createInterface();

//     for (const log of receipt.logs) {
//       try {
//         const parsed = bridge.parseLog(log);
//         if (parsed.name === '') {
//           console.log(parsed.args)
//           messages.push(parsed.args);
//         }
//       } catch (e: unknown) {
//         throw e;
//       }
//     }
//     return messages;
// }

// export const getRelayerFee = async (
//   sourceChain: ChainName | ChainId,
//   destChain: ChainName | ChainId,
//   token: string,
// ) => {
//   const destChainId = context.resolveDomain(destChain);
//   const tokenConfig = TOKENS[token];
//   if (!tokenConfig) throw new Error('could not get token config');
//   const relayer = context.mustGetTBRelayer(sourceChain);
//   return await relayer.calculateRelayerFee(
//     destChainId,
//     tokenConfig.tokenId.address,
//     tokenConfig.decimals,
//   )
// }

export const sendTransfer = async (
  token: TokenId | 'native',
  amount: string,
  fromNetwork: ChainName | ChainId,
  fromAddress: string,
  toNetwork: ChainName | ChainId,
  toAddress: string,
  paymentOption: PaymentOption,
  toNativeToken?: string,
) => {
  console.log('preparing send');
  const decimals = getTokenDecimals(token);
  const parsedAmt = utils.parseUnits(amount, decimals);
  // const parsedNativeAmt = utils.parseUnits(toNativeToken || '0', decimals);
  const parsedNativeAmt = utils.parseUnits('0.001', decimals);
  if (paymentOption === PaymentOption.MANUAL) {
    console.log('send with manual');
    const receipt = await context.send(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      undefined,
    );
    return receipt;
  } else {
    console.log('send with relay');
    const receipt = await context.sendWithRelay(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      parsedNativeAmt.toString(),
    );
    return receipt;
  }
};

export const claimTransfer = async (
  destChain: ChainName | ChainId,
  vaa: Uint8Array,
) => {
  const EthContext: any = context.getContext(destChain);
  return EthContext.redeem(destChain, vaa);
};
