import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, TextField, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import Typography from '@mui/material/Typography';
import type { Chain, routes } from '@wormhole-foundation/sdk';
import { amount as sdkAmount, isSameToken } from '@wormhole-foundation/sdk';

import config from 'config';
import type { ChainConfig } from 'config/types';
import type { RootState } from 'store';
import type { WalletData } from 'store/wallet';
import { isDisabledChain, setAmount } from 'store/transferInput';
import type { Balances } from 'utils/wallet/types';
import type { Token } from 'config/tokens';
import { useTokens } from 'contexts/TokensContext';
import { useTokenList } from 'hooks/useTokenList';
import { TransferWallet } from 'utils/wallet';
import WalletController from 'views/v3/Bridge/WalletConnector/Controller';
import AmountInput from '../AmountInput';
import type { AmountValidationResult } from 'hooks/useAmountValidation';
import { OPACITY } from 'utils/style';
import AssetPickerDrawer from 'views/v3/Bridge/AssetPicker/PickerBottomSheet';
import AssetPickerPopover from 'views/v3/Bridge/AssetPicker/PickerModal';
import { formatNumberIntl, formatMaxDigits } from 'utils/formatNumber';
import { calculateUSDPrice, getTokenDisplaySymbolByTokenAddress } from 'utils';
import {
  handleTelemetryOnChainSelect,
  handleTelemetryOnTokenSelect,
} from 'telemetry/utils';
import FeeOffset from './FeeOffset';
import { calculateFeeOffset } from 'utils/fees';
import { getGasReserve } from 'utils/gasReserve';
import { getGasToken } from 'utils';
import { useGetTokens } from 'hooks/useGetTokens';
import TokenPickerButton from './TokenPickerButton';
import PercentButtons from './PercentButtons';

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
  const { amount, route: selectedRoute } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { sourceToken, destToken } = useGetTokens();
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
    const formattedBalance = formatMaxDigits(
      sdkAmount.display(tokenBalance),
      9, // Max total digits
      4, // Max decimal places
    );
    const displayValue = `${formattedBalance} ${
      props.token ? getTokenDisplaySymbolByTokenAddress(props.token) : ''
    }`;
    return (
      <Typography
        component="div"
        sx={{
          color: theme.palette.text.tertiary,
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
  }, [props.token, theme.palette.text.tertiary, tokenBalance]);

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

  const triggerProps = bindTrigger(popupState);

  const styles = useMemo(
    () => ({
      root: {
        maxWidth: '488px',
        background: theme.palette.input.background,
        borderRadius: '8px',
        padding: '16px',
      },
      container: {
        display: 'flex',
        flexDirection: 'column',
        height: '114px',
        maxWidth: '488px',
      },
      title: {
        color: theme.palette.text.secondary,
        display: 'flex',
        height: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
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

  const handleAmountChange = useCallback(
    (newValue: string): void => {
      setAmountInput(newValue);
      setSelectedPercentButton(0); // Reset selected percent button when amount changes

      if (!newValue) {
        // If the input is cleared, we need to clear the amount in handleAmountChange instead of handleDebouncedAmountChange.
        // This case is important when user switches the token selection, which results in clearing the amount.
        // If we do this in handleDebouncedAmountChange, it will get a new quote for the previous amount before clearing it
        // and may cause the received amount to set to that quoted amount after user clears the input.
        dispatch(setAmount(newValue));
      }
    },
    [dispatch],
  );

  const handleDebouncedAmountChange = useCallback(
    (newValue: string): void => {
      setDebouncedAmountInput(newValue);
      if (newValue) {
        // Only update the amount in the store if the input is not empty
        // When the amount is cleared, it is handled in handleAmountChange
        // Please see the comments in handleAmountChange for more details.
        dispatch(setAmount(newValue));
      }
    },
    [dispatch],
  );

  const handleChainSelect = useCallback(
    (chain: Chain) => {
      handleTelemetryOnChainSelect(chain, props.isSource);
      props.setChain(chain);
      setSearchQuery('');
    },
    [props],
  );

  const handleTokenSelect = useCallback(
    (token: Token) => {
      handleTelemetryOnTokenSelect(token, props.isSource);
      handleTelemetryOnChainSelect(token.chain, props.isSource);
      if (props.isSource && props.token?.key !== token.key) {
        // Reset amount when source token is changed
        handleAmountChange('');
        handleDebouncedAmountChange('');
      }
      props.setToken(token);
    },
    [handleAmountChange, handleDebouncedAmountChange, props],
  );

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

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

  // Adjust amount when route changes if user had clicked Max button previously
  // This handles both cases:
  // 1. Switching from non-fee-offset route to fee-offset route: deduct fee offset
  // 2. Switching from fee-offset route to non-fee-offset route: restore full balance
  useEffect(() => {
    if (
      selectedPercentButton !== 100 || // Only adjust if user had clicked "Max"
      !props.isSource || // Only adjust for source asset picker
      !props.chain ||
      !tokenBalance ||
      !amount ||
      !selectedRoute ||
      !sourceToken ||
      !destToken
    ) {
      return;
    }

    const currentAmountUnits = sdkAmount.units(amount);
    let maxAmountUnits = sdkAmount.units(tokenBalance);

    // Check if source token is the gas token for gas reserve deduction
    let isGasToken = false;
    try {
      const gasToken = getGasToken(props.chain);
      isGasToken = isSameToken(sourceToken, gasToken);
    } catch {
      // Gas token not configured for this chain
    }

    // Deduct gas reserve if applicable
    if (isGasToken) {
      const gasReserve = getGasReserve(props.chain);
      if (gasReserve) {
        const gasReserveUnits = sdkAmount.units(gasReserve);
        // Only deduct if user has sufficient balance
        if (maxAmountUnits > gasReserveUnits) {
          maxAmountUnits -= gasReserveUnits;
        }
        // Do not deduct if balance <= gas reserve
      }
    }

    // Calculate fee offset for the new route
    const feeOffset = calculateFeeOffset(
      config.routes.get(selectedRoute),
      tokenBalance,
      sourceToken,
      destToken,
    );

    if (feeOffset) {
      // Case 1: New route has fee offset AND adjusted max amount is smaller than current amount -> deduct it from max amount
      const adjustedMaxAmount = maxAmountUnits - sdkAmount.units(feeOffset);
      if (adjustedMaxAmount < currentAmountUnits) {
        const displayAmount = sdkAmount.display(
          sdkAmount.fromBaseUnits(adjustedMaxAmount, tokenBalance.decimals),
        );
        setAmountInput(displayAmount);
        setDebouncedAmountInput(displayAmount);
        dispatch(setAmount(displayAmount));
      }
    } else if (currentAmountUnits < maxAmountUnits) {
      // Case 2: New route has no fee offset AND the amount is smaller than max -> restore full balance (minus gas reserve)
      const displayAmount = sdkAmount.display(
        sdkAmount.fromBaseUnits(maxAmountUnits, tokenBalance.decimals),
      );
      setAmountInput(displayAmount);
      setDebouncedAmountInput(displayAmount);
      dispatch(setAmount(displayAmount));
    }
    // Re-run only when selectedRoute changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute]);

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
        >{`1 ${getTokenDisplaySymbolByTokenAddress(
          props.token,
        )} = ${unitPrice}`}</Typography>
      </Box>
    );
  }, [props.token, getTokenPrice, theme.palette.text.secondary]);

  const percentButtons =
    !props.wallet.address || !tokenBalance ? null : (
      <PercentButtons
        tokenBalance={tokenBalance}
        chain={props.chain}
        isTransactionInProgress={props.isTransactionInProgress}
        selectedPercent={selectedPercentButton}
        onAmountChange={handleAmountChange}
        onDebouncedAmountChange={handleDebouncedAmountChange}
        onPercentSelect={setSelectedPercentButton}
      />
    );

  return (
    <Box sx={styles.root}>
      <Box sx={styles.container}>
        <Box sx={styles.title}>
          <Typography
            color={theme.palette.text.tertiary}
            fontSize={12}
            fontWeight={500}
            variant="body2"
          >
            {props.isSource ? 'From' : 'To'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
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
            alignItems: 'center',
            marginBottom: props.isSource ? 0 : '16px',
          }}
        >
          <TokenPickerButton
            isTransactionInProgress={props.isTransactionInProgress}
            isSource={props.isSource}
            dataTestId={props.dataTestId}
            triggerProps={triggerProps}
            chainConfig={chainConfig}
            token={props.token}
            openDrawer={openDrawer}
          />
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
                height: '38px',
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
                value={formatNumberIntl(receiveAmountText)}
              />
            </Box>
          )}
        </Box>
        {props.isSource && <FeeOffset />}
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

export default React.memo(AssetPicker);
