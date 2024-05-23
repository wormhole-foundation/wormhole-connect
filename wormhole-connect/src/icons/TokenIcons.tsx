import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { chainToIcon } from '@wormhole-foundation/sdk-icons';

import { CENTER } from 'utils/style';
import { Icon } from 'config/types';
import WBTC from './Tokens/WBTC';
import BUSD from './Tokens/BUSD';
import USDT from './Tokens/USDT';
import DAI from './Tokens/DAI';
import GLMR from './Tokens/GLMR';
import AVAX from './Tokens/AVAX';
import BNB from './Tokens/BNB';
import CELO from './Tokens/CELO';
import ETH from './Tokens/ETH';
import FTM from './Tokens/FTM';
import SOL from './Tokens/SOL';
import APT from './Tokens/APT';
import SUI from './Tokens/SUI';
import SEI from './Tokens/SEI';
import BASE from './Tokens/BASE';
import MATIC from './Tokens/MATIC';
import BSC from './Tokens/BSC';
import USDC from './Tokens/USDC';
import noIcon from './Tokens/noIcon';
import ARBITRUM from './Tokens/ARBITRUM';
import OPTIMISM from './Tokens/OPTIMISM';
import OSMO from './Tokens/OSMO';
import TBTC from './Tokens/TBTC';
import WSTETH from './Tokens/WSTETH';
import EVMOS from './Tokens/EVMOS';
import ATOM from './Tokens/ATOM';
import KUJI from './Tokens/KUJI';
import KLAY from './Tokens/KLAY';
import PYTH from './Tokens/PYTH';
import INJ from './Tokens/INJ';
import NTT from './Tokens/NTT';
import SCROLL from './Tokens/SCROLL';
import BLAST from './Tokens/BLAST';

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

const iconMap: { [key in Icon]: React.JSX.Element } = {
  [Icon.WBTC]: WBTC(),
  [Icon.BUSD]: BUSD(),
  [Icon.USDT]: USDT(),
  [Icon.DAI]: DAI(),
  [Icon.GLMR]: GLMR(),
  [Icon.AVAX]: AVAX(),
  [Icon.BNB]: BNB(),
  [Icon.BSC]: BSC(),
  [Icon.CELO]: CELO(),
  [Icon.ETH]: ETH(),
  [Icon.FANTOM]: FTM(),
  [Icon.POLYGON]: MATIC(),
  [Icon.SOLANA]: SOL(),
  [Icon.USDC]: USDC(),
  [Icon.SUI]: SUI(),
  [Icon.APT]: APT(),
  [Icon.ARBITRUM]: ARBITRUM(),
  [Icon.OPTIMISM]: OPTIMISM(),
  [Icon.SEI]: SEI(),
  [Icon.BASE]: BASE(),
  [Icon.OSMO]: OSMO(),
  [Icon.TBTC]: TBTC(),
  [Icon.WSTETH]: WSTETH(),
  [Icon.ATOM]: ATOM(),
  [Icon.EVMOS]: EVMOS(),
  [Icon.KUJI]: KUJI(),
  [Icon.PYTH]: PYTH(),
  [Icon.KLAY]: KLAY(),
  [Icon.INJ]: INJ(),
  [Icon.NTT]: NTT(),
  [Icon.SCROLL]: SCROLL(),
  [Icon.BLAST]: BLAST(),
  [Icon.XLAYER]: <img src={chainToIcon('Xlayer')} />,
};

function isBuiltinIcon(icon?: Icon | string): icon is Icon {
  return Object.values(Icon).includes(icon as Icon);
}

type Props = {
  icon?: Icon | string;
  height?: number;
};

function TokenIcon(props: Props) {
  const size = props.height || 32;
  const { classes } = useStyles({ size });

  // Default, if icon is undefined
  let icon = noIcon;

  if (isBuiltinIcon(props.icon)) {
    icon = iconMap[props.icon] || noIcon;
  } else if (typeof props.icon === 'string') {
    icon = <img className={classes.iconImage} src={props.icon} />;
  }

  return <div className={classes.container}>{icon}</div>;
}

export default TokenIcon;
