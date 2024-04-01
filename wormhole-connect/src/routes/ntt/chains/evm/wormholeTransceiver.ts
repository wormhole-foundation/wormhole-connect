import { ChainId, ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { WormholeTransceiver__factory as WormholeTransceiver__factory_0_1_0 } from './abis/0.1.0/WormholeTransceiver__factory';
import { WormholeTransceiver as WormholeTransceiver_0_1_0 } from './abis/0.1.0/WormholeTransceiver';
import { TransferWallet, signAndSendTransaction } from 'utils/wallet';
import config from 'config';
import { toChainId, toChainName } from 'utils/sdk';
import { ethers } from 'ethers';
import { UnsupportedContractAbiVersion } from 'routes/ntt/errors';

const ABI_VERSION_0_1_0 = '0.1.0';

export class WormholeTransceiver {
  static readonly abiVersionCache = new Map<string, string>();

  constructor(readonly chain: ChainName | ChainId, readonly address: string) {}

  async isWormholeRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const { abi } = await this.getAbi();
    return await abi.isWormholeRelayingEnabled(toChainId(destChain));
  }

  async isSpecialRelayingEnabled(
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const { abi } = await this.getAbi();
    return await abi.isSpecialRelayingEnabled(toChainId(destChain));
  }

  async receiveMessage(vaa: string, payer: string): Promise<string> {
    const { abi } = await this.getAbi();
    const tx = await abi.populateTransaction.receiveMessage(vaa);
    const signer = await config.wh.mustGetSigner(this.chain);
    const response = await signer.sendTransaction(tx);
    const receipt = await response.wait();
    const txId = await signAndSendTransaction(
      toChainName(this.chain),
      receipt,
      TransferWallet.RECEIVING,
    );
    return txId;
  }

  async getAbi(): Promise<{
    abi: WormholeTransceiver_0_1_0;
    version: string;
  }> {
    const provider = config.wh.mustGetProvider(this.chain);
    const abiVersionKey = `${this.address}-${toChainName(this.chain)}`;
    let abiVersion = WormholeTransceiver.abiVersionCache.get(abiVersionKey);
    if (!abiVersion) {
      const contract = new ethers.Contract(
        this.address,
        [
          'function WORMHOLE_TRANSCEIVER_VERSION() public view returns (string)',
        ],
        provider,
      );
      try {
        abiVersion = await contract.WORMHOLE_TRANSCEIVER_VERSION();
      } catch (e) {
        console.error(
          `Failed to get WORMHOLE_TRANSCEIVER_VERSION from contract ${
            this.address
          } on chain ${toChainName(this.chain)}`,
        );
        throw e;
      }
      if (!abiVersion) {
        throw new Error('WORMHOLE_TRANSCEIVER_VERSION not found');
      }
      WormholeTransceiver.abiVersionCache.set(abiVersionKey, abiVersion);
    }
    if (abiVersion === ABI_VERSION_0_1_0) {
      return {
        abi: WormholeTransceiver__factory_0_1_0.connect(this.address, provider),
        version: abiVersion,
      };
    }
    console.error(
      `Unsupported WormholeTransceiver version ${abiVersion} for chain ${toChainName(
        this.chain,
      )}`,
    );
    throw new UnsupportedContractAbiVersion();
  }
}
