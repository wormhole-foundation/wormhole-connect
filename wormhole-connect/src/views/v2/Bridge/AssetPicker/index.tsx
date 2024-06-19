import React, { useEffect, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import Badge from '@mui/material/Badge';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Popover from '@mui/material/Popover';
import {
  usePopupState,
  bindTrigger,
  bindPopover,
} from 'material-ui-popup-state/hooks';
import Typography from '@mui/material/Typography';

import DownIcon from '@mui/icons-material/ExpandMore';
import UpIcon from '@mui/icons-material/ExpandLess';

import config from 'config';
import TokenIcon from 'icons/TokenIcons';

import type { ChainConfig, TokenConfig } from 'config/types';
import type { ChainName } from 'sdklegacy';
import type { WalletData } from 'store/wallet';
import ChainList from './ChainList';
import TokenList from './TokenList';

const useStyles = makeStyles()((theme) => ({
  container: {
    marginTop: '4px',
  },
  card: {
    width: '100%',
    cursor: 'pointer',
    maxHeight: '80px',
    maxWidth: '420px',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  const [showChainSearch, setShowChainSearch] = useState(false);
  const { classes } = useStyles();

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'asset-picker',
  });

  // Side-effect to reset chain search visibility.
  // Popover close has an animation, which requires to wait
  // a tiny bit before reseting showChainSearch.
  // 300 ms is the reference wait time in a double-click, that's why
  // we can use it as the min wait before user re-opens the popover.
  useEffect(() => {
    if (!popupState.isOpen) {
      setTimeout(() => {
        setShowChainSearch(false);
      }, 300);
    }
  }, [popupState.isOpen]);

  const chainConfig: ChainConfig | undefined = useMemo(() => {
    return props.chain ? config.chains[props.chain] : undefined;
  }, [props.chain]);

  const tokenConfig: TokenConfig | undefined = useMemo(() => {
    return props.token ? config.tokens[props.token] : undefined;
  }, [props.token]);

  const badges = useMemo(() => {
    return (
      <Badge
        badgeContent={<TokenIcon icon={chainConfig?.icon} height={24} />}
        sx={{
          marginRight: '8px',
          '& .MuiBadge-badge': {
            right: 2,
            top: 36,
          },
        }}
      >
        <TokenIcon icon={tokenConfig?.icon} height={48} />
      </Badge>
    );
  }, [chainConfig, tokenConfig]);

  const selection = useMemo(() => {
    if (!chainConfig && !tokenConfig) {
      return (
        <Typography component={'div'} fontSize={16}>
          Select chain and token
        </Typography>
      );
    }

    return (
      <div>
        <Typography component={'div'} fontSize={16}>
          {tokenConfig?.symbol || 'Select token'}
        </Typography>
        <Typography component={'div'} fontSize={12}>
          {chainConfig?.displayName}
        </Typography>
      </div>
    );
  }, [props.chain, props.token]);

  return (
    <>
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
            {badges}
            {selection}
          </Typography>
          {popupState.isOpen ? <UpIcon /> : <DownIcon />}
        </CardContent>
      </Card>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'top',
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
          selectedChainConfig={chainConfig}
          showSearch={showChainSearch}
          setShowSearch={setShowChainSearch}
          wallet={props.wallet}
          onClick={(key: string) => {
            props.setChain(key);
          }}
        />
        {!showChainSearch && chainConfig && (
          <TokenList
            tokenList={props.tokenList}
            selectedChainConfig={chainConfig}
            selectedToken={props.token}
            wallet={props.wallet}
            onClick={(key: string) => {
              props.setToken(key);
              popupState.close();
            }}
          />
        )}
      </Popover>
    </>
  );
};

export default AssetPicker;
