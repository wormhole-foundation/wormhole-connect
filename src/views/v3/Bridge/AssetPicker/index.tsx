import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Stack, TextField, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
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
import { Chain, routes, amount as sdkAmount } from '@wormhole-foundation/sdk';

import config from 'config';
import type { ChainConfig } from 'config/types';
import type { RootState } from 'store';
import type { WalletData } from 'store/wallet';
import { isDisabledChain, setAmount } from 'store/transferInput';
import { Balances } from 'utils/wallet/types';
import ChainList from './ChainList';
import TokenList from './TokenList';
import AssetBadge from 'components/AssetBadge';
import { Token } from 'config/tokens';
import { useTokenList } from 'hooks/useTokenList';
import { TransferWallet } from 'utils/wallet';
import WalletController from 'views/v3/Bridge/WalletConnector/Controller';
import AmountInput from '../AmountInput';
import { AmountValidationResult } from 'hooks/useAmountValidation';
import { OPACITY } from 'utils/style';
import Color from 'color';

type Props = {
  chain?: Chain | undefined;
  chainList: Array<ChainConfig>;
  token?: Token;
  sourceToken?: Token;
  tokenList?: Array<Token> | undefined;
  isFetchingQuotes?: boolean;
  isFetchingTokens?: boolean;
  setToken: (value: Token) => void;
  setChain: (value: Chain) => void;
  wallet: WalletData;
  isSource: boolean;
  isTransactionInProgress: boolean;
  dataTestId?: string;
  balances: Balances;
  isFetchingBalances: boolean;
  isConnectingWallet?: boolean;
  amountValidation?: AmountValidationResult;
  quote?: routes.Quote<routes.Options> | undefined;
  anchorEl: HTMLElement | null;
};

function AssetPicker(props: Props) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { amount } = useSelector((state: RootState) => state.transferInput);

  const [showChainSearch, setShowChainSearch] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [amountInput, setAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );
  const [debouncedAmountInput, setDebouncedAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );

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

  const tokenBalance = useMemo(() => {
    if (props.isSource && props.balances && props.token) {
      return props.balances[props.token.key]?.balance;
    }
    return null;
  }, [props.isSource, props.balances, props.token]);

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
    const tokenDisplay = props.token ? <>{props.token.display}</> : <>Select</>;

    return (
      <div>
        <Typography
          component={'div'}
          fontSize={16}
          fontWeight={500}
          sx={{
            display: 'flex',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tokenDisplay}
        </Typography>
      </div>
    );
  }, [props.token]);

  const triggerProps =
    props.isTransactionInProgress || mobile ? {} : bindTrigger(popupState);

  const styles = useMemo(
    () => ({
      root: {
        maxWidth: '420px',
        background: theme.palette.input.background,
        borderRadius: '8px',
        padding: '16px',
      },
      container: {
        display: 'flex',
        flexDirection: 'column',
        height: '114px',
        maxWidth: '452px',
        gap: '16px',
      },
      title: {
        color: theme.palette.text.secondary,
        display: 'flex',
        height: '12px',
        justifyContent: 'space-between',
      },
      selector: {
        height: '50px',
        width: '138px',
        cursor: 'pointer',
        borderRadius: '50px',
        border: `1px solid ${theme.palette.input.border}`,
        background: Color(theme.palette.input.background).darken(0.2).hex(),
      },
      cardContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px',
        ':last-child': {
          padding: '6px',
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
      popoverSlot: {
        width: '100%',
        maxWidth: '420px',
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
      percentButton: {
        borderRadius: '50px',
        color: theme.palette.text.primary,
        height: '24px',
        minWidth: '40px',
        backgroundColor: theme.palette.text.primary + OPACITY[10],
        opacity: 0.7,
      },
    }),
    [theme],
  );

  // If the amount input is empty, we don't need to check the quote which may be for the previous amount
  const receiveAmount =
    !amount || amount.amount === '' || amount.amount === '0'
      ? 0
      : props.quote
      ? sdkAmount.whole(props.quote?.destinationToken.amount)
      : undefined;

  const balance =
    !props.isSource || !props.wallet.address ? null : (
      <Typography color={theme.palette.text.secondary} variant="body2">
        {tokenBalance
          ? sdkAmount.display(sdkAmount.truncate(tokenBalance, 6))
          : '0'}
      </Typography>
    );

  const handleAmountChange = useCallback((newValue: string): void => {
    setAmountInput(newValue);
  }, []);

  const handleDebouncedAmountChange = useCallback(
    (newValue: string): void => {
      dispatch(setAmount(newValue));
      setDebouncedAmountInput(newValue);
    },
    [dispatch],
  );

  // Clear the amount input value if the amount is reset outside of this component
  // This can happen if user swaps selected source and destination assets.
  useEffect(() => {
    if (!amount && (amountInput || debouncedAmountInput)) {
      handleAmountChange('');
      handleDebouncedAmountChange('');
    }
    // We should run this sife-effect only when the amount changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const renderPercentButton = useCallback(
    (percent: number) => (
      <Button
        sx={styles.percentButton}
        disabled={props.isTransactionInProgress}
        onClick={() => {
          if (tokenBalance) {
            const balancePercent =
              (sdkAmount.units(tokenBalance) * BigInt(percent)) / BigInt(100);
            const displayAmount = sdkAmount.display(
              sdkAmount.fromBaseUnits(balancePercent, tokenBalance.decimals),
            );
            handleAmountChange(displayAmount);
            handleDebouncedAmountChange(displayAmount);
          }
        }}
      >
        <Typography fontSize={12} fontWeight={500} textTransform="none">
          {percent === 100 ? 'Max' : `${percent}%`}
        </Typography>
      </Button>
    ),
    [
      handleAmountChange,
      handleDebouncedAmountChange,
      props.isTransactionInProgress,
      tokenBalance,
      styles.percentButton,
    ],
  );

  const percentButtons =
    !props.wallet.address || !tokenBalance ? null : (
      <Box sx={{ display: 'flex', gap: '6px' }}>
        {renderPercentButton(25)}
        {renderPercentButton(50)}
        {renderPercentButton(100)}
      </Box>
    );

  return (
    <Box sx={styles.root}>
      <Backdrop open={popupState.isOpen} sx={styles.backdrop} />
      <Box sx={styles.container}>
        <Box sx={styles.title}>
          <Typography fontSize={12} variant="body2">
            {props.isSource ? 'From' : 'To'}
          </Typography>
          <WalletController
            type={
              props.isSource ? TransferWallet.SENDING : TransferWallet.RECEIVING
            }
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: props.isSource ? '0' : '16px',
          }}
        >
          {props.isSource ? (
            <AmountInput
              value={amountInput}
              debauncedValue={debouncedAmountInput}
              receiveAmount={receiveAmount}
              supportedSourceTokens={props.tokenList || []}
              tokenBalance={
                props.token ? props.balances[props.token.key]?.balance : null
              }
              warning={props.amountValidation?.warning}
              error={props.amountValidation?.error}
              onChange={handleAmountChange}
              onDebouncedChange={handleDebouncedAmountChange}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignContent: 'center',
                alignItems: 'center',
                width: '100%',
                maxWidth: '250px',
                height: '50px',
              }}
            >
              <TextField
                fullWidth
                disabled
                placeholder="0"
                slotProps={{
                  htmlInput: {
                    style: {
                      fontSize: '36px',
                      height: '36px',
                    },
                  },
                  input: {
                    disableUnderline: true,
                  },
                }}
                variant="standard"
                value={receiveAmount}
              />
            </Box>
          )}
          <Card
            sx={[
              styles.selector,
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
            </CardContent>
          </Card>
        </Box>
        {props.isSource && (
          <Box
            sx={{
              height: '24px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Box>{balance}</Box>
            <Box>{percentButtons}</Box>
          </Box>
        )}
      </Box>
      {mobile ? (
        <SwipeableDrawer
          anchor="bottom"
          open={isDrawerOpen}
          slotProps={{
            paper: {
              sx: styles.drawer,
            },
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
              isConnectingWallet={props.isConnectingWallet}
              isFetching={props.isFetchingTokens}
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
          anchorEl={props.anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
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
              balances={props.balances}
              isFetchingBalances={props.isFetchingBalances}
              isConnectingWallet={props.isConnectingWallet}
              isFetching={props.isFetchingTokens}
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
    </Box>
  );
}

export default React.memo(AssetPicker);
