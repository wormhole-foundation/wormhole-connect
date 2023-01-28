import { MAINNET } from 'sdk';
import { NetworksConfig, TokenConfig } from './types';

import AcalaIcon from '../icons/tokens/acala.svg';
import AlgoIcon from '../icons/tokens/algorand.svg';
import AptosIcon from '../icons/tokens/aptos.svg';
import ArbitrumIcon from '../icons/tokens/arbitrum.svg';
import AuroraIcon from '../icons/tokens/aurora.svg';
import AvaxIcon from '../icons/tokens/avax.svg';
import BscIcon from '../icons/tokens/bsc.svg';
import CeloIcon from '../icons/tokens/celo.svg';
import EthIcon from '../icons/tokens/eth.svg';
import FantomIcon from '../icons/tokens/fantom.svg';
import InjectiveIcon from '../icons/tokens/injective.svg';
import KaruraIcon from '../icons/tokens/karura.svg';
import KlaytnIcon from '../icons/tokens/klaytn.svg';
import MoonbeamIcon from '../icons/tokens/moonbeam.svg';
import NearIcon from '../icons/tokens/near.svg';
import NeonIcon from '../icons/tokens/neon.svg';
import OasisIcon from '../icons/tokens/oasis-network-rose-logo.svg';
import OsmosisIcon from '../icons/tokens/osmosis.svg';
import PolygonIcon from '../icons/tokens/polygon.svg';
import SolanaIcon from '../icons/tokens/solana.svg';
import SuiIcon from '../icons/tokens/sui.png';
import TerraIcon from '../icons/tokens/terra.svg';
import Terra2Icon from '../icons/tokens/terra2.svg';
import XplaIcon from '../icons/tokens/xpla.svg';

import BnbIcon from '../icons/tokens/bnb.svg';

export const MAINNET_NETWORKS: NetworksConfig = {
  solana: {
    ...MAINNET.solana,
    icon: SolanaIcon,
  },
  ethereum: {
    ...MAINNET.ethereum,
    icon: EthIcon,
  },
  terra: {
    ...MAINNET.terra,
    icon: TerraIcon,
  },
  bsc: {
    ...MAINNET.bsc,
    icon: BscIcon,
  },
  polygon: {
    ...MAINNET.polygon,
    icon: PolygonIcon,
  },
  avalanche: {
    ...MAINNET.avalanche,
    icon: AvaxIcon,
  },
  oasis: {
    ...MAINNET.oasis,
    icon: OasisIcon,
  },
  algorand: {
    ...MAINNET.algorand,
    icon: AlgoIcon,
  },
  aurora: {
    ...MAINNET.aurora,
    icon: AuroraIcon,
  },
  fantom: {
    ...MAINNET.fantom,
    icon: FantomIcon,
  },
  karura: {
    ...MAINNET.karura,
    icon: KaruraIcon,
  },
  acala: {
    ...MAINNET.acala,
    icon: AcalaIcon,
  },
  klaytn: {
    ...MAINNET.klaytn,
    icon: KlaytnIcon,
  },
  celo: {
    ...MAINNET.celo,
    icon: CeloIcon,
  },
  near: {
    ...MAINNET.near,
    icon: NearIcon,
  },
  injective: {
    ...MAINNET.injective,
    icon: InjectiveIcon,
  },
  osmosis: {
    ...MAINNET.osmosis,
    icon: OsmosisIcon,
  },
  aptos: {
    ...MAINNET.aptos,
    icon: AptosIcon,
  },
  sui: {
    ...MAINNET.sui,
    icon: SuiIcon,
  },
  moonbeam: {
    ...MAINNET.moonbeam,
    icon: MoonbeamIcon,
  },
  neon: {
    ...MAINNET.neon,
    icon: NeonIcon,
  },
  terra2: {
    ...MAINNET.terra2,
    icon: Terra2Icon,
  },
  arbitrum: {
    ...MAINNET.arbitrum,
    icon: ArbitrumIcon,
  },
  optimism: {
    ...MAINNET.optimism,
    icon: '',
  },
  gnosis: {
    ...MAINNET.gnosis,
  },
  pythnet: {
    ...MAINNET.pythnet,
  },
  xpla: {
    ...MAINNET.xpla,
    icon: XplaIcon,
  },
  btc: {
    ...MAINNET.btc,
  },
  wormchain: {
    ...MAINNET.wormchain,
  },
};

export const MAINNET_TOKENS: { [key: string]: TokenConfig } = {
  MATIC: {
    symbol: 'MATIC',
    icon: PolygonIcon,
    address: undefined,
    coinGeckoId: 'polygon',
    color: '#8247E5',
    decimals: 18,
  },
  WMATIC: {
    symbol: 'WMATIC',
    icon: PolygonIcon,
    address: '0x1234...5678',
    coinGeckoId: 'polygon',
    color: '#8247E5',
    decimals: 18,
  },
  SOL: {
    symbol: 'SOL',
    icon: SolanaIcon,
    address: '0x1234...5678',
    coinGeckoId: 'solana',
    color: '#28D4B5',
    decimals: 18,
  },
  WAVAX: {
    symbol: 'WAVAX',
    icon: AvaxIcon,
    address: '0x1234...5678',
    coinGeckoId: 'wrapped-avax',
    color: '#E84142',
    decimals: 18,
  },
  CELO: {
    symbol: 'CELO',
    icon: CeloIcon,
    address: '0x1234...5678',
    coinGeckoId: 'celo',
    color: '#35D07E',
    decimals: 18,
  },
  BNB: {
    symbol: 'BNB',
    icon: BnbIcon,
    address: '0x1234...5678',
    coinGeckoId: 'bnb',
    color: '#F3BA30',
    decimals: 18,
  },
};
