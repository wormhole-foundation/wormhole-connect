import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';

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
import WORLD from './Tokens/WORLD';
import BERA from './Tokens/BERA';
import BTC from './Tokens/BTC';
import SONIC from './Chains/SONIC'; // TODO: Create a token icon for S
import PLUME from './Tokens/PLUME';
import FOGO from './Tokens/FOGO';
import HYPE from './Tokens/HYPE';

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
  [TokenIcon.BERA]: BERA(),
  [TokenIcon.BTC]: BTC(),
  [TokenIcon.SONIC]: SONIC(),
  [TokenIcon.PLUME]: PLUME(),
  [TokenIcon.FOGO]: FOGO(),
  [TokenIcon.HYPE]: HYPE(),
};

function isBuiltinTokenIcon(icon?: TokenIcon | string): icon is TokenIcon {
  return Object.values(TokenIcon).includes(icon as TokenIcon);
}

type Props = {
  icon?: TokenIcon | string;
  style?: React.CSSProperties;
};

function EmptyIcon(props: { style: React.CSSProperties }) {
  const theme = useTheme();
  const sxProps = useMemo(() => {
    if (theme.palette.text && theme.palette.input) {
      return {
        ...props.style,
        background: `color-mix(in hsl, ${theme.palette.text.secondary}, ${theme.palette.input.background} 80%)`,
      };
    }
    return props.style;
  }, [props.style, theme.palette.input, theme.palette.text]);

  return <Box sx={sxProps} />;
}

function TokenIconComponent(props: Props) {
  const styles = useMemo(
    () => ({
      container: {
        ...(props.style || { width: '36px', height: '36px' }),
        ...CENTER,
      },
      iconImage: {
        ...(props.style || { width: '36px', height: '36px' }),
        borderRadius: '50px',
      },
    }),
    [props.style], // Recompute styles only when style prop changes
  );

  if (isBuiltinTokenIcon(props.icon) && iconMap[props.icon]) {
    // Assuming iconMap stores direct JSX elements
    return <Box sx={styles.container}>{iconMap[props.icon]}</Box>;
  } else if (typeof props.icon === 'string') {
    return (
      <Box sx={styles.container}>
        <img style={styles.iconImage} src={props.icon} alt="token icon" />
      </Box>
    );
  } else {
    // Default to EmptyIcon if props.icon is undefined or doesn't match other conditions
    return (
      <Box sx={styles.container}>
        <EmptyIcon style={styles.iconImage} />
      </Box>
    );
  }
}

export default TokenIconComponent;
