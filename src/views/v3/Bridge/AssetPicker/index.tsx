import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, TextField, Tooltip, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import Typography from '@mui/material/Typography';
import type { Chain, routes } from '@wormhole-foundation/sdk';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import config from 'config';
import type { ChainConfig } from 'config/types';
import type { RootState } from 'store';
import type { WalletData } from 'store/wallet';
import { isDisabledChain, setAmount } from 'store/transferInput';
import type { Balances } from 'utils/wallet/types';
import AssetBadge from 'components/AssetBadge';
import type { Token } from 'config/tokens';
import { useTokens } from 'contexts/TokensContext';
import { useTokenList } from 'hooks/useTokenList';
import { TransferWallet } from 'utils/wallet';
import WalletController from 'views/v3/Bridge/WalletConnector/Controller';
import AmountInput from '../AmountInput';
import type { AmountValidationResult } from 'hooks/useAmountValidation';
import { OPACITY } from 'utils/style';
import Color from 'color';
import AssetPickerDrawer from 'views/v3/Bridge/AssetPicker/PickerBottomSheet';
import AssetPickerPopover from 'views/v3/Bridge/AssetPicker/PickerModal';
import { calculateUSDPrice, getTokenSymbol } from 'utils';
import { formatWithCommas } from 'utils/formatNumber';

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
  isSameChainSwap: boolean;
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
  const theme: any = useTheme();
  const dispatch = useDispatch();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { amount } = useSelector((state: RootState) => state.transferInput);
  const { getTokenPrice } = useTokens();

  const [showChainSearch, setShowChainSearch] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [amountInput, setAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );
  const [debouncedAmountInput, setDebouncedAmountInput] = useState(
    amount ? sdkAmount.display(amount) : '',
  );
  const [selectedPercentButton, setSelectedPercentButton] = useState(0);

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

  const tokenBalanceDisplay = useMemo(() => {
    if (!tokenBalance) {
      return null;
    }
    const displayValue = `${sdkAmount.display(tokenBalance)} ${
      props.token ? getTokenSymbol(props.token) : ''
    }`;
    return (
      <Typography
        component="div"
        sx={{
          color: theme.palette.text.secondary + OPACITY[50],
          fontSize: '12px',
          fontWeight: 500,
          maxWidth: '240px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {displayValue}
      </Typography>
    );
  }, [props.token, theme.palette.text.secondary, tokenBalance]);

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
    return (
      <Tooltip
        title={props.token ? getTokenSymbol(props.token) : 'Select a token'}
      >
        <Typography
          component="div"
          fontSize="16px"
          fontWeight={500}
          maxWidth="64px"
          noWrap
        >
          {props.token ? getTokenSymbol(props.token) : 'Select'}
        </Typography>
      </Tooltip>
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
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      selector: {
        cursor: 'pointer',
        borderRadius: '50px',
        border: `1px solid ${theme.palette.input.border}`,
        background: Color(theme.palette.input.background).darken(0.2).hex(),
        minWidth: '120px',
        '&:hover': {
          borderColor: theme.palette.primary.main,
        },
      },
      cardContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '8px',
        paddingRight: '12px',
        paddingTop: '6px',
        paddingBottom: '6px',
        ':last-child': {
          paddingLeft: '8px',
          paddingRight: '12px',
          paddingTop: '6px',
          paddingBottom: '6px',
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
      percentButton: {
        borderRadius: '50px',
        color: theme.palette.text.primary,
        height: '22px',
        minWidth: '40px',
        backgroundColor: theme.palette.text.primary + OPACITY[10],
        opacity: 0.7,
      },
      percentButtonSelected: {
        color: theme.palette.background.form,
        backgroundColor: theme.palette.primary.main,
        opacity: 'unset',
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

  const receiveAmountText = receiveAmount ? receiveAmount.toString() : '';

  const tokenPrice = useMemo(() => {
    const tokenAmount = props.isSource
      ? amount
      : props.quote?.destinationToken.amount;
    if (props.token && tokenAmount) {
      return calculateUSDPrice(getTokenPrice, tokenAmount, props.token);
    }
    return null;
  }, [
    props.isSource,
    props.quote?.destinationToken.amount,
    props.token,
    amount,
    getTokenPrice,
  ]);

  const amountUSDValue =
    props.token && tokenPrice ? (
      <Typography color={theme.palette.text.secondary} fontSize="12px">
        {tokenPrice ?? null}
      </Typography>
    ) : null;

  const handleAmountChange = useCallback((newValue: string): void => {
    setAmountInput(newValue);
    setSelectedPercentButton(0); // Reset selected percent button when amount changes
  }, []);

  const handleDebouncedAmountChange = useCallback(
    (newValue: string): void => {
      dispatch(setAmount(newValue));
      setDebouncedAmountInput(newValue);
    },
    [dispatch],
  );

  const handleChainSelect = useCallback(
    (chain: Chain) => {
      props.setChain(chain);
      setSearchQuery('');
    },
    [props],
  );

  const handleTokenSelect = useCallback(
    (token: Token) => {
      if (props.isSource && props.token?.key !== token.key) {
        // Reset amount when source token is changed
        handleAmountChange('');
        handleDebouncedAmountChange('');
      }
      props.setToken(token);
    },
    [handleAmountChange, handleDebouncedAmountChange, props],
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
        sx={{
          ...styles.percentButton,
          ...(selectedPercentButton === percent
            ? styles.percentButtonSelected
            : {}),
        }}
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
            setSelectedPercentButton(percent);
          }
        }}
      >
        <Typography fontSize={12} fontWeight={600} textTransform="none">
          {percent === 100 ? 'Max' : `${percent}%`}
        </Typography>
      </Button>
    ),
    [
      styles.percentButton,
      styles.percentButtonSelected,
      selectedPercentButton,
      props.isTransactionInProgress,
      tokenBalance,
      handleAmountChange,
      handleDebouncedAmountChange,
    ],
  );

  const destTokenUnitPrice = useMemo(() => {
    if (!props.token) {
      return null;
    }
    const unitPrice = calculateUSDPrice(
      getTokenPrice,
      sdkAmount.parse('1', props.token.decimals),
      props.token,
    );

    if (!unitPrice) {
      return null;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Typography
          color={theme.palette.text.secondary + OPACITY[50]}
          fontSize="12px"
          fontWeight={500}
        >{`1 ${getTokenSymbol(props.token)} = ${unitPrice}`}</Typography>
      </Box>
    );
  }, [props.token, getTokenPrice, theme.palette.text.secondary]);

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
      <Box sx={styles.container}>
        <Box sx={styles.title}>
          <Typography fontSize={12} fontWeight={500} variant="body2">
            {props.isSource ? 'From' : 'To'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {tokenBalanceDisplay}
            <WalletController
              type={
                props.isSource
                  ? TransferWallet.SENDING
                  : TransferWallet.RECEIVING
              }
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Card
            sx={[
              styles.selector,
              props.isTransactionInProgress && styles.disabled,
            ]}
            data-testid={props.dataTestId}
            role="button"
            aria-label={
              props.isSource
                ? 'Select source asset'
                : 'Select destination asset'
            }
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
          {props.isSource ? (
            <AmountInput
              value={amountInput}
              debouncedValue={debouncedAmountInput}
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
                    maxLength: 22,
                    style: {
                      // Shrink the font size based on the length of the input value
                      fontSize:
                        receiveAmountText.length > 12
                          ? '20px'
                          : receiveAmountText.length > 6
                          ? '28px'
                          : '36px',
                      height: '36px',
                      textAlign: 'right',
                    },
                  },
                  input: {
                    disableUnderline: true,
                  },
                }}
                variant="standard"
                value={formatWithCommas(receiveAmountText)}
              />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            height: '22px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {<Box>{!props.isSource && destTokenUnitPrice}</Box>}
          {props.isSource ? (
            <Box>{percentButtons}</Box>
          ) : (
            <Box>{amountUSDValue}</Box>
          )}
        </Box>
      </Box>
      {mobile ? (
        <AssetPickerDrawer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          chainList={props.chainList}
          chainConfig={chainConfig}
          showChainSearch={showChainSearch}
          setShowChainSearch={setShowChainSearch}
          wallet={props.wallet}
          sortedTokens={sortedTokens}
          balances={props.balances}
          isFetchingBalances={props.isFetchingBalances}
          isConnectingWallet={props.isConnectingWallet}
          isFetchingTokens={props.isFetchingTokens}
          isSameChainSwap={props.isSameChainSwap}
          token={props.token}
          sourceToken={props.sourceToken}
          isSource={props.isSource}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onChainSelect={handleChainSelect}
          onTokenSelect={(token: Token) => {
            handleTokenSelect(token);
            setIsDrawerOpen(false);
          }}
        />
      ) : (
        <AssetPickerPopover
          popupState={popupState}
          anchorEl={props.anchorEl}
          chainList={props.chainList}
          chainConfig={chainConfig}
          showChainSearch={showChainSearch}
          setShowChainSearch={setShowChainSearch}
          wallet={props.wallet}
          sortedTokens={sortedTokens}
          balances={props.balances}
          isFetchingBalances={props.isFetchingBalances}
          isConnectingWallet={props.isConnectingWallet}
          isFetchingTokens={props.isFetchingTokens}
          isSameChainSwap={props.isSameChainSwap}
          token={props.token}
          sourceToken={props.sourceToken}
          isSource={props.isSource}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onChainSelect={handleChainSelect}
          onTokenSelect={(token: Token) => {
            handleTokenSelect(token);
            popupState.close();
          }}
        />
      )}
    </Box>
  );
}

export default memo(AssetPicker);
