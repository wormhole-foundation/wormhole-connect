import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { BigNumber } from 'ethers';
import { useDispatch } from 'react-redux';
import { RootState } from '../../store';
import {
  setReceiverNativeBalance,
  enableAutomaticTransferAndSetRoute,
  disableAutomaticTransferAndSetRoute,
  Route,
  setReceiveAmount,
  setDestToken,
  setToken,
  setSupportedSourceTokens,
  setSupportedDestTokens,
  TransferInputState,
} from '../../store/transferInput';
import { wh, isAcceptedToken, toChainId } from '../../utils/sdk';
import { CHAINS, TOKENS, TOKENS_ARR } from '../../config';
import { isTransferValid, validate } from '../../utils/transferValidation';

import GasSlider from './NativeGasSlider';
import Preview from './Preview';
import Send from './Send';
import { Collapse } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import FromInputs from './Inputs/From';
import ToInputs from './Inputs/To';
import { toDecimals } from '../../utils/balance';
import { getTokenDecimals, getWrappedTokenId } from '../../utils';
import TransferLimitedWarning from './TransferLimitedWarning';
import { joinClass } from '../../utils/style';
import SwapNetworks from './SwapNetworks';
import RouteOptions from './RouteOptions';
import Operator from '../../utils/routes';
import { listOfRoutes } from '../../utils/routes/operator';
import { TokenConfig } from '../../config/types';

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
    fromNetwork,
    toNetwork,
    token,
    destToken,
    route,
    automaticRelayAvail,
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
    if (!fromNetwork || !toNetwork || !receiving.address) return;
    const networkConfig = CHAINS[toNetwork]!;
    wh.getNativeBalance(receiving.address, toNetwork).then((res: BigNumber) => {
      const tokenConfig = TOKENS[networkConfig.gasToken];
      if (!tokenConfig)
        throw new Error('Could not get native gas token config');
      const decimals = getTokenDecimals(
        toChainId(tokenConfig.nativeNetwork),
        tokenConfig.tokenId,
      );
      dispatch(setReceiverNativeBalance(toDecimals(res, decimals, 6)));
    });
  }, [fromNetwork, toNetwork, receiving.address, dispatch]);

  useEffect(() => {
    const computeSrcTokens = async () => {
      const operator = new Operator();

      // Get all possible source tokens over all routes
      const supported = getUniqueTokens(
        (
          await Promise.all(
            listOfRoutes.map((r) => {
              const returnedTokens = operator.supportedSourceTokens(
                r,
                TOKENS_ARR,
                undefined,
                fromNetwork,
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
      if (supported.length === 1) {
        dispatch(setToken(supported[0].key));
      }
    };
    computeSrcTokens();
    // IMPORTANT: do not include token in dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, destToken, dispatch]);

  useEffect(() => {
    const computeDestTokens = async () => {
      const operator = new Operator();

      // Get all possible destination tokens over all routes, given the source token
      const supported = getUniqueTokens(
        (
          await Promise.all(
            listOfRoutes.map((r) =>
              operator.supportedDestTokens(
                r,
                TOKENS_ARR,
                TOKENS[token],
                fromNetwork,
                toNetwork,
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
      if (supported.length === 1) {
        dispatch(setDestToken(supported[0].key));
      }

      // If all the supported tokens are the same token
      // select the native version
      const symbols = supported.map((t) => t.symbol);
      if (toNetwork && symbols.every((s) => s === symbols[0])) {
        const key = supported.find(
          (t) =>
            t.symbol === symbols[0] &&
            t.nativeNetwork === t.tokenId?.chain &&
            t.nativeNetwork === toNetwork,
        )?.key;
        if (key) {
          dispatch(setDestToken(key));
        }
      }
    };
    computeDestTokens();
    // IMPORTANT: do not include destToken in dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, token, fromNetwork, toNetwork, dispatch]);

  // check if automatic relay option is available
  useEffect(() => {
    const establishRoute = async () => {
      if (!fromNetwork || !toNetwork || !token || !destToken) return;
      const cctpAvailable = await new Operator().isRouteAvailable(
        Route.CCTPRelay,
        token,
        destToken,
        amount,
        fromNetwork,
        toNetwork,
      );
      if (cctpAvailable) {
        dispatch(enableAutomaticTransferAndSetRoute(Route.CCTPRelay));
        return;
      }

      const cctpManualAvailable = await new Operator().isRouteAvailable(
        Route.CCTPManual,
        token,
        destToken,
        amount,
        fromNetwork,
        toNetwork,
      );
      if (cctpManualAvailable) {
        dispatch(disableAutomaticTransferAndSetRoute(Route.CCTPManual));
        return;
      }

      // The code below should maybe be rewritten to use isRouteAvailable!
      const fromConfig = CHAINS[fromNetwork]!;
      const toConfig = CHAINS[toNetwork]!;
      if (fromConfig.automaticRelayer && toConfig.automaticRelayer) {
        const isTokenAcceptedForRelay = async () => {
          const tokenConfig = TOKENS[token]!;
          const tokenId = getWrappedTokenId(tokenConfig);
          const accepted = await isAcceptedToken(tokenId);
          if (accepted) {
            dispatch(enableAutomaticTransferAndSetRoute(Route.RELAY));
          } else {
            dispatch(disableAutomaticTransferAndSetRoute(Route.BRIDGE));
          }
        };
        isTokenAcceptedForRelay();
      } else {
        dispatch(disableAutomaticTransferAndSetRoute(Route.BRIDGE));
      }
    };
    establishRoute();
  }, [fromNetwork, toNetwork, token, destToken, dispatch]);

  useEffect(() => {
    const recomputeReceive = async () => {
      const operator = new Operator();
      const newReceiveAmount = await operator.computeReceiveAmount(
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
    fromNetwork,
    toNetwork,
    token,
    destToken,
    route,
    automaticRelayAvail,
    toNativeToken,
    relayerFee,
    foreignAsset,
    associatedTokenAddress,
    dispatch,
  ]);
  const valid = isTransferValid(validations);
  const disabled = !valid || isTransactionInProgress;
  const showGasSlider =
    automaticRelayAvail && (route === Route.RELAY || route === Route.CCTPRelay);

  return (
    <div className={joinClass([classes.bridgeContent, classes.spacer])}>
      <PageHeader title="Bridge" />

      <FromInputs />
      <SwapNetworks />
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
