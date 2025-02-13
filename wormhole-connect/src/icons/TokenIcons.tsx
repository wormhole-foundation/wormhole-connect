import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { chainToIcon } from '@wormhole-foundation/sdk-icons';

import { CENTER } from 'utils/style';
import { TokenIcon } from 'config/types';
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
import POLY from './Tokens/POLY';
import BSC from './Tokens/BSC';
import USDC from './Tokens/USDC';
import emptyToken from './Tokens/empty';
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
import WORLD from './Tokens/WORLD';
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
    borderRadius: '50px',
  },
  icon: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
}));

const iconMap: { [key in TokenIcon]: React.JSX.Element } = {
  [TokenIcon.WBTC]: WBTC(),
  [TokenIcon.BUSD]: BUSD(),
  [TokenIcon.USDT]: USDT(),
  [TokenIcon.DAI]: DAI(),
  [TokenIcon.GLMR]: GLMR(),
  [TokenIcon.AVAX]: AVAX(),
  [TokenIcon.BNB]: BNB(),
  [TokenIcon.BSC]: BSC(),
  [TokenIcon.CELO]: CELO(),
  [TokenIcon.ETH]: ETH(),
  [TokenIcon.FANTOM]: FTM(),
  [TokenIcon.POLYGON]: POLY(),
  [TokenIcon.SOLANA]: SOL(),
  [TokenIcon.USDC]: USDC(),
  [TokenIcon.SUI]: SUI(),
  [TokenIcon.APT]: APT(),
  [TokenIcon.ARBITRUM]: ARBITRUM(),
  [TokenIcon.OPTIMISM]: OPTIMISM(),
  [TokenIcon.SEI]: SEI(),
  [TokenIcon.BASE]: BASE(),
  [TokenIcon.OSMO]: OSMO(),
  [TokenIcon.TBTC]: TBTC(),
  [TokenIcon.WSTETH]: WSTETH(),
  [TokenIcon.ATOM]: ATOM(),
  [TokenIcon.EVMOS]: EVMOS(),
  [TokenIcon.KUJI]: KUJI(),
  [TokenIcon.PYTH]: PYTH(),
  [TokenIcon.KLAY]: KLAY(),
  [TokenIcon.INJ]: INJ(),
  [TokenIcon.NTT]: NTT(),
  [TokenIcon.SCROLL]: SCROLL(),
  [TokenIcon.BLAST]: BLAST(),
  [TokenIcon.XLAYER]: (
    <img
      style={{ maxHeight: '100%', maxWidth: '100%' }}
      src={chainToIcon('Xlayer')}
    />
  ),
  [TokenIcon.MANTLE]: (
    <img
      style={{ maxHeight: '100%', maxWidth: '100%' }}
      src={chainToIcon('Mantle')}
    />
  ),
  [TokenIcon.WORLDCHAIN]: WORLD(),
  [TokenIcon.UNICHAIN]: UNI(),
};

function isBuiltinTokenIcon(icon?: TokenIcon | string): icon is TokenIcon {
  return Object.values(TokenIcon).includes(icon as TokenIcon);
}

type Props = {
  icon?: TokenIcon | string;
  height?: number;
};

function TokenIconComponent(props: Props) {
  const size = props.height || 36;
  const { classes } = useStyles({ size });

  // Default, if icon is undefined
  let icon = emptyToken;

  if (isBuiltinTokenIcon(props.icon)) {
    icon = iconMap[props.icon] || emptyToken;
  } else if (typeof props.icon === 'string') {
    icon = <img className={classes.iconImage} src={props.icon} />;
  }

  return <div className={classes.container}>{icon}</div>;
}

export default TokenIconComponent;
