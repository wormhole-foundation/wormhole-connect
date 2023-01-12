import { Network as Environment, Contracts } from '@certusone/wormhole-sdk';
import { WormholeConfig, Context, ChainConfig } from '../types';

// https://book.wormhole.com/reference/contracts.html
export const MAINNET_CHAINS = {
  solana: 1,
  ethereum: 2,
  terra: 3,
  bsc: 4,
  polygon: 5,
  avalanche: 6,
  oasis: 7,
  algorand: 8,
  aurora: 9,
  fantom: 10,
  karura: 11,
  acala: 12,
  klaytn: 13,
  celo: 14,
  near: 15,
  moonbeam: 16,
  neon: 17,
  terra2: 18,
  injective: 19,
  osmosis: 20,
  sui: 21,
  aptos: 22,
  arbitrum: 23,
  optimism: 24,
  gnosis: 25,
  pythnet: 26,
  xpla: 28,
  btc: 29,
  wormchain: 3104,
} as const;

export type MainnetChainName = keyof typeof MAINNET_CHAINS;
export type MainnetChainId = (typeof MAINNET_CHAINS)[MainnetChainName];

export type ChainContracts = {
  [chain in MainnetChainName]: Contracts;
};

const MAINNET: { [chain in MainnetChainName]: ChainConfig } = {
  solana: {
    id: 1,
    context: Context.SOLANA,
    contracts: {
      core: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth',
      token_bridge: 'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb',
      nft_bridge: 'WnFt12ZrnzZrFZkt2xsNsaNWoQribnuQ5B5FrDbwDhD',
    },
  },
  ethereum: {
    id: 2,
    context: Context.ETH,
    contracts: {
      core: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
      token_bridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
      nft_bridge: '0x6FFd7EdE62328b3Af38FCD61461Bbfc52F5651fE',
    },
  },
  terra: {
    id: 3,
    context: Context.TERRA,
    contracts: {
      core: 'terra1dq03ugtd40zu9hcgdzrsq6z2z4hwhc9tqk2uy5',
      token_bridge: 'terra10nmmwe8r3g99a9newtqa7a75xfgs2e8z87r2sf',
      nft_bridge: undefined,
    },
  },
  bsc: {
    id: 4,
    context: Context.ETH,
    contracts: {
      core: '0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B',
      token_bridge: '0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7',
      nft_bridge: '0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE',
    },
  },
  polygon: {
    id: 5,
    context: Context.ETH,
    contracts: {
      core: '0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7',
      token_bridge: '0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE',
      nft_bridge: '0x90BBd86a6Fe93D3bc3ed6335935447E75fAb7fCf',
    },
  },
  avalanche: {
    id: 6,
    context: Context.ETH,
    contracts: {
      core: '0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c',
      token_bridge: '0x0e082F06FF657D94310cB8cE8B0D9a04541d8052',
      nft_bridge: '0xf7B6737Ca9c4e08aE573F75A97B73D7a813f5De5',
    },
  },
  oasis: {
    id: 7,
    context: Context.ETH,
    contracts: {
      core: '0xfE8cD454b4A1CA468B57D79c0cc77Ef5B6f64585',
      token_bridge: '0x5848C791e09901b40A9Ef749f2a6735b418d7564',
      nft_bridge: '0x04952D522Ff217f40B5Ef3cbF659EcA7b952a6c1',
    },
  },
  algorand: {
    id: 8,
    context: Context.ALGORAND,
    contracts: {
      core: '842125965',
      token_bridge: '842126029',
      nft_bridge: undefined,
    },
  },
  aurora: {
    id: 9,
    context: Context.ETH,
    contracts: {
      core: '0xa321448d90d4e5b0A732867c18eA198e75CAC48E',
      token_bridge: '0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F',
      nft_bridge: '0x6dcC0484472523ed9Cdc017F711Bcbf909789284',
    },
  },
  fantom: {
    id: 10,
    context: Context.ETH,
    contracts: {
      core: '0x126783A6Cb203a3E35344528B26ca3a0489a1485',
      token_bridge: '0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2',
      nft_bridge: '0xA9c7119aBDa80d4a4E0C06C8F4d8cF5893234535',
    },
  },
  karura: {
    id: 11,
    context: Context.ETH,
    contracts: {
      core: '0xa321448d90d4e5b0A732867c18eA198e75CAC48E',
      token_bridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624',
      nft_bridge: '0xb91e3638F82A1fACb28690b37e3aAE45d2c33808',
    },
  },
  acala: {
    id: 12,
    context: Context.ETH,
    contracts: {
      core: '0xa321448d90d4e5b0A732867c18eA198e75CAC48E',
      token_bridge: '0xae9d7fe007b3327AA64A32824Aaac52C42a6E624',
      nft_bridge: '0xb91e3638F82A1fACb28690b37e3aAE45d2c33808',
    },
  },
  klaytn: {
    id: 13,
    context: Context.ETH,
    contracts: {
      core: '0x0C21603c4f3a6387e241c0091A7EA39E43E90bb7',
      token_bridge: '0x5b08ac39EAED75c0439FC750d9FE7E1F9dD0193F',
      nft_bridge: '0x3c3c561757BAa0b78c5C025CdEAa4ee24C1dFfEf',
    },
  },
  celo: {
    id: 14,
    context: Context.ETH,
    contracts: {
      core: '0xa321448d90d4e5b0A732867c18eA198e75CAC48E',
      token_bridge: '0x796Dff6D74F3E27060B71255Fe517BFb23C93eed',
      nft_bridge: '0xA6A377d75ca5c9052c9a77ED1e865Cc25Bd97bf3',
    },
  },
  near: {
    id: 15,
    context: Context.NEAR,
    contracts: {
      core: 'contract.wormhole_crypto.near',
      token_bridge: 'contract.portalbridge.near',
      nft_bridge: undefined,
    },
  },
  injective: {
    id: 19,
    context: Context.INJECTIVE,
    contracts: {
      core: 'inj17p9rzwnnfxcjp32un9ug7yhhzgtkhvl9l2q74d',
      token_bridge: 'inj1ghd753shjuwexxywmgs4xz7x2q732vcnxxynfn',
      nft_bridge: undefined,
    },
  },
  osmosis: {
    id: 20,
    context: Context.ETH,
    contracts: {
      core: undefined,
      token_bridge: undefined,
      nft_bridge: undefined,
    },
  },
  aptos: {
    id: 22,
    context: Context.APTOS,
    contracts: {
      core: '0x5bc11445584a763c1fa7ed39081f1b920954da14e04b32440cba863d03e19625',
      token_bridge:
        '0x576410486a2da45eee6c949c995670112ddf2fbeedab20350d506328eefc9d4f',
      nft_bridge: undefined,
    },
  },
  sui: {
    id: 21,
    context: Context.OTHER,
    contracts: {
      core: undefined,
      token_bridge: undefined,
      nft_bridge: undefined,
    },
  },
  moonbeam: {
    id: 16,
    context: Context.ETH,
    contracts: {
      core: '0xC8e2b0cD52Cf01b0Ce87d389Daa3d414d4cE29f3',
      token_bridge: '0xb1731c586ca89a23809861c6103f0b96b3f57d92',
      nft_bridge: '0x453cfbe096c0f8d763e8c5f24b441097d577bde2',
    },
  },
  neon: {
    id: 17,
    context: Context.ETH,
    contracts: {
      core: undefined,
      token_bridge: undefined,
      nft_bridge: undefined,
    },
  },
  terra2: {
    id: 18,
    context: Context.TERRA,
    contracts: {
      core: 'terra12mrnzvhx3rpej6843uge2yyfppfyd3u9c3uq223q8sl48huz9juqffcnhp',
      token_bridge:
        'terra153366q50k7t8nn7gec00hg66crnhkdggpgdtaxltaq6xrutkkz3s992fw9',
      nft_bridge: undefined,
    },
  },
  arbitrum: {
    id: 23,
    context: Context.ETH,
    contracts: {
      core: '0xa5f208e072434bC67592E4C49C1B991BA79BCA46',
      token_bridge: '0x0b2402144Bb366A632D14B83F244D2e0e21bD39c',
      nft_bridge: '0x3dD14D553cFD986EAC8e3bddF629d82073e188c8',
    },
  },
  optimism: {
    id: 24,
    context: Context.ETH,
    contracts: {
      core: '0xEe91C335eab126dF5fDB3797EA9d6aD93aeC9722',
      token_bridge: '0x1D68124e65faFC907325e3EDbF8c4d84499DAa8b',
      nft_bridge: '0xfE8cD454b4A1CA468B57D79c0cc77Ef5B6f64585',
    },
  },
  gnosis: {
    id: 25,
    context: Context.ETH,
    contracts: {
      core: '0xa321448d90d4e5b0A732867c18eA198e75CAC48E',
      token_bridge: undefined,
      nft_bridge: undefined,
    },
  },
  pythnet: {
    id: 26,
    context: Context.SOLANA,
    contracts: {
      core: 'H3fxXJ86ADW2PNuDDmZJg6mzTtPxkYCpNuQUTgmJ7AjU',
      token_bridge: undefined,
      nft_bridge: undefined,
    },
  },
  xpla: {
    id: 28,
    context: Context.XPLA,
    contracts: {
      core: 'xpla1jn8qmdda5m6f6fqu9qv46rt7ajhklg40ukpqchkejcvy8x7w26cqxamv3w',
      token_bridge:
        'xpla137w0wfch2dfmz7jl2ap8pcmswasj8kg06ay4dtjzw7tzkn77ufxqfw7acv',
      nft_bridge: undefined,
    },
  },
  btc: {
    id: 29,
    context: Context.OTHER,
    contracts: {
      core: undefined,
      token_bridge: undefined,
      nft_bridge: undefined,
    },
  },
  wormchain: {
    id: 3104,
    context: Context.OTHER,
    contracts: {
      core: undefined,
      token_bridge: undefined,
      nft_bridge: undefined,
    },
  },
};

const env: Environment = 'MAINNET';
const MAINNET_CONFIG: WormholeConfig = {
  env,
  rpcs: {
    solana: 'https://api.devnet.solana.com',
    ethereum: 'https://main-light.eth.linkpool.io',
  },
  chains: MAINNET,
};

export default MAINNET_CONFIG;
