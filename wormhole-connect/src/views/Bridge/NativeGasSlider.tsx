import Slider, { SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import { BigNumber, utils } from 'ethers';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebounce } from 'use-debounce';

import { CHAINS, TOKENS } from 'config';
import { TokenConfig, Route } from 'config/types';
import { RoutesConfig } from 'config/routes';
import {
  wh,
  getTokenDecimals,
  getDisplayName,
  getConversion,
  toDecimals,
  toFixedDecimals,
} from 'utils';
import RouteOperator from 'routes/operator';
import { RootState } from 'store';
import { setTransferRoute } from 'store/transferInput';
import {
  setMaxSwapAmt,
  setReceiveNativeAmt,
  setToNativeToken,
} from 'store/relay';

import InputContainer from 'components/InputContainer';
import TokenIcon from 'icons/TokenIcons';
import BridgeCollapse, { CollapseControlStyle } from './Collapse';
import { Banner } from './RouteOptions';

const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  amounts: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
}));

function label(amt1: number, token1: string, amt2: number, token2: string) {
  return (
    <div>
      {toFixedDecimals(`${amt1}`, 4)} {token1}
      <br />
      {toFixedDecimals(`${amt2}`, 4)} {token2}
    </div>
  );
}

type SliderProps = {
  color1: string;
  color2: string;
};

const PrettoSlider = styled(Slider)<SliderProps>(({ color1, color2 }) => ({
  color: color1,
  height: 8,
  '& .MuiSlider-rail': {
    height: '4px',
    backgroundColor: color2,
  },
  '& .MuiSlider-track': {
    height: '6px',
  },
  '& .MuiSlider-thumb': {
    height: 28,
    width: 28,
    backgroundColor: '#fff',
  },
}));

interface ThumbProps extends React.HTMLAttributes<unknown> {}

function formatAmount(amount?: number): number {
  if (!amount) return 0;
  let formatted = toFixedDecimals(`${amount}`, 6);
  if (amount < 0.000001) formatted = '0';
  return Number.parseFloat(formatted);
}

const INITIAL_STATE = {
  disabled: false,
  max: 0,
  nativeGas: 0,
  token: formatAmount(),
  swapAmt: 0,
  conversionRate: undefined as number | undefined,
};

function GasSlider(props: { disabled: boolean }) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const { token, toChain, amount, route, destToken } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { maxSwapAmt, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const amountNum = useMemo(() => {
    return Number.parseFloat(amount) - (relayerFee || 0);
  }, [amount, relayerFee]);
  const { receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );
  const destConfig = CHAINS[toChain!];
  const sendingToken = TOKENS[token];
  const receivingToken = TOKENS[destToken];
  const nativeGasToken = TOKENS[destConfig?.gasToken!];

  const [state, setState] = useState(INITIAL_STATE);
  const [debouncedSwapAmt] = useDebounce(state.swapAmt, 250);

  // set the actual max swap amount (checks if max swap amount is greater than the sending amount)
  useEffect(() => {
    if (
      !amountNum ||
      amountNum === 0 ||
      !maxSwapAmt ||
      !route ||
      !RouteOperator.getRoute(route).NATIVE_GAS_DROPOFF_SUPPORTED
    )
      return;

    let actualMaxSwap =
      amountNum && maxSwapAmt && Math.max(Math.min(maxSwapAmt, amountNum), 0);

    if (actualMaxSwap) {
      // address the bug that the swapAmount='maxSwapAmount' results in a 'minimumSendAmount'
      // that could be higher than 'amount' (due to the buffer packed into minimumSendAmount)
      // not a perfect fix for all posible 'getMinSendAmount' functions - but valid for linear ones
      //
      // For example, if 'amount' is 1.1, and relayerFee is 1, then 'amountNum' (the receive amount) is
      // 0.1, and 'actualMaxSwap' is 0.1.
      // Now suppose the user sets swapAmt to be 0.1 - so now toNativeToken = 0.1,
      // meaning the 'minSendAmount' is getMinSendAmount({toNativeToken: 0.1, relayerFee: 1}) which
      // currently is (0.1 + 1)*1.05 = 1.155
      // This is greater than what the current send amount (1.1) is!
      // The next two lines remedy this issue by subtracting the difference (1.155-1.1) from
      // actualMaxSwap (i.e. bringing it from 0.1 to 0.045)
      const theoreticalMinSendAmount = RouteOperator.getRoute(
        route,
      ).getMinSendAmount({
        toNativeToken: actualMaxSwap,
        relayerFee,
      });
      const buffer = Math.max(
        theoreticalMinSendAmount - amountNum - (relayerFee || 0),
        0,
      );
      actualMaxSwap = Math.max(Math.min(maxSwapAmt, amountNum - buffer), 0);
    }

    const newTokenAmount = amountNum - state.swapAmt;
    setState((prevState) => ({
      ...prevState,
      disabled: amountNum <= 0,
      token: formatAmount(newTokenAmount),
      max: formatAmount(actualMaxSwap),
    }));
  }, [relayerFee, maxSwapAmt, amountNum, route, state.swapAmt]);

  useEffect(() => {
    if (
      !toChain ||
      !sendingToken ||
      !route ||
      !RouteOperator.getRoute(route).NATIVE_GAS_DROPOFF_SUPPORTED ||
      !receivingWallet.address ||
      !receivingToken
    )
      return;

    const tokenId = receivingToken.tokenId!;
    RouteOperator.maxSwapAmount(
      route,
      toChain,
      tokenId,
      receivingWallet.address,
    )
      .then((res: BigNumber) => {
        if (!res) {
          dispatch(setMaxSwapAmt(undefined));
          return;
        }
        const toChainDecimals = getTokenDecimals(
          wh.toChainId(toChain),
          tokenId,
        );
        const amt = toDecimals(res, toChainDecimals, 6);
        dispatch(setMaxSwapAmt(Number.parseFloat(amt)));
      })
      .catch((e) => {
        if (e.message.includes('swap rate not set')) {
          if (route === Route.CCTPRelay) {
            dispatch(setTransferRoute(Route.CCTPManual));
          } else {
            dispatch(setTransferRoute(Route.Bridge));
          }
        } else {
          throw e;
        }
      });

    // get conversion rate of token
    const { gasToken } = CHAINS[toChain]!;
    getConversion(token, gasToken).then((res: number) => {
      setState((prevState) => ({ ...prevState, conversionRate: res }));
    });
  }, [
    sendingToken,
    receivingToken,
    receivingWallet,
    toChain,
    route,
    token,
    destToken,
    dispatch,
  ]);

  function Thumb(props: ThumbProps) {
    const { children, ...other } = props;
    return (
      <SliderThumb {...other}>
        {children}
        <TokenIcon name={nativeGasToken.icon} height={16} />
      </SliderThumb>
    );
  }

  const onCollapseChange = (collapsed: boolean) => {
    // user switched off conversion to native gas, so reset values
    if (collapsed) {
      setState((prevState) => ({
        ...prevState,
        swapAmt: 0,
        nativeGas: 0,
        token: formatAmount(amountNum),
      }));
      dispatch(setReceiveNativeAmt(0));
    }
  };

  // compute amounts on change
  const handleChange = (e: any) => {
    if (!amountNum || !state.conversionRate) return;
    const newGasAmount = e.target.value * state.conversionRate;
    const newTokenAmount = amountNum - e.target.value;
    const swapAmount = e.target.value;
    const conversion = {
      nativeGas: formatAmount(newGasAmount),
      token: formatAmount(newTokenAmount),
      swapAmt: formatAmount(swapAmount),
    };
    setState((prevState) => ({ ...prevState, ...conversion }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!receivingToken || !sendingToken || !route) return;
      dispatch(setToNativeToken(debouncedSwapAmt));
      const tokenId = receivingToken.tokenId!;
      const tokenToChainDecimals = getTokenDecimals(
        wh.toChainId(toChain!),
        tokenId,
      );
      const formattedAmt = utils.parseUnits(
        `${debouncedSwapAmt}`,
        tokenToChainDecimals,
      );
      const nativeGasAmt = await RouteOperator.nativeTokenAmount(
        route,
        toChain!,
        tokenId,
        formattedAmt,
        receivingWallet.address,
      );
      if (cancelled) return;
      const nativeGasTokenToChainDecimals = getTokenDecimals(
        wh.toChainId(toChain!),
        'native',
      );
      const formattedNativeAmt = Number.parseFloat(
        toDecimals(nativeGasAmt.toString(), nativeGasTokenToChainDecimals, 6),
      );
      dispatch(setReceiveNativeAmt(formattedNativeAmt));
      setState((prevState) => ({
        ...prevState,
        nativeGas: formattedNativeAmt,
        token: formatAmount(amountNum - debouncedSwapAmt),
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedSwapAmt,
    dispatch,
    nativeGasToken,
    receivingWallet.address,
    sendingToken,
    receivingToken,
    toChain,
    route,
    amountNum,
  ]);

  const banner = !props.disabled && !!route && (
    <Banner text="This feature provided by" route={RoutesConfig[route]} />
  );

  return (
    <BridgeCollapse
      title="Native gas"
      banner={banner}
      disabled={props.disabled || state.disabled}
      startClosed={props.disabled}
      controlStyle={CollapseControlStyle.Switch}
      onCollapseChange={onCollapseChange}
    >
      <InputContainer
        styles={{
          width: '100%',
          borderTopRightRadius: '0px',
          borderTopLeftRadius: '0px',
          boxShadow: 'none',
        }}
      >
        {sendingToken && nativeGasToken && destConfig ? (
          <div className={classes.container}>
            <div>
              Would you like to receive some native gas token (
              {getDisplayName(nativeGasToken)})?
            </div>

            <div>
              <PrettoSlider
                slots={{ thumb: Thumb }}
                aria-label="Native gas conversion amount"
                defaultValue={0}
                value={state.swapAmt}
                color1={nativeGasToken.color}
                color2={sendingToken.color}
                step={0.000001}
                min={0}
                max={state.max}
                valueLabelFormat={() =>
                  label(
                    state.nativeGas,
                    getDisplayName(nativeGasToken),
                    state.token,
                    getDisplayName(TOKENS[token]),
                  )
                }
                valueLabelDisplay="auto"
                onChange={handleChange}
              />
              <div className={classes.amounts}>
                <div className={classes.amountDisplay}>
                  <TokenIcon name={nativeGasToken.icon} height={16} />
                  {state.nativeGas} {getDisplayName(nativeGasToken)}
                </div>
                <div className={classes.amountDisplay}>
                  <TokenIcon
                    name={(sendingToken as TokenConfig)!.icon}
                    height={16}
                  />
                  {state.token} {getDisplayName((sendingToken as TokenConfig)!)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div></div>
        )}
      </InputContainer>
    </BridgeCollapse>
  );
}

export default GasSlider;
