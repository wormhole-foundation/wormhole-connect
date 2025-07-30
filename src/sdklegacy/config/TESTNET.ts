import type { WormholeConfig } from '../types';

/**
 * default testnet chain config
 */
const TESTNET_CONFIG: WormholeConfig = {
  env: 'Testnet',
  rpcs: {
    Bsc: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    Avalanche: 'https://api.avax-test.network/ext/bc/C/rpc',
    Fantom: 'https://rpc.testnet.fantom.network',
    Celo: 'https://alfajores-forno.celo-testnet.org',
    Solana: 'https://api.devnet.solana.com',
    Fogo: 'https://testnet.fogo.io',
    Moonbeam: 'https://rpc.api.moonbase.moonbeam.network',
    Sui: 'https://fullnode.testnet.sui.io',
    Aptos: 'https://fullnode.testnet.aptoslabs.com/v1',
    Sei: 'https://rpc.atlantic-2.seinetwork.io',
    Klaytn: 'https://public-en-kairos.node.kaia.io',
    Sepolia: 'https://ethereum-sepolia-rpc.publicnode.com',
    ArbitrumSepolia: 'https://sepolia-rollup.arbitrum.io/rpc',
    BaseSepolia: 'https://base-sepolia-rpc.publicnode.com',
    OptimismSepolia: 'https://sepolia.optimism.io',
    Scroll: 'https://scroll-sepolia-rpc.publicnode.com',
    Xlayer: 'https://testrpc.xlayer.tech',
    Mantle: 'https://rpc.sepolia.mantle.xyz',
    Worldchain: 'https://worldchain-sepolia.g.alchemy.com/public',
    Unichain: 'https://sepolia.unichain.org',
    Mezo: 'https://rpc.test.mezo.org',
    Linea: 'https://linea-sepolia-rpc.publicnode.com',
    Sonic: 'https://sonic-blaze-rpc.publicnode.com',
  },
};

export default TESTNET_CONFIG;
