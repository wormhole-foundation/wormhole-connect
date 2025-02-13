import React from 'react';
import { makeStyles } from 'tss-react/mui';

import type { Chain } from '@wormhole-foundation/sdk';

import { CENTER } from 'utils/style';
import GLMR from './Chains/GLMR';
import AVAX from './Chains/AVAX';
import CELO from './Chains/CELO';
import ETH from './Chains/ETH';
import FTM from './Chains/FTM';
import SOL from './Chains/SOL';
import APT from './Chains/APT';
import SUI from './Chains/SUI';
import BASE from './Chains/BASE';
import POLY from './Chains/POLY';
import BSC from './Chains/BSC';
import emptyChain from './Chains/empty';
import ARBITRUM from './Chains/ARBITRUM';
import OPTIMISM from './Chains/OPTIMISM';
import KAIA from './Chains/KAIA';
import SCROLL from './Chains/SCROLL';
import BLAST from './Chains/BLAST';
import MANTLE from './Chains/MANTLE';
import XLAYER from './Chains/XLAYER';
import OSMO from './Chains/OSMO';
import WORLD from './Chains/WORLD';
import UNI from './Chains/UNI';

const useStyles = makeStyles<{ size: number }>()((theme, { size }) => ({
  container: {
    height: size,
    width: size,
    ...CENTER,
  },
  iconImage: {
    width: size,
    height: size,
  },
  icon: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
}));

const iconMap: { [key in Chain]?: React.JSX.Element } = {
  Moonbeam: GLMR(),
  Avalanche: AVAX(),
  Bsc: BSC(),
  Celo: CELO(),
  Ethereum: ETH(),
  Fantom: FTM(),
  Polygon: POLY(),
  Solana: SOL(),
  Sui: SUI(),
  Aptos: APT(),
  Arbitrum: ARBITRUM(),
  Optimism: OPTIMISM(),
  Base: BASE(),
  Klaytn: KAIA(),
  Scroll: SCROLL(),
  Blast: BLAST(),
  Xlayer: XLAYER(),
  Mantle: MANTLE(),
  Osmosis: OSMO(),
  Worldchain: WORLD(),
  Unichain: UNI(),
};

function isBuiltinChainIcon(icon?: Chain | string): icon is Chain {
  return Object.keys(iconMap).includes(icon as Chain);
}

type Props = {
  icon?: Chain | string;
  height?: number;
};

function ChainIconComponent(props: Props) {
  const size = props.height || 36;
  const { classes } = useStyles({ size });

  // Default, if icon is undefined
  let icon = emptyChain;

  if (isBuiltinChainIcon(props.icon)) {
    icon = iconMap[props.icon] || emptyChain;
  } else if (typeof props.icon === 'string') {
    icon = <img className={classes.iconImage} src={props.icon} />;
  }

  return <div className={classes.container}>{icon}</div>;
}

export default ChainIconComponent;
