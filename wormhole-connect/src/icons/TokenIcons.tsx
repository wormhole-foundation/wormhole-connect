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
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          viewBox="0 0 470.29 514.25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m291.13 237.47 35.654-60.5 96.103 149.68 0.046 28.727-0.313-197.67c-0.228-4.832-2.794-9.252-6.887-11.859l-173.02-99.525c-4.045-1.99-9.18-1.967-13.22 0.063-0.546 0.272-1.06 0.57-1.548 0.895l-0.604 0.379-167.94 97.322-0.651 0.296c-0.838 0.385-1.686 0.875-2.48 1.444-3.185 2.283-5.299 5.66-5.983 9.448-0.103 0.574-0.179 1.158-0.214 1.749l0.264 161.08 89.515-138.74c11.271-18.397 35.825-24.323 58.62-24.001l26.753 0.706-157.64 252.8 18.582 10.697 159.52-263.24 70.51-0.256-159.11 269.88 66.306 38.138 7.922 4.556c3.351 1.362 7.302 1.431 10.681 0.21l175.45-101.68-33.544 19.438-92.775-150.04zm13.602 195.93-66.969-105.11 40.881-69.371 87.952 138.63-61.864 35.851z"
            fill="#2D374B"
          />
          <polygon
            points="237.77 328.29 304.74 433.4 366.6 397.54 278.65 258.92"
            fill="#28A0F0"
          />
          <path
            d="m422.94 355.38-0.046-28.727-96.103-149.68-35.654 60.5 92.774 150.04 33.544-19.438c3.29-2.673 5.281-6.594 5.49-10.825l-5e-3 -1.869z"
            fill="#28A0F0"
          />
          <path
            d="m20.219 382.47 47.369 27.296 157.63-252.8-26.753-0.706c-22.795-0.322-47.35 5.604-58.62 24.001l-89.515 138.74-30.115 46.271v17.194z"
            fill="#fff"
          />
          <polygon
            points="316.2 156.96 245.69 157.22 86.17 420.46 141.93 452.56 157.09 426.85"
            fill="#fff"
          />
          <path
            d="m452.65 156.6c-0.59-14.746-8.574-28.245-21.08-36.104l-175.29-100.8c-12.371-6.229-27.825-6.237-40.218-4e-3 -1.465 0.739-170.46 98.752-170.46 98.752-2.339 1.122-4.592 2.458-6.711 3.975-11.164 8.001-17.969 20.435-18.668 34.095v208.76l30.115-46.271-0.263-161.08c0.035-0.589 0.109-1.169 0.214-1.741 0.681-3.79 2.797-7.171 5.983-9.456 0.795-0.569 172.68-100.06 173.23-100.34 4.04-2.029 9.175-2.053 13.22-0.063l173.02 99.523c4.093 2.607 6.659 7.027 6.887 11.859v199.54c-0.209 4.231-1.882 8.152-5.172 10.825l-33.544 19.438-17.308 10.031-61.864 35.852-62.737 36.357c-3.379 1.221-7.33 1.152-10.681-0.21l-74.228-42.693-15.163 25.717 66.706 38.406c2.206 1.255 4.171 2.367 5.784 3.272 2.497 1.4 4.199 2.337 4.8 2.629 4.741 2.303 11.563 3.643 17.71 3.643 5.636 0 11.132-1.035 16.332-3.072l182.22-105.53c10.459-8.104 16.612-20.325 17.166-33.564v-201.75z"
            fill="#96BEDC"
          />
        </svg>
      );
    }
    case Icon.OPTIMISM: {
      return (
        <svg
          style={{ maxHeight: '100%', maxWidth: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
          id="optimism-logo-circle"
          width="122"
          height="122"
          viewBox="0 0 122 122"
        >
          <circle
            id="Ellipse_11"
            data-name="Ellipse 11"
            cx="61"
            cy="61"
            r="61"
            fill="#ff0420"
          />
          <path
            id="Path_139"
            data-name="Path 139"
            d="M113.533,178.026a14.656,14.656,0,0,1-8.924-2.563,8.762,8.762,0,0,1-3.432-7.413,16.433,16.433,0,0,1,.229-2.471q.595-3.3,1.693-7.917,3.112-12.585,16.062-12.585a15.966,15.966,0,0,1,6.315,1.19,9.6,9.6,0,0,1,4.393,3.478,9.333,9.333,0,0,1,1.6,5.492,16.288,16.288,0,0,1-.229,2.425q-.687,4.073-1.647,7.917-1.6,6.269-5.537,9.381Q120.123,178.026,113.533,178.026Zm.641-6.59a6.5,6.5,0,0,0,4.348-1.51,8.424,8.424,0,0,0,2.608-4.622q1.053-4.3,1.6-7.505a10.5,10.5,0,0,0,.183-1.968q0-4.165-4.347-4.164a6.681,6.681,0,0,0-4.393,1.51,8.573,8.573,0,0,0-2.563,4.622q-.824,3.066-1.647,7.505a9.791,9.791,0,0,0-.183,1.922Q109.78,171.436,114.174,171.436Z"
            transform="translate(-70.332 -100.849)"
            fill="#fff"
          />
          <path
            id="Path_140"
            data-name="Path 140"
            d="M205.3,178.612a.97.97,0,0,1-.778-.32,1.1,1.1,0,0,1-.137-.824l6.315-29.746a1.31,1.31,0,0,1,.5-.824,1.4,1.4,0,0,1,.87-.32h12.173a14.148,14.148,0,0,1,8.146,2.105,6.9,6.9,0,0,1,3.112,6.087,10.955,10.955,0,0,1-.275,2.38,12.39,12.39,0,0,1-4.622,7.78q-3.432,2.517-9.427,2.517H215l-2.105,10.022a1.311,1.311,0,0,1-.5.824,1.4,1.4,0,0,1-.869.32Zm16.2-17.482a5.451,5.451,0,0,0,3.341-1.052,4.942,4.942,0,0,0,1.922-3.02,8.022,8.022,0,0,0,.137-1.373,2.543,2.543,0,0,0-.778-2.014,3.836,3.836,0,0,0-2.654-.732h-5.491l-1.739,8.191Z"
            transform="translate(-142.055 -101.892)"
            fill="#fff"
          />
        </svg>
      );
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
