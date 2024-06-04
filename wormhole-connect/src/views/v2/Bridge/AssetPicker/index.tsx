import React, { useMemo } from 'react';
import { makeStyles } from 'tss-react/mui';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Popover from '@mui/material/Popover';
import PopupState, { bindTrigger, bindPopover } from 'material-ui-popup-state';
import Typography from '@mui/material/Typography';

import DownIcon from '@mui/icons-material/ExpandMore';
import UpIcon from '@mui/icons-material/ExpandLess';

import config from 'config';
import TokenIcon from 'icons/TokenIcons';

import type { ChainConfig, TokenConfig } from 'config/types';
import type { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import type { WalletData } from 'store/wallet';
import ChainList from './ChainList';

const useStyles = makeStyles()((theme) => ({
  container: {
    marginTop: '4px',
  },
  card: {
    width: '100%',
    cursor: 'pointer',
    maxHeight: '72px',
    maxWidth: '420px',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chainTile: {
    width: '50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    margin: '4px',
    padding: '4px',
    transition: 'background-color 0.4s',
    cursor: 'pointer',
  },
  chainSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: '40%',
    cursor: 'not-allowed',
    clickEvent: 'none',
  },
}));

type Props = {
  chain?: ChainName | undefined;
  chainList?: Array<ChainConfig> | undefined;
  token?: string;
  tokenList?: Array<TokenConfig> | undefined;
  setToken: Function;
  setChain: Function;
  wallet: WalletData;
};

const AssetPicker = (props: Props) => {
  const { classes } = useStyles();

  const chainConfig: ChainConfig | undefined = useMemo(() => {
    return props.chain && config.chains[props.chain];
  }, [props.chain]);

  const selection = useMemo(() => {
    const { chain, token } = props;

    const tokenConfig = token && config.tokens[token];

    if (!chain) {
      return 'Select chain and token';
    }

    if (!token) {
      <Typography component={'div'}>{chain}</Typography>;
    }

    return (
      <React.Fragment>
        <Typography component={'div'}>
          {tokenConfig && tokenConfig.symbol}
        </Typography>
        <Typography component={'div'}>{chain}</Typography>
      </React.Fragment>
    );
  }, [props.chain, props.token]);

  return (
    <PopupState variant="popover" popupId="demo-popup-menu">
      {(popupState: any) => (
        <React.Fragment>
          <Card
            className={classes.card}
            variant="elevation"
            {...bindTrigger(popupState)}
          >
            <CardContent className={classes.cardContent}>
              <Typography
                className={classes.chainSelector}
                component={'div'}
                gap={1}
              >
                <TokenIcon icon={chainConfig?.icon} height={36} />
                {selection}
              </Typography>
              {popupState.isOpen ? <UpIcon /> : <DownIcon />}
            </CardContent>
          </Card>
          <Popover
            {...bindPopover(popupState)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            className={classes.container}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <ChainList
              chainList={props.chainList}
              selectedChain={props.chain}
              wallet={props.wallet}
              onClick={(key: string) => {
                props.setChain(key);
                popupState.close();
              }}
            />
          </Popover>
        </React.Fragment>
      )}
    </PopupState>
  );
};

export default AssetPicker;
