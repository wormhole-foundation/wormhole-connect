import { providers, Signer } from 'ethers';
import {
  Bridge,
  Wormhole,
  NFTBridge,
} from '@certusone/wormhole-sdk/lib/cjs/ethers-contracts';
import { Network as Environment } from '@certusone/wormhole-sdk';
import { MultiProvider, Domain } from '@nomad-xyz/multi-provider';
import { publicrpc } from '@certusone/wormhole-sdk-proto-web';
import { NodeHttpTransport } from '@improbable-eng/grpc-web-node-http-transport';

import MAINNET_CONFIG, {
  MainnetChainName,
  MAINNET_CHAINS,
} from './config/MAINNET';
import TESTNET_CONFIG, {
  TestnetChainName,
  TESTNET_CHAINS,
} from './config/TESTNET';
import { WormholeConfig, ChainName, ChainId, Context } from './types';
import { WHContracts } from './contracts';
import { TokenId } from './types';
import { EthContext } from './envContexts/ethContext';
import { TerraContext } from './envContexts/terraContext';
import { InjectiveContext } from './envContexts/injectiveContext';
import { XplaContext } from './envContexts/xplaContext';
import { SolanaContext } from './envContexts/solanaContext';
import { NearContext } from './envContexts/nearContext';
import { AptosContext } from './envContexts/aptosContext';
import { AlgorandContext } from './envContexts/algorandContext';
import { TokenBridgeRelayer } from './abis/TokenBridgeRelayer';
const { GrpcWebImpl, PublicRPCServiceClientImpl } = publicrpc;

/**
 * The WormholeContext manages connections to Wormhole Core, Bridge and NFT Bridge contracts.
 * It inherits from the {@link MultiProvider}, and ensures that its contracts
 * always use the latest registered providers and signers.
 *
 * For convenience, we've pre-constructed contexts for mainnet, testnet and devnet
 * deployments. These can be imported directly from the wormhole sdk.
 *
 * @example
 * // Set up mainnet and then access contracts as below:
 * const context = new WormholeContext('MAINNET');
 * let bridge = context.mustGetBridge('ethereum');
 *
 * // interact easily with any chain!
 * // supports EVM, Solana, Terra, etc
 * const tokenId = {
 *   chain: 'ethereum',
 *   address: '0x123...',
 * }
 * const receipt = context.send(
 *   tokenId,
 *   '10', // amount
 *   'ethereum', // sending chain
 *   '0x789...', // sender address
 *   'moonbeam', // destination chain
 *   '0x789..., // recipient address on destination chain
 * )
 */
export class WormholeContext extends MultiProvider<Domain> {
  protected _contracts: Map<ChainName, WHContracts<this>>;
  readonly conf: WormholeConfig;

  constructor(env: Environment, conf?: WormholeConfig) {
    super();

    if (conf) {
      this.conf = conf;
    } else {
      this.conf = env === 'MAINNET' ? MAINNET_CONFIG : TESTNET_CONFIG;
    }

    this._contracts = new Map();

    for (const network of Object.keys(this.conf.rpcs)) {
      const n =
        env === 'MAINNET'
          ? (network as MainnetChainName)
          : (network as TestnetChainName);
      const chains = env === 'MAINNET' ? MAINNET_CHAINS : TESTNET_CHAINS;
      // register domain
      this.registerDomain({
        // @ts-ignore
        domain: chains[n],
        name: network,
      });
      // register RPC provider
      if (this.conf.rpcs[n]) {
        this.registerRpcProvider(network, this.conf.rpcs[n]!);
      }
      // set contracts
      const contracts = new WHContracts(env, this, n);
      this._contracts.set(n, contracts);
    }
  }

  get environment(): string {
    return this.conf.env;
  }

  /**
   * Register an ethers Provider for a specified domain.
   *
   * @param nameOrDomain A domain name or number.
   * @param provider An ethers Provider to be used by requests to that domain.
   */
  registerProvider(
    nameOrDomain: string | number,
    provider: providers.Provider,
  ): void {
    const domain = this.resolveDomain(nameOrDomain);
    super.registerProvider(domain, provider);
  }

  /**
   * Register an ethers Signer for a specified domain.
   *
   * @param nameOrDomain A domain name or number.
   * @param signer An ethers Signer to be used by requests to that domain.
   */
  registerSigner(nameOrDomain: string | number, signer: Signer): void {
    const domain = this.resolveDomain(nameOrDomain);
    super.registerSigner(domain, signer);
  }

  /**
   * Remove the registered ethers Signer from a domain. This function will
   * attempt to preserve any Provider that was previously connected to this
   * domain.
   *
   * @param nameOrDomain A domain name or number.
   */
  unregisterSigner(nameOrDomain: string | number): void {
    const domain = this.resolveDomain(nameOrDomain);
    super.unregisterSigner(domain);
  }

  /**
   * Clear all signers from all registered domains.
   */
  clearSigners(): void {
    super.clearSigners();
  }

  /**
   * Get the contracts for a given domain (or undefined)
   *
   * @param nameOrDomain A domain name or number.
   * @returns a {@link CoreContracts} object (or undefined)
   */
  getContracts(chain: ChainName | ChainId): WHContracts<this> | undefined {
    const domain = this.resolveDomainName(chain) as ChainName;
    return this._contracts.get(domain);
  }

  /**
   * Get the {@link CoreContracts} for a given domain (or throw an error)
   *
   * @param nameOrDomain A domain name or number.
   * @returns a {@link CoreContracts} object
   * @throws if no {@link CoreContracts} object exists on that domain.
   */
  mustGetContracts(chain: ChainName | ChainId): WHContracts<this> {
    const contracts = this.getContracts(chain);
    if (!contracts) {
      throw new Error(`Missing contracts for domain: ${chain}`);
    }
    return contracts;
  }

  getCore(chain: ChainName | ChainId): Wormhole | undefined {
    const contracts = this.mustGetContracts(chain);
    return contracts.core;
  }

  mustGetCore(chain: ChainName | ChainId): Wormhole {
    const coreContract = this.getCore(chain);
    if (!coreContract)
      throw new Error(`Wormhole core contract not found for ${chain}`);
    return coreContract;
  }

  getBridge(chain: ChainName | ChainId): Bridge | undefined {
    const contracts = this.mustGetContracts(chain);
    return contracts.bridge;
  }

  mustGetBridge(chain: ChainName | ChainId): Bridge {
    const bridgeContract = this.getBridge(chain);
    if (!bridgeContract)
      throw new Error(`Token bridge contract not found for ${chain}`);
    return bridgeContract;
  }

  getNftBridge(chain: ChainName | ChainId): NFTBridge | undefined {
    const contracts = this.mustGetContracts(chain);
    return contracts.nftBridge;
  }

  mustGetNftBridge(chain: ChainName | ChainId): NFTBridge {
    const nftBridgeContract = this.getNftBridge(chain);
    if (!nftBridgeContract)
      throw new Error(`NFT bridge contract not found for ${chain}`);
    return nftBridgeContract;
  }

  getTBRelayer(chain: ChainName | ChainId): TokenBridgeRelayer | undefined {
    const contracts = this.mustGetContracts(chain);
    return contracts.tokenBridgeRelayer;
  }

  mustGetTBRelayer(chain: ChainName | ChainId): TokenBridgeRelayer {
    const relayerContract = this.getTBRelayer(chain);
    if (!relayerContract)
      throw new Error(`Token Bridge Relayer contract not found for ${chain}`);
    return relayerContract;
  }

  getContext(
    chain: ChainName | ChainId,
  ):
    | EthContext<WormholeContext>
    | TerraContext<WormholeContext>
    | InjectiveContext<WormholeContext>
    | XplaContext<WormholeContext>
    | SolanaContext<WormholeContext>
    | NearContext<WormholeContext>
    | AptosContext<WormholeContext>
    | AlgorandContext<WormholeContext> {
    const chainName = this.resolveDomainName(chain) as ChainName;
    const { context } = this.conf.chains[chainName]!;
    switch (context) {
      case Context.ETH: {
        return new EthContext(this);
      }
      case Context.TERRA: {
        return new TerraContext(this);
      }
      case Context.INJECTIVE: {
        return new InjectiveContext(this);
      }
      case Context.XPLA: {
        return new XplaContext(this);
      }
      case Context.SOLANA: {
        return new SolanaContext(this);
      }
      case Context.ALGORAND: {
        return new AlgorandContext(this);
      }
      case Context.NEAR: {
        return new NearContext(this);
      }
      case Context.APTOS: {
        return new AptosContext(this);
      }
      default: {
        throw new Error('Not able to retrieve context');
      }
    }
  }

  /**
   * Sends transaction to the bridge
   *
   * @param tokenId The tokenId (chain and address) of the token being sent. Pass in 'native' to send native token
   * @param Amount The amount to approve. If absent, will approve the maximum amount
   * @throws If unable to get the signer or contracts
   */
  // TODO: implement extra arguments for other networks
  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    relayerFee?: string,
    payload?: any,
  ) {
    const context = this.getContext(sendingChain);
    if (payload) {
      context.sendWithPayload(
        token,
        amount,
        sendingChain,
        senderAddress,
        recipientChain,
        recipientAddress,
        payload,
      );
    }
    context.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      relayerFee,
    );
  }

  parseSequenceFromLog(receipt: any, chain: ChainName | ChainId): string {
    const context = this.getContext(chain);
    return context.parseSequenceFromLog(receipt, chain);
  }

  parseSequencesFromLog(receipt: any, chain: ChainName | ChainId): string[] {
    const context = this.getContext(chain);
    return context.parseSequencesFromLog(receipt, chain);
  }

  getEmitterAddress(address: string, chain: ChainName | ChainId): string {
    const context = this.getContext(chain);
    return context.getEmitterAddress(address);
  }

  async getSignedVaaWithReceipt(
    chain: ChainName | ChainId,
    receipt: any,
    extraGrpcOpts = {},
  ) {
    const chainName = this.resolveDomainName(chain) as ChainName;
    const rpcUrl = this.conf.rpcs[chainName];
    if (!rpcUrl) throw new Error(`Must provide rpc for ${chainName}`);

    const rpc = new GrpcWebImpl(rpcUrl, extraGrpcOpts);
    const api = new PublicRPCServiceClientImpl(rpc);
    const emitterAddress = this.mustGetBridge(chain).address;
    const sequence = this.parseSequenceFromLog(receipt, chain);

    return await api.GetSignedVAA({
      messageId: {
        emitterChain: this.resolveDomain(chain),
        emitterAddress,
        sequence,
      },
    });
  }

  async getSignedVaaWithSequence(
    chain: ChainName | ChainId,
    sequence: string,
    extraGrpcOpts = {},
  ) {
    const chainName = this.resolveDomainName(chain) as ChainName;
    const rpcUrl = this.conf.rpcs[chainName];
    if (!rpcUrl) throw new Error(`Must provide rpc for ${chainName}`);

    const rpc = new GrpcWebImpl(rpcUrl, extraGrpcOpts);
    const api = new PublicRPCServiceClientImpl(rpc);
    const emitterAddress = this.mustGetBridge(chain).address;

    return await api.GetSignedVAA({
      messageId: {
        emitterChain: this.resolveDomain(chain),
        emitterAddress,
        sequence,
      },
    });
  }

  async getSignedVAAWithRetry(
    emitterChain: ChainId | ChainName,
    sequence: string,
    extraGrpcOpts = {},
    retryTimeout = 1000,
    retryAttempts?: number,
  ) {
    let result;
    let attempts = 0;
    while (!result) {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, retryTimeout));
      try {
        result = await this.getSignedVaaWithSequence(
          emitterChain,
          sequence,
          extraGrpcOpts,
        );
      } catch (e) {
        if (retryAttempts !== undefined && attempts > retryAttempts) {
          throw e;
        }
      }
    }
    return result;
  }

  async getSignedVAABySequence(
    chain: ChainName | ChainId,
    sequence: string,
  ): Promise<Uint8Array> {
    //Note, if handed a sequence which doesn't exist or was skipped for consensus this will retry until the timeout.
    const { vaaBytes } = await this.getSignedVAAWithRetry(
      chain,
      sequence,
      {
        transport: NodeHttpTransport(), //This should only be needed when running in node.
      },
      1000, //retryTimeout
      1000, //Maximum retry attempts
    );

    return vaaBytes;
  }

  /**
   * Fetch a config from the Nomad config static site.
   *
   * @param environment the environment name to attempt to fetch
   * @returns A NomadConfig
   * @throws If the site is down, the config is not on the site, or the config
   *         is not of a valid format
   */
  static async getConfig(env: Environment): Promise<WormholeConfig> {
    return env === 'MAINNET' ? MAINNET_CONFIG : TESTNET_CONFIG;
  }
}
