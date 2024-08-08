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
  showManualAddressInput,
} from 'store/transferInput';
import config from 'config';
import { TokenConfig } from 'config/types';
import { getTokenDecimals, getWrappedToken } from 'utils';
import { toChainId } from 'utils/sdk';
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
import { Alignment } from 'components/Header';
import FooterNavBar from 'components/FooterNavBar';
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { ETHBridge } from 'routes/porticoBridge/ethBridge';
import { wstETHBridge } from 'routes/porticoBridge/wstETHBridge';
import { usePorticoSwapInfo } from 'hooks/usePorticoSwapInfo';
import { usePorticoRelayerFee } from 'hooks/usePorticoRelayerFee';
import { useFetchTokenPrices } from 'hooks/useFetchTokenPrices';
import NttInboundCapacityWarning from './NttInboundCapacityWarning';
import { isNttRoute } from 'routes/utils';
import { useConnectToLastUsedWallet } from 'utils/wallet';
import { USDTBridge } from 'routes/porticoBridge/usdtBridge';
import { isAutomatic } from 'utils/route';

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
    manualAddressTarget,
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
    if (!fromChain || !toChain || !receiving.address) {
      return;
    }

    const chainConfig = config.chains[toChain]!;

    config.wh
      .getNativeBalance(receiving.address, toChain)
      .then((res: BigNumber) => {
        const tokenConfig = config.tokens[chainConfig.gasToken];
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
    if (!fromChain) {
      return;
    }

    let active = true;

    const computeSrcTokens = async () => {
      const supported = await RouteOperator.allSupportedSourceTokens(
        config.tokens[destToken],
        fromChain,
        toChain,
      );
      if (active) {
        dispatch(setSupportedSourceTokens(supported));
        const selectedIsSupported = isSupportedToken(token, supported);
        if (!selectedIsSupported) {
          dispatch(setToken(''));
        }
        if (supported.length === 1 && token === '') {
          dispatch(setToken(supported[0].key));
        }
      }
    };

    computeSrcTokens();

    return () => {
      active = false;
    };
    // IMPORTANT: do not include token in dependency array
  }, [route, fromChain, destToken, dispatch]);

  useEffect(() => {
    if (!toChain) {
      return;
    }

    let canceled = false;

    const computeDestTokens = async () => {
      let supported = await RouteOperator.allSupportedDestTokens(
        config.tokens[token],
        fromChain,
        toChain,
      );
      if (token) {
        // If any of the tokens are native to the chain, only select those.
        // This is to avoid users inadvertently receiving wrapped versions of the token.
        const nativeTokens = supported.filter((t) => t.nativeChain === toChain);
        if (nativeTokens.length > 0) {
          supported = nativeTokens;
        }
      }
      dispatch(setSupportedDestTokens(supported));
      const allSupported = await RouteOperator.allSupportedDestTokens(
        undefined,
        fromChain,
        toChain,
      );
      dispatch(setAllSupportedDestTokens(allSupported));
      if (toChain && supported.length === 1) {
        if (!canceled) {
          dispatch(setDestToken(supported[0].key));
        }
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
        if (!canceled && key) {
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
        const tokenSymbol = config.tokens[token]?.symbol;
        const porticoTokens = [
          ...ETHBridge.SUPPORTED_TOKENS,
          ...wstETHBridge.SUPPORTED_TOKENS,
          ...USDTBridge.SUPPORTED_TOKENS,
        ];
        if (porticoTokens.includes(token)) {
          let key = getNativeVersionOfToken(tokenSymbol, toChain);
          if (!key) {
            const wrapped = getWrappedToken(config.tokens[token]);
            key = getNativeVersionOfToken(wrapped.symbol, toChain);
          }
          if (!canceled && key && isSupportedToken(key, supported)) {
            dispatch(setDestToken(key));
          }
        }
      }
    };

    computeDestTokens();

    return () => {
      canceled = true;
    };
    // IMPORTANT: do not include destToken in dependency array
  }, [route, token, fromChain, toChain, dispatch]);

  useEffect(() => {
    if (!route || !amount || !token || !destToken || !fromChain || !toChain) {
      return;
    }

    const recomputeReceive = async () => {
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

  // reset manual input to the config value if the entry point is the bridge flow
  useEffect(() => {
    dispatch(showManualAddressInput(!!config.manualTargetAddress));
  }, [dispatch]);

  // Route specific hooks
  usePorticoSwapInfo();
  usePorticoRelayerFee();
  useFetchTokenPrices();
  useConnectToLastUsedWallet();

  // validate transfer inputs
  useValidate();
  const valid = isTransferValid(validations);
  const disabled = !valid || isTransactionInProgress;
  // if the dest token is the wrapped gas token, then disable the gas slider,
  // because it will be unwrapped by the relayer contract
  const toChainConfig = toChain ? config.chains[toChain] : undefined;
  const gasTokenConfig = toChainConfig
    ? config.tokens[toChainConfig.gasToken]
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
  const manualAddressTargetValidation = manualAddressTarget
    ? manualAddressTarget && isAutomatic(route || '', toChain)
    : true;
  const pageHeader = getPageHeader();

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      <PageHeader
        title={pageHeader.text}
        align={pageHeader.align}
        showHamburgerMenu={config.showHamburgerMenu}
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
      <Collapse
        in={valid && showValidationState && manualAddressTargetValidation}
      >
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

          {!isNttRoute(route) && (
            <TransferLimitedWarning fromChain={fromChain} token={token} />
          )}
          {isNttRoute(route) && <NttInboundCapacityWarning />}
          <Send valid={!!valid} />
        </div>
      </Collapse>
      {config.showHamburgerMenu ? null : <FooterNavBar />}

      <div className={classes.poweredBy}>
        <PoweredByIcon color={theme.palette.text.primary} />
      </div>
    </div>
  );
}

const getPageHeader = (): { text: string; align: Alignment } => {
  const defaults: { text: string; align: Alignment } = {
    text: '',
    align: 'left',
  };
  if (typeof config.pageHeader === 'string') {
    return { ...defaults, text: config.pageHeader };
  } else {
    return { ...defaults, ...config.pageHeader };
  }
};

export default Bridge;
