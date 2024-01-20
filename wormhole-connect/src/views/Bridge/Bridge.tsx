import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { BigNumber } from 'ethers';

import { RootState } from 'store';
import {
  setReceiverNativeBalance,
  setReceiveAmount,
  setDestToken,
  setToken,
  setSupportedSourceTokens,
  setSupportedDestTokens,
  setAllSupportedDestTokens,
  TransferInputState,
  getNativeVersionOfToken,
  setFetchingReceiveAmount,
  setReceiveAmountError,
} from 'store/transferInput';
import { CHAINS, TOKENS, pageHeader, showHamburgerMenu } from 'config';
import { TokenConfig } from 'config/types';
import { getTokenDecimals, getWrappedToken } from 'utils';
import { wh, toChainId } from 'utils/sdk';
import { joinClass } from 'utils/style';
import { toDecimals } from 'utils/balance';
import { isTransferValid, useValidate } from 'utils/transferValidation';
import useConfirmBeforeLeaving from 'utils/confirmBeforeLeaving';
import RouteOperator from 'routes/operator';

import GasSlider from './NativeGasSlider';
import Preview from './Preview';
import Send from './Send';
import { Collapse, useTheme } from '@mui/material';
import PageHeader from 'components/PageHeader';
import FromInputs from './Inputs/From';
import ToInputs from './Inputs/To';
import TransferLimitedWarning from './TransferLimitedWarning';
import SwapChains from './SwapChains';
import RouteOptions from './RouteOptions';
import ValidationError from './ValidationError';
import PoweredByIcon from 'icons/PoweredBy';
import FooterNavBar from 'components/FooterNavBar';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { ETHBridge } from 'routes/porticoBridge/ethBridge';
import { wstETHBridge } from 'routes/porticoBridge/wstETHBridge';
import { usePorticoSwapInfo } from 'hooks/usePorticoSwapInfo';
import { usePorticoRelayerFee } from 'hooks/usePorticoRelayerFee';
import { useFetchTokenPrices } from 'hooks/useFetchTokenPrices';

const useStyles = makeStyles()((_theme) => ({
  spacer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bridgeContent: {
    margin: 'auto',
    maxWidth: '650px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  poweredBy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
}));

function isSupportedToken(
  token: string,
  supportedTokens: TokenConfig[],
): boolean {
  if (!token) return true;
  return supportedTokens.some((t) => t.key === token);
}

function Bridge() {
  const { classes } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const {
    showValidationState,
    validations,
    fromChain,
    toChain,
    token,
    destToken,
    route,
    isTransactionInProgress,
    amount,
  }: TransferInputState = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const portico = useSelector((state: RootState) => state.porticoBridge);
  const { receiving } = useSelector((state: RootState) => state.wallet);

  // Warn user before closing tab if transaction has begun
  useConfirmBeforeLeaving(isTransactionInProgress);

  // check destination native balance
  useEffect(() => {
    if (!fromChain || !toChain || !receiving.address) return;
    const chainConfig = CHAINS[toChain]!;
    wh.getNativeBalance(receiving.address, toChain).then((res: BigNumber) => {
      const tokenConfig = TOKENS[chainConfig.gasToken];
      if (!tokenConfig)
        throw new Error('Could not get native gas token config');
      const decimals = getTokenDecimals(
        toChainId(tokenConfig.nativeChain),
        'native',
      );
      dispatch(setReceiverNativeBalance(toDecimals(res, decimals, 6)));
    });
  }, [fromChain, toChain, receiving.address, dispatch]);

  useEffect(() => {
    const computeSrcTokens = async () => {
      const supported = await RouteOperator.allSupportedSourceTokens(
        TOKENS[destToken],
        fromChain,
        toChain,
      );
      dispatch(setSupportedSourceTokens(supported));
      const selectedIsSupported = isSupportedToken(token, supported);
      if (!selectedIsSupported) {
        dispatch(setToken(''));
      }
      if (supported.length === 1 && token === '') {
        dispatch(setToken(supported[0].key));
      }
    };
    computeSrcTokens();
    // IMPORTANT: do not include token in dependency array
  }, [route, fromChain, destToken, dispatch]);

  useEffect(() => {
    const computeDestTokens = async () => {
      const supported = await RouteOperator.allSupportedDestTokens(
        TOKENS[token],
        fromChain,
        toChain,
      );
      dispatch(setSupportedDestTokens(supported));
      const allSupported = await RouteOperator.allSupportedDestTokens(
        undefined,
        fromChain,
        toChain,
      );
      dispatch(setAllSupportedDestTokens(allSupported));
      if (toChain && supported.length === 1) {
        dispatch(setDestToken(supported[0].key));
      }

      // If all the supported tokens are the same token
      // select the native version for applicable tokens
      const symbols = supported.map((t) => t.symbol);
      if (
        toChain &&
        symbols.every((s) => s === symbols[0]) &&
        ['USDC', 'tBTC'].includes(symbols[0])
      ) {
        const key = supported.find(
          (t) =>
            t.symbol === symbols[0] &&
            t.nativeChain === t.tokenId?.chain &&
            t.nativeChain === toChain,
        )?.key;
        if (key) {
          dispatch(setDestToken(key));
        }
      }

      // If the source token is supported by a Portico bridge route,
      // then select the native version on the dest chain
      if (
        token &&
        destToken === '' &&
        toChain &&
        (!route || isPorticoRoute(route))
      ) {
        const tokenSymbol = TOKENS[token]?.symbol;
        const porticoTokens = [
          ...ETHBridge.SUPPORTED_TOKENS,
          ...wstETHBridge.SUPPORTED_TOKENS,
        ];
        if (porticoTokens.includes(tokenSymbol)) {
          let key = getNativeVersionOfToken(tokenSymbol, toChain);
          if (!key) {
            const wrapped = getWrappedToken(TOKENS[token]);
            key = getNativeVersionOfToken(wrapped.symbol, toChain);
          }
          if (key && isSupportedToken(key, supported)) {
            dispatch(setDestToken(key));
          }
        }
      }
    };
    computeDestTokens();
    // IMPORTANT: do not include destToken in dependency array
  }, [route, token, fromChain, toChain, dispatch]);

  useEffect(() => {
    const recomputeReceive = async () => {
      if (!route) return;
      try {
        const routeOptions = isPorticoRoute(route)
          ? portico
          : { toNativeToken, relayerFee };
        dispatch(setFetchingReceiveAmount());
        const newReceiveAmount = await RouteOperator.computeReceiveAmount(
          route,
          Number.parseFloat(amount),
          token,
          destToken,
          fromChain,
          toChain,
          routeOptions,
        );
        dispatch(setReceiveAmount(newReceiveAmount.toString()));
      } catch (e: any) {
        dispatch(setReceiveAmountError(e.message));
      }
    };
    recomputeReceive();
  }, [
    amount,
    toNativeToken,
    relayerFee,
    route,
    token,
    destToken,
    toChain,
    fromChain,
    portico,
    dispatch,
  ]);

  // Route specific hooks
  usePorticoSwapInfo();
  usePorticoRelayerFee();
  useFetchTokenPrices();

  // validate transfer inputs
  useValidate();
  const valid = isTransferValid(validations);
  const disabled = !valid || isTransactionInProgress;
  // if the dest token is the wrapped gas token, then disable the gas slider,
  // because it will be unwrapped by the relayer contract
  const toChainConfig = toChain ? CHAINS[toChain] : undefined;
  const gasTokenConfig = toChainConfig
    ? TOKENS[toChainConfig.gasToken]
    : undefined;
  const wrappedGasTokenConfig = gasTokenConfig
    ? getWrappedToken(gasTokenConfig)
    : undefined;
  const willReceiveGasToken =
    wrappedGasTokenConfig && destToken === wrappedGasTokenConfig.key;

  const showGasSlider =
    route &&
    RouteOperator.getRoute(route).NATIVE_GAS_DROPOFF_SUPPORTED &&
    !willReceiveGasToken;

  const showRouteValidation =
    !!fromChain && !!toChain && !!token && !!destToken && !!amount;

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      <PageHeader
        title={pageHeader.text}
        align={pageHeader.align}
        showHamburgerMenu={showHamburgerMenu}
      />
      <FromInputs />
      <SwapChains />
      <ToInputs />

      <ValidationError
        forceShow={showRouteValidation}
        validations={[validations.route]}
        margin="12px 0 0 0"
      />

      <RouteOptions />
      <Collapse in={valid && showValidationState}>
        <div className={classes.spacer}>
          <Collapse
            in={showGasSlider}
            sx={
              !showGasSlider
                ? { marginBottom: '-16px', transition: 'margin 0.4s' }
                : {}
            }
          >
            {showGasSlider && <GasSlider disabled={disabled} />}
          </Collapse>

          <Preview collapsed={!showValidationState ? true : !valid} />

          <TransferLimitedWarning fromChain={fromChain} token={token} />

          <Send valid={!!valid} />
        </div>
      </Collapse>
      {showHamburgerMenu ? null : <FooterNavBar />}

      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
}

export default Bridge;
