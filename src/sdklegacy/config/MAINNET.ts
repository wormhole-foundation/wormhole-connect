import type { WormholeConfig } from '../types';

/**
 * default mainnet chain config
 */
const MAINNET_CONFIG: WormholeConfig = {
  env: 'Mainnet',
  rpcs: {
    Ethereum: 'https://ethereum-rpc.publicnode.com',
    Solana: 'https://solana-rpc.publicnode.com',
    Polygon: 'https://polygon-bor-rpc.publicnode.com',
    Bsc: 'https://bscrpc.com',
    Avalanche: 'https://avalanche-c-chain-rpc.publicnode.com',
    Fantom: 'https://rpcapi.fantom.network',
    Celo: 'https://celo-rpc.publicnode.com',
    Moonbeam: 'https://moonbeam-rpc.publicnode.com',
    Sui: 'https://rpc.mainnet.sui.io',
    Aptos: 'https://fullnode.mainnet.aptoslabs.com/v1',
    Arbitrum: 'https://arbitrum-one-rpc.publicnode.com',
    Optimism: 'https://optimism-rpc.publicnode.com',
    Base: 'https://base.publicnode.com',
    Sei: '', // TODO: fill in
    Klaytn: 'https://public-en.node.kaia.io',
    Scroll: 'https://scroll-rpc.publicnode.com',
    Xlayer: 'https://rpc.xlayer.tech',
    Mantle: 'https://rpc.mantle.xyz',
    Worldchain: 'https://worldchain-mainnet.g.alchemy.com/public',
    Unichain: 'https://mainnet.unichain.org',
    Berachain: 'https://rpc.berachain.com',
    Linea: 'https://linea-rpc.publicnode.com',
    Sonic: 'https://sonic-rpc.publicnode.com',
  },
};

export default MAINNET_CONFIG;
