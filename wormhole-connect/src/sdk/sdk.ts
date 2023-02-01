import { Network as Environment } from '@certusone/wormhole-sdk';
import { utils } from 'ethers';
import {
  WormholeContext,
  TokenId,
  ChainId,
  ChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';

import { PaymentOption } from '../store/transfer';
import { getTokenDecimals } from '../utils';
import { getBalance as getBalanceUtil } from 'utils/balance';

const { REACT_APP_ENV } = process.env;

export const context = new WormholeContext(REACT_APP_ENV! as Environment);

export const registerSigner = (signer: any) => {
  console.log('registering signer', signer);
  context.registerSigner('goerli', signer);
};

export const getForeignAsset = async (
  tokenId: TokenId,
  chain: ChainName | ChainId,
) => {
  const chainName = context.resolveDomainName(chain);
  if (tokenId.chain === chainName) return tokenId.address;
  const ethContext: any = context.getContext(tokenId.chain);
  return await ethContext.getForeignAsset(tokenId, chain);
};

export const getBalance = async (
  walletAddr: string,
  tokenId: TokenId,
  chain: ChainName | ChainId,
) => {
  const address = await getForeignAsset(tokenId, chain);
  const provider = context.mustGetProvider(tokenId.chain);
  return await getBalanceUtil(walletAddr, address, provider);
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
