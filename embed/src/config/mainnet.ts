import { CONFIG } from '@sdk';
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

const { chains } = CONFIG.MAINNET;

export const MAINNET_NETWORKS: NetworksConfig = {
  solana: {
    ...chains.solana,
    icon: SolanaIcon,
  },
  ethereum: {
    ...chains.ethereum,
    icon: EthIcon,
  },
  terra: {
    ...chains.terra,
    icon: TerraIcon,
  },
  bsc: {
    ...chains.bsc,
    icon: BscIcon,
  },
  polygon: {
    ...chains.polygon,
    icon: PolygonIcon,
  },
  avalanche: {
    ...chains.avalanche,
    icon: AvaxIcon,
  },
  oasis: {
    ...chains.oasis,
    icon: OasisIcon,
  },
  algorand: {
    ...chains.algorand,
    icon: AlgoIcon,
  },
  aurora: {
    ...chains.aurora,
    icon: AuroraIcon,
  },
  fantom: {
    ...chains.fantom,
    icon: FantomIcon,
  },
  karura: {
    ...chains.karura,
    icon: KaruraIcon,
  },
  acala: {
    ...chains.acala,
    icon: AcalaIcon,
  },
  klaytn: {
    ...chains.klaytn,
    icon: KlaytnIcon,
  },
  celo: {
    ...chains.celo,
    icon: CeloIcon,
  },
  near: {
    ...chains.near,
    icon: NearIcon,
  },
  injective: {
    ...chains.injective,
    icon: InjectiveIcon,
  },
  osmosis: {
    ...chains.osmosis,
    icon: OsmosisIcon,
  },
  aptos: {
    ...chains.aptos,
    icon: AptosIcon,
  },
  sui: {
    ...chains.sui,
    icon: SuiIcon,
  },
  moonbeam: {
    ...chains.moonbeam,
    icon: MoonbeamIcon,
  },
  neon: {
    ...chains.neon,
    icon: NeonIcon,
  },
  terra2: {
    ...chains.terra2,
    icon: Terra2Icon,
  },
  arbitrum: {
    ...chains.arbitrum,
    icon: ArbitrumIcon,
  },
  optimism: {
    ...chains.optimism,
    icon: '',
  },
  gnosis: {
    ...chains.gnosis,
  },
  pythnet: {
    ...chains.pythnet,
  },
  xpla: {
    ...chains.xpla,
    icon: XplaIcon,
  },
  btc: {
    ...chains.btc,
  },
  wormchain: {
    ...chains.wormchain,
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
