import { ethers_contracts, Network as Environment } from '@certusone/wormhole-sdk';
import { BigNumber, constants, utils, ContractReceipt } from 'ethers';
import {
  WormholeContext,
  TokenId,
  ChainId,
  ChainName,
} from '@wormhole-foundation/wormhole-connect-sdk';

import { PaymentOption } from '../store/transfer';
import { getTokenDecimals } from '../utils';

const { REACT_APP_ENV } = process.env;

export const context = new WormholeContext(REACT_APP_ENV! as Environment);

export const registerSigner = (chain: ChainName | ChainId, signer: any) => {
  console.log(`registering signer for ${chain}:`, signer);
  context.registerSigner(chain, signer);
};

export const getForeignAsset = async (
  tokenId: TokenId,
  chain: ChainName | ChainId,
): Promise<string> => {
  const chainName = context.resolveDomainName(chain);
  const ethContext: any = context.getContext(tokenId.chain);
  if (tokenId.chain === chainName) return tokenId.address;
  return await ethContext.getForeignAsset(tokenId, chain);
};

export const getBalance = async (
  walletAddr: string,
  tokenId: TokenId,
  chain: ChainName | ChainId,
): Promise<BigNumber> => {
  const address = await getForeignAsset(tokenId, chain);
  if (address === constants.AddressZero) return BigNumber.from(0);
  const provider = context.mustGetProvider(chain);
  const token = ethers_contracts.TokenImplementation__factory.connect(
    address,
    provider,
  );
  const balance = await token.balanceOf(walletAddr);
  return balance;
};

export const getNativeBalance = async (
  walletAddr: string,
  chain: ChainName | ChainId,
): Promise<BigNumber> => {
  const provider = context.mustGetProvider(chain);
  return await provider.getBalance(walletAddr);
}

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
    const parsedNativeAmt = toNativeToken ? utils.parseUnits(toNativeToken, decimals).toString() : '0';
    const receipt = await context.sendWithRelay(
      token,
      parsedAmt.toString(),
      fromNetwork,
      fromAddress,
      toNetwork,
      toAddress,
      parsedNativeAmt,
    );
    return receipt;
  }
};

export const calculateMaxSwapAmount = async (destChain: ChainName | ChainId, token: TokenId) => {
  const EthContext: any = context.getContext(destChain);
  return await EthContext.calculateMaxSwapAmount(destChain, token);
}

export const claimTransfer = async (
  destChain: ChainName | ChainId,
  vaa: Uint8Array,
): Promise<ContractReceipt> => {
  const EthContext: any = context.getContext(destChain);
  return await EthContext.redeem(destChain, vaa, { gasLimit: 250000 });
};
