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
  setTransferRoute,
  TransferInputState,
} from 'store/transferInput';
import { CHAINS, ROUTES, TOKENS, TOKENS_ARR } from 'config';
import { TokenConfig, Route } from 'config/types';
import { getTokenDecimals } from 'utils';
import { wh, toChainId } from 'utils/sdk';
import { joinClass } from 'utils/style';
import { toDecimals } from 'utils/balance';
import { isTransferValid, validate } from 'utils/transferValidation';
import { isCosmWasmChain } from 'utils/cosmos';
import RouteOperator from 'utils/routes/operator';

import GasSlider from './NativeGasSlider';
import Preview from './Preview';
import Send from './Send';
import { Collapse } from '@mui/material';
import PageHeader from 'components/PageHeader';
import FromInputs from './Inputs/From';
import ToInputs from './Inputs/To';
import TransferLimitedWarning from './TransferLimitedWarning';
import SwapChains from './SwapChains';
import RouteOptions from './RouteOptions';

const useStyles = makeStyles()((theme) => ({
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
}));

function getUniqueTokens(arr: TokenConfig[]) {
  return arr.filter((t, i) => arr.findIndex((_t) => _t.key === t.key) === i);
}

function isSupportedToken(
  token: string,
  supportedTokens: TokenConfig[],
): boolean {
  if (!token) return true;
  return supportedTokens.some((t) => t.key === token);
}

function Bridge() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const {
    validate: showValidationState,
    validations,
    fromChain,
    toChain,
    token,
    destToken,
    route,
    foreignAsset,
    associatedTokenAddress,
    isTransactionInProgress,
    amount,
  }: TransferInputState = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const { sending, receiving } = useSelector(
    (state: RootState) => state.wallet,
  );

  // check destination native balance
  useEffect(() => {
    if (!fromChain || !toChain || !receiving.address) return;
    const networkConfig = CHAINS[toChain]!;
    wh.getNativeBalance(receiving.address, toChain).then((res: BigNumber) => {
      const tokenConfig = TOKENS[networkConfig.gasToken];
      if (!tokenConfig)
        throw new Error('Could not get native gas token config');
      const decimals = getTokenDecimals(
        toChainId(tokenConfig.nativeNetwork),
        tokenConfig.tokenId,
      );
      dispatch(setReceiverNativeBalance(toDecimals(res, decimals, 6)));
    });
  }, [fromChain, toChain, receiving.address, dispatch]);

  useEffect(() => {
    const computeSrcTokens = async () => {
      // Get all possible source tokens over all routes
      const supported = getUniqueTokens(
        (
          await Promise.all(
            ROUTES.map((value) => {
              const returnedTokens = RouteOperator.supportedSourceTokens(
                value as Route,
                TOKENS_ARR,
                undefined,
                fromChain,
              );
              return returnedTokens;
            }),
          )
        ).reduce((a, b) => a.concat(b), []),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, fromChain, destToken, dispatch]);

  useEffect(() => {
    const computeDestTokens = async () => {
      // Get all possible destination tokens over all routes, given the source token
      const supported = getUniqueTokens(
        (
          await Promise.all(
            ROUTES.map((value) =>
              RouteOperator.supportedDestTokens(
                value as Route,
                TOKENS_ARR,
                TOKENS[token],
                fromChain,
                toChain,
              ),
            ),
          )
        ).reduce((a, b) => a.concat(b)),
      );
      dispatch(setSupportedDestTokens(supported));
      const selectedIsSupported = isSupportedToken(destToken, supported);
      if (!selectedIsSupported) {
        dispatch(setDestToken(''));
      }
      if (supported.length === 1 && destToken === '') {
        dispatch(setDestToken(supported[0].key));
      }

      // If all the supported tokens are the same token
      // select the native version
      const symbols = supported.map((t) => t.symbol);
      if (destToken === '' && toChain && symbols.every((s) => s === symbols[0])) {
        const key = supported.find(
          (t) =>
            t.symbol === symbols[0] &&
            t.nativeNetwork === t.tokenId?.chain &&
            t.nativeNetwork === toChain,
        )?.key;
        if (key) {
          dispatch(setDestToken(key));
        }
      }
    };
    computeDestTokens();
    // IMPORTANT: do not include destToken in dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, token, fromChain, toChain, dispatch]);

  // check if automatic relay option is available
  useEffect(() => {
    const establishRoute = async () => {
      if (fromChain && isCosmWasmChain(wh.toChainId(fromChain))) {
        dispatch(setTransferRoute(Route.CosmosGateway));
        return;
      }

      if (toChain && isCosmWasmChain(wh.toChainId(toChain))) {
        dispatch(setTransferRoute(Route.CosmosGateway));
        return;
      }

      if (!fromChain || !toChain || !token || !destToken) return;
      const cctpAvailable = await RouteOperator.isRouteAvailable(
        Route.CCTPRelay,
        token,
        destToken,
        amount,
        fromChain,
        toChain,
      );
      if (cctpAvailable) {
        dispatch(setTransferRoute(Route.CCTPRelay));
        return;
      }

      const cctpManualAvailable = await RouteOperator.isRouteAvailable(
        Route.CCTPManual,
        token,
        destToken,
        amount,
        fromChain,
        toChain,
      );
      if (cctpManualAvailable) {
        dispatch(setTransferRoute(Route.CCTPManual));
        return;
      }

      const relayAvailable = await RouteOperator.isRouteAvailable(
        Route.Relay,
        token,
        destToken,
        amount,
        fromChain,
        toChain,
      );
      if (relayAvailable) {
        dispatch(setTransferRoute(Route.Relay));
        return;
      } else {
        dispatch(setTransferRoute(Route.Bridge));
        return;
      }
    };
    establishRoute();
  }, [fromChain, toChain, token, destToken, amount, dispatch]);

  useEffect(() => {
    const recomputeReceive = async () => {
      if (!route) return;
      const newReceiveAmount = await RouteOperator.computeReceiveAmount(
        route,
        Number.parseFloat(amount),
        { toNativeToken },
      );
      dispatch(setReceiveAmount(newReceiveAmount.toString()));
    };
    recomputeReceive();
  }, [amount, toNativeToken, route, dispatch]);

  // validate transfer inputs
  useEffect(() => {
    validate(dispatch);
  }, [
    sending,
    receiving,
    fromChain,
    toChain,
    token,
    destToken,
    route,
    toNativeToken,
    relayerFee,
    foreignAsset,
    associatedTokenAddress,
    dispatch,
  ]);
  const valid = isTransferValid(validations);
  const disabled = !valid || isTransactionInProgress;
  const showGasSlider =
    route && RouteOperator.getRoute(route).NATIVE_GAS_DROPOFF_SUPPORTED;

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      <PageHeader title="Bridge" />

      <FromInputs />
      <SwapChains />
      <ToInputs />

      <Collapse in={valid && showValidationState}>
        <div className={classes.spacer}>
          <RouteOptions />

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

          <TransferLimitedWarning />

          <Send valid={!!valid} />
        </div>
      </Collapse>
    </div>
  );
}

export default Bridge;
