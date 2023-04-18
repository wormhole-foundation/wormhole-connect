export declare const MAINNET_CHAINS: {
    readonly solana: 1;
    readonly ethereum: 2;
    readonly bsc: 4;
    readonly polygon: 5;
    readonly avalanche: 6;
    readonly fantom: 10;
    readonly celo: 14;
    readonly moonbeam: 16;
};
export type MainnetChainName = keyof typeof MAINNET_CHAINS;
export type MainnetChainId = (typeof MAINNET_CHAINS)[MainnetChainName];
export declare const TESTNET_CHAINS: {
    readonly solana: 1;
    readonly goerli: 2;
    readonly bsc: 4;
    readonly mumbai: 5;
    readonly fuji: 6;
    readonly fantom: 10;
    readonly alfajores: 14;
    readonly moonbasealpha: 16;
};
export type TestnetChainName = keyof typeof TESTNET_CHAINS;
export type TestnetChainId = (typeof TESTNET_CHAINS)[TestnetChainName];
export type ChainName = MainnetChainName | TestnetChainName;
export type ChainId = MainnetChainId | TestnetChainId;
export type Rpcs = {
    [chain in ChainName]?: string;
};
export interface WormholeConnectConfig {
    env?: 'mainnet' | 'testnet';
    rpcs?: Rpcs;
    networks?: ChainName[];
    tokens?: string[];
    mode?: 'dark' | 'light';
    customTheme?: any;
}
