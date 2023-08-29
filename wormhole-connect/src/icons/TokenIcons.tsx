import React, { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import { CENTER } from '../utils/style';
import { Icon } from '../config/types';
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

const useStyles = makeStyles<{ size: number }>()((theme, { size }) => ({
  container: {
    height: size,
    width: size,
    ...CENTER,
  },
  icon: {
    maxHeight: '100%',
    maxWidth: '100%',
  },
}));

export const getIcon = (icon: Icon) => {
  switch (icon) {
    case Icon.WBTC: {
      return WBTC;
    }
    case Icon.BUSD: {
      return BUSD;
    }
    case Icon.USDT: {
      return USDT;
    }
    case Icon.DAI: {
      return DAI;
    }
    case Icon.GLMR: {
      return GLMR;
    }
    case Icon.AVAX: {
      return AVAX;
    }
    case Icon.BNB: {
      return BNB;
    }
    case Icon.BSC: {
      return BSC;
    }
    case Icon.CELO: {
      return CELO;
    }
    case Icon.ETH: {
      return ETH;
    }
    case Icon.FANTOM: {
      return FTM;
    }
    case Icon.POLYGON: {
      return MATIC;
    }
    case Icon.SOLANA: {
      return SOL;
    }
    case Icon.USDC: {
      return USDC;
    }
    case Icon.SUI: {
      return SUI;
    }
    case Icon.APT: {
      return APT;
    }
    case Icon.ARBITRUM: {
      return ARBITRUM;
    }
    case Icon.OPTIMISM: {
      return OPTIMISM;
    }
    case Icon.SEI: {
      return SEI;
    }
    case Icon.BASE: {
      return BASE;
    }
    default: {
      return noIcon;
    }
  }
};

type Props = {
  name?: Icon;
  height?: number;
};

function TokenIcon(props: Props) {
  const size = props.height || 32;
  const { classes } = useStyles({ size });

  const [icon, setIcon] = useState(noIcon);

  useEffect(() => {
    if (props.name) {
      setIcon(getIcon(props.name!)!);
    } else {
      setIcon(noIcon);
    }
  }, [props.name]);

  return <div className={classes.container}>{icon}</div>;
}

export default TokenIcon;
