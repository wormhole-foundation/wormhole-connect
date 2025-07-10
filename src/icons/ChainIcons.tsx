import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';

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
import ARBITRUM from './Chains/ARBITRUM';
import OPTIMISM from './Chains/OPTIMISM';
import KAIA from './Chains/KAIA';
import SCROLL from './Chains/SCROLL';
import MANTLE from './Chains/MANTLE';
import XLAYER from './Chains/XLAYER';
import WORLD from './Chains/WORLD';
import UNI from './Chains/UNI';
import BERA from './Chains/BERA';
import MEZO from './Chains/MEZO';
import LINEA from './Chains/LINEA';
import SONIC from './Chains/SONIC';
import SEIEVM from './Chains/SEIEVM';
import PLUME from './Chains/PLUME';

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
  Xlayer: XLAYER(),
  Mantle: MANTLE(),
  Worldchain: WORLD(),
  Unichain: UNI(),
  Berachain: BERA(),
  Mezo: MEZO(),
  Linea: LINEA(),
  Sonic: SONIC(),
  Seievm: SEIEVM(),
  Plume: PLUME(),
};

function isBuiltinChainIcon(icon?: Chain | string): icon is Chain {
  return Object.keys(iconMap).includes(icon as Chain);
}

type Props = {
  icon?: Chain | string;
  height?: number;
};

function EmptyIcon(props: { size: number }) {
  const theme = useTheme();
  const { size } = props;

  const styles = useMemo(() => {
    const baseStyle = {
      width: size,
      height: size,
      borderRadius: '3px',
    };
    if (theme.palette.text && theme.palette.input) {
      return {
        emptyIcon: {
          ...baseStyle,
          background: `color-mix(in hsl, ${theme.palette.text.secondary}, ${theme.palette.input.background} 80%)`,
        },
      };
    }
    return {
      emptyIcon: baseStyle,
    };
  }, [size, theme]);

  return <Box sx={styles.emptyIcon} />;
}

function ChainIconComponent(props: Props) {
  const size = props.height || 36;

  const styles = useMemo(
    () => ({
      container: {
        height: size,
        width: size,
        ...CENTER,
      },
      iconImage: {
        width: size,
        height: size,
      },
    }),
    [size],
  );

  if (isBuiltinChainIcon(props.icon) && iconMap[props.icon]) {
    // Assuming iconMap stores direct JSX elements based on recent reversions by user
    return <Box sx={styles.container}>{iconMap[props.icon]!}</Box>;
  } else if (typeof props.icon === 'string') {
    return (
      <Box sx={styles.container}>
        <img style={styles.iconImage} src={props.icon} alt="chain icon" />
      </Box>
    );
  } else {
    // Default to EmptyIcon if props.icon is undefined or doesn't match other conditions
    return (
      <Box sx={styles.container}>
        <EmptyIcon size={size} />
      </Box>
    );
  }
}

export default ChainIconComponent;
