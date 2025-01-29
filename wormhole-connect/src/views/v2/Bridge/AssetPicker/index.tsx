import React, { useEffect, useMemo, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
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

import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import { isDisabledChain } from 'store/transferInput';
import ChainList from './ChainList';
import TokenList from './TokenList';
import { Chain } from '@wormhole-foundation/sdk';
import AssetBadge from 'components/AssetBadge';
import { Token } from 'config/tokens';
import { Backdrop } from '@mui/material';
import { opacify } from 'utils/theme';

const useStyles = makeStyles()((theme: any) => ({
  inputArea: {
    width: '100%',
    cursor: 'pointer',
    maxWidth: '420px',
    borderRadius: '8px',
    background: 'transparent',
    border: `1px solid ${theme.palette.input.border}`,
  },
  inputAreaEmpty: {
    borderColor: theme.palette.input.background,
    background: theme.palette.input.background,
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '72px',
    padding: '16px 20px',
    ':last-child': {
      padding: '16px 20px',
    },
  },
  chainSelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: '0.4',
    cursor: 'not-allowed',
    clickEvent: 'none',
  },
  popoverSlot: {
    width: '100%',
    maxWidth: '420px',
    borderRadius: '8px',
    background: theme.palette.input.background,
  },
  backdrop: {
    backgroundColor: `rgba(0,0,0,0.2)`,
  },
}));

type Props = {
  chain?: Chain | undefined;
  chainList: Array<ChainConfig>;
  token?: Token;
  sourceToken?: Token;
  tokenList?: Array<Token> | undefined;
  isFetching?: boolean;
  setToken: (value: Token) => void;
  setChain: (value: Chain) => void;
  wallet: WalletData;
  isSource: boolean;
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
  // a tiny bit before resetting showChainSearch.
  // 300 ms is the reference wait time in a double-click, that's why
  // we can use it as the min wait before user re-opens the popover.
  useEffect(() => {
    if (!popupState.isOpen) {
      setTimeout(() => {
        setShowChainSearch(false);
      }, 300);
    }
  }, [popupState.isOpen]);

  // Pre-selecting first allowed chain, when asset picker is opened
  useEffect(() => {
    if (popupState.isOpen && !props.chain) {
      const firstAllowedChain = props.chainList.find(
        (chain) => !isDisabledChain(chain.key, props.wallet),
      );
      if (firstAllowedChain) {
        props.setChain(firstAllowedChain.key);
      }
    }
    // Re-run only when popup state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popupState.isOpen]);

  const chainConfig: ChainConfig | undefined = useMemo(() => {
    return props.chain ? config.chains[props.chain] : undefined;
  }, [props.chain]);

  const selection = useMemo(() => {
    if (!chainConfig && !props.token) {
      return (
        <Typography component={'div'} fontSize={16}>
          Select chain and token
        </Typography>
      );
    }

    const tokenDisplay = props.token ? (
      <>{props.token.display}</>
    ) : (
      <>Select token</>
    );

    return (
      <div>
        <Typography
          component={'div'}
          maxWidth={300}
          fontSize={16}
          fontWeight={700}
          sx={{
            display: 'flex',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tokenDisplay}
        </Typography>
        <Typography component={'div'} fontSize={12} sx={{ opacity: 0.6 }}>
          {chainConfig?.displayName}
        </Typography>
      </div>
    );
  }, [chainConfig, props.token]);

  return (
    <>
      <Backdrop open={popupState.isOpen} className={classes.backdrop} />
      <Card
        className={`${classes.inputArea} ${
          chainConfig ? '' : classes.inputAreaEmpty
        }`}
        onMouseDown={popupState.open}
        onTouchStart={popupState.open}
      >
        <CardContent className={classes.cardContent}>
          <Typography
            className={classes.chainSelector}
            component={'div'}
            gap={1}
          >
            <AssetBadge chainConfig={chainConfig} token={props.token} />
            {selection}
          </Typography>
          {popupState.isOpen ? <UpIcon /> : <DownIcon />}
        </CardContent>
      </Card>
      <Popover
        {...bindPopover(popupState)}
        transitionDuration={200}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        className={classes.popover}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        marginThreshold={4}
        slotProps={{
          paper: {
            className: classes.popoverSlot,
          },
        }}
      >
        <ChainList
          chainList={props.chainList}
          selectedChainConfig={chainConfig}
          showSearch={showChainSearch}
          setShowSearch={setShowChainSearch}
          wallet={props.wallet}
          onChainSelect={(key) => {
            props.setChain(key);
          }}
        />
        {!showChainSearch && chainConfig && (
          <TokenList
            tokenList={props.tokenList}
            isFetching={props.isFetching}
            selectedChainConfig={chainConfig}
            selectedToken={props.token}
            sourceToken={props.sourceToken}
            wallet={props.wallet}
            onSelectToken={(key: Token) => {
              props.setToken(key);
              popupState.close();
            }}
            isSource={props.isSource}
          />
        )}
      </Popover>
    </>
  );
};

export default AssetPicker;
