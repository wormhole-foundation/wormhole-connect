import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Popover from '@mui/material/Popover';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import {
  usePopupState,
  bindPopover,
  bindTrigger,
} from 'material-ui-popup-state/hooks';
import Typography from '@mui/material/Typography';
import DownIcon from '@mui/icons-material/ExpandMore';
import UpIcon from '@mui/icons-material/ExpandLess';
import type { Chain } from '@wormhole-foundation/sdk';

import config from 'config';
import type { ChainConfig } from 'config/types';
import type { WalletData } from 'store/wallet';
import { isDisabledChain } from 'store/transferInput';
import type { Balances } from 'utils/wallet/types';
import ChainList from './ChainList';
import TokenList from './TokenList';
import AssetBadge from 'components/AssetBadge';
import type { Token } from 'config/tokens';
import { useTokenList } from 'hooks/useTokenList';
import { getTokenSymbol } from 'utils';

type Props = {
  chain?: Chain | undefined;
  chainList: Array<ChainConfig>;
  token?: Token;
  sourceToken?: Token;
  tokenList?: Array<Token> | undefined;
  isFetching?: boolean;
  isSameChainSwap: boolean;
  setToken: (value: Token) => void;
  setChain: (value: Chain) => void;
  wallet: WalletData;
  isSource: boolean;
  isTransactionInProgress: boolean;
  dataTestId?: string;
  balances: Balances;
  isFetchingBalances: boolean;
  isConnectingWallet?: boolean;
};

const AssetPicker = (props: Props) => {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showChainSearch, setShowChainSearch] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedTokens = useTokenList({
    tokenList: props.tokenList || [],
    searchQuery,
    selectedChainConfig: props.chain ? config.chains[props.chain] : ({} as any),
    selectedToken: props.token,
    sourceToken: props.sourceToken,
    wallet: props.wallet,
    balances: props.balances,
    isSourceList: props.isSource, // true for source, false for destination
  });

  const popupState = usePopupState({
    variant: 'popover',
    popupId: 'asset-picker',
  });

  // Side-effect to reset chain search visibility.
  // Popover and drawer close has an animation, which requires to wait
  // a tiny bit before resetting showChainSearch.
  // 300 ms is the reference wait time in a double-click, that's why
  // we can use it as the min wait before user re-opens the popover.
  useEffect(() => {
    if ((mobile && !isDrawerOpen) || (!mobile && !popupState.isOpen)) {
      setTimeout(() => {
        setShowChainSearch(false);
      }, 300);
    }
  }, [isDrawerOpen, mobile, popupState.isOpen]);

  // Pre-selecting first allowed chain, when asset picker is opened
  useEffect(() => {
    if (
      (mobile && isDrawerOpen && !props.chain) ||
      (!mobile && popupState.isOpen && !props.chain)
    ) {
      const firstAllowedChain = props.chainList.find(
        (chain) => !isDisabledChain(chain.sdkName, props.wallet),
      );
      if (firstAllowedChain) {
        props.setChain(firstAllowedChain.sdkName);
      }
    }
    // Re-run only when popup/drawer state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, isDrawerOpen, popupState.isOpen]);

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

    const tokenDisplay = props.token
      ? getTokenSymbol(props.token)
      : 'Select token';

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

  const triggerProps =
    props.isTransactionInProgress || mobile ? {} : bindTrigger(popupState);

  const styles = useMemo(
    () => ({
      inputArea: {
        width: '100%',
        cursor: 'pointer',
        maxWidth: '420px',
        borderRadius: '8px',
        background: theme.palette.input.fillTreatment
          ? 'transparent'
          : theme.palette.input.background,
        border: theme.palette.input.fillTreatment
          ? `1px solid ${theme.palette.input.border}`
          : 'none',
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
        opacity: '0.6',
        cursor: 'default',
        pointerEvents: 'none',
      },
      popover: {
        marginLeft: '-1px',
        marginTop: '-1px',
        width: '422px',
      },
      popoverSlot: {
        width: '100%',
        maxWidth: '422px',
        borderRadius: '8px',
        background: theme.palette.input.background,
      },
      backdrop: {
        backgroundColor: `rgba(0,0,0,0.2)`,
      },
      drawer: {
        background: theme.palette.input.background,
        borderRadius: '8px',
        height: 'calc(100vh - 40px)', // Force full-height on small mobile devices with 40px padding at the top
        maxWidth: '100vw', // Force full-width on small mobile devices
      },
    }),
    [theme],
  );

  return (
    <>
      <Backdrop open={popupState.isOpen} sx={styles.backdrop} />
      <Card
        sx={[
          styles.inputArea,
          !chainConfig && styles.inputAreaEmpty,
          props.isTransactionInProgress && styles.disabled,
        ]}
        data-testid={props.dataTestId}
        variant="elevation"
        onMouseDown={(e) => {
          if (mobile) {
            setIsDrawerOpen(true);
          } else {
            popupState.open(e);
          }
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (mobile) {
            setIsDrawerOpen(true);
          } else {
            popupState.open(e);
          }
        }}
        {...triggerProps}
      >
        <CardContent sx={styles.cardContent}>
          <Typography sx={styles.chainSelector} component={'div'} gap={1}>
            <AssetBadge chainConfig={chainConfig} token={props.token} />
            {selection}
          </Typography>
          {popupState.isOpen || isDrawerOpen ? <UpIcon /> : <DownIcon />}
        </CardContent>
      </Card>
      {mobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={isDrawerOpen}
          PaperProps={{
            sx: styles.drawer,
          }}
          transitionDuration={200}
          onOpen={() => setIsDrawerOpen(true)}
          onClose={() => setIsDrawerOpen(false)}
        >
          <Stack alignItems="center" paddingBottom="4px" paddingTop="8px">
            <Box
              sx={{
                width: '40px',
                height: '5px',
                backgroundColor: theme.palette.text.secondary,
                borderRadius: '8px',
              }}
            ></Box>
          </Stack>
          <ChainList
            chainList={props.chainList}
            selectedChainConfig={chainConfig}
            showSearch={showChainSearch}
            setShowSearch={setShowChainSearch}
            wallet={props.wallet}
            onChainSelect={(key) => {
              props.setChain(key);
              setSearchQuery('');
            }}
          />
          {!showChainSearch && chainConfig && (
            <TokenList
              tokenList={sortedTokens}
              balances={props.balances}
              isFetchingBalances={props.isFetchingBalances}
              isFetching={props.isFetching}
              isConnectingWallet={props.isConnectingWallet}
              isSameChainSwap={props.isSameChainSwap}
              selectedChainConfig={chainConfig}
              selectedToken={props.token}
              sourceToken={props.sourceToken}
              isSource={props.isSource}
              wallet={props.wallet}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSelectToken={(key: Token) => {
                props.setToken(key);
                setIsDrawerOpen(false);
              }}
            />
          )}
        </SwipeableDrawer>
      ) : (
        <Popover
          {...bindPopover(popupState)}
          transitionDuration={200}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={styles.popover}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          marginThreshold={4}
          slotProps={{
            paper: {
              sx: [styles.popoverSlot, { borderRadius: '8px' }],
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
              setSearchQuery('');
            }}
          />
          {!showChainSearch && chainConfig && (
            <TokenList
              tokenList={sortedTokens}
              isFetching={props.isFetching}
              balances={props.balances}
              isFetchingBalances={props.isFetchingBalances}
              isConnectingWallet={props.isConnectingWallet}
              isSameChainSwap={props.isSameChainSwap}
              selectedChainConfig={chainConfig}
              selectedToken={props.token}
              sourceToken={props.sourceToken}
              isSource={props.isSource}
              wallet={props.wallet}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSelectToken={(key: Token) => {
                props.setToken(key);
                popupState.close();
              }}
            />
          )}
        </Popover>
      )}
    </>
  );
};

export default AssetPicker;
