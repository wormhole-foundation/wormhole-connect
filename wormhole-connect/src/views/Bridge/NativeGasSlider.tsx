import Slider, { SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import { utils } from 'ethers';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebounce } from 'use-debounce';

import { CHAINS, TOKENS, THEME } from 'config';
import { TokenConfig, Route } from 'config/types';
import { RoutesConfig } from 'config/routes';
import { getTokenDecimals, getDisplayName, calculateUSDPrice } from 'utils';
import { wh } from 'utils/sdk';
import { getConversion, toDecimals, toFixedDecimals } from 'utils/balance';
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
import Price from 'components/Price';

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

type ThumbProps = React.HTMLAttributes<unknown>;

function formatAmount(amount?: number): number {
  if (!amount) return 0;
  let formatted = toFixedDecimals(`${amount}`, 6);
  if (amount < 0.000001) formatted = '0';
  return Number.parseFloat(formatted);
}

const INITIAL_STATE = {
  disabled: false,
  min: 0,
  max: 0,
  nativeGas: 0,
  nativeGasPrice: '',
  token: formatAmount(),
  tokenPrice: '',
  swapAmt: 0,
  conversionRate: undefined as number | undefined,
};

function GasSlider(props: { disabled: boolean }) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const { token, toChain, amount, route, destToken } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const [debouncedAmount] = useDebounce(amount, 500);
  const { maxSwapAmt, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const amountNum = useMemo(() => {
    return Number.parseFloat(debouncedAmount) - (relayerFee || 0);
  }, [debouncedAmount, relayerFee]);
  const { receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const destConfig = CHAINS[toChain!];
  const sendingToken = TOKENS[token];
  const receivingToken = TOKENS[destToken];
  const nativeGasToken = TOKENS[destConfig!.gasToken];

  const [state, setState] = useState(INITIAL_STATE);
  const [debouncedSwapAmt] = useDebounce(state.swapAmt, 500);

  const [gasSliderCollapsed, setGasSliderCollapsed] = useState(props.disabled);

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
      // not a perfect fix for all possible 'getMinSendAmount' functions - but valid for linear ones
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
    if (actualMaxSwap === 0) setGasSliderCollapsed(true);
    setState((prevState) => ({
      ...prevState,
      disabled: amountNum <= 0 || actualMaxSwap === 0,
      token: formatAmount(newTokenAmount),
      tokenPrice: calculateUSDPrice(
        formatAmount(newTokenAmount),
        prices,
        TOKENS[token],
      ),
      max: formatAmount(actualMaxSwap),
    }));
  }, [relayerFee, maxSwapAmt, amountNum, route, state.swapAmt, data, token]);

  useEffect(() => {
    if (
      !toChain ||
      !sendingToken ||
      !route ||
      !RouteOperator.getRoute(route).NATIVE_GAS_DROPOFF_SUPPORTED ||
      !receivingWallet.address ||
      !receivingToken
    ) {
      return;
    }

    let cancelled = false;
    (async () => {
      const tokenId = receivingToken.tokenId!;

      try {
        const maxSwapAmount = await RouteOperator.maxSwapAmount(
          route,
          toChain,
          tokenId,
          receivingWallet.address,
        );
        if (cancelled) return;
        if (!maxSwapAmount) {
          dispatch(setMaxSwapAmt(undefined));
          return;
        }
        const toChainDecimals = getTokenDecimals(
          wh.toChainId(toChain),
          tokenId,
        );
        const amt = toDecimals(maxSwapAmount, toChainDecimals, 6);
        dispatch(setMaxSwapAmt(Number.parseFloat(amt)));
      } catch (e: any) {
        if (cancelled) return;
        if (e.message?.includes('swap rate not set')) {
          if (route === Route.CCTPRelay) {
            dispatch(setTransferRoute(Route.CCTPManual));
          } else {
            dispatch(setTransferRoute(Route.Bridge));
          }
        } else {
          throw e;
        }
      }

      // get conversion rate of token
      const { gasToken } = CHAINS[toChain]!;
      const conversionRate = await getConversion(token, gasToken);
      if (cancelled) return;
      const minNative = await RouteOperator.minSwapAmountNative(
        route,
        toChain,
        tokenId,
        receivingWallet.address,
      );
      const minNativeAdjusted = Number.parseFloat(
        toDecimals(
          minNative,
          getTokenDecimals(wh.toChainId(toChain), 'native'),
        ),
      );
      if (cancelled) return;
      const min = conversionRate ? minNativeAdjusted / conversionRate : 0;
      setState((prevState) => ({ ...prevState, conversionRate, min }));
    })();

    return () => {
      cancelled = true;
    };
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
        <TokenIcon icon={nativeGasToken.icon} height={16} />
      </SliderThumb>
    );
  }

  const onCollapseChange = (collapsed: boolean) => {
    setGasSliderCollapsed(collapsed);
    // user switched off conversion to native gas, so reset values
    if (collapsed) {
      setState((prevState) => ({
        ...prevState,
        swapAmt: 0,
        nativeGas: 0,
        nativeGasPrice: '',
        token: formatAmount(amountNum),
        tokenPrice: calculateUSDPrice(
          formatAmount(amountNum),
          prices,
          TOKENS[token],
        ),
      }));
      dispatch(setReceiveNativeAmt(0));
    }
  };

  // compute amounts on change
  const handleChange = (e: any) => {
    if (!amountNum || !state.conversionRate) return;
    const value = e.target.value < state.min ? 0 : e.target.value;
    const newGasAmount = value * state.conversionRate;
    const newTokenAmount = amountNum - value;
    const swapAmount = value;
    const conversion = {
      nativeGas: formatAmount(newGasAmount),
      nativeGasPrice: calculateUSDPrice(
        formatAmount(newGasAmount),
        prices,
        nativeGasToken,
      ),
      token: formatAmount(newTokenAmount),
      tokenPrice: calculateUSDPrice(
        formatAmount(newTokenAmount),
        prices,
        TOKENS[token],
      ),
      swapAmt: formatAmount(swapAmount),
    };
    setState((prevState) => ({ ...prevState, ...conversion }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (
        !receivingToken ||
        !sendingToken ||
        !route ||
        !receivingWallet.address
      )
        return;
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
        nativeGasPrice: calculateUSDPrice(
          formattedNativeAmt,
          prices,
          nativeGasToken,
        ),
        token: formatAmount(amountNum - debouncedSwapAmt),
        tokenPrice: calculateUSDPrice(
          formatAmount(amountNum - debouncedSwapAmt),
          prices,
          TOKENS[token],
        ),
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
    data,
    token,
  ]);

  const defaultSliderColor = THEME.success[100];

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
      controlled={true}
      value={gasSliderCollapsed}
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
                color1={nativeGasToken.color ?? defaultSliderColor}
                color2={sendingToken.color ?? defaultSliderColor}
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
                marks={
                  state.min ? [{ value: state.min, label: 'Min' }] : undefined
                }
              />
              <div className={classes.amounts}>
                <div>
                  <div className={classes.amountDisplay}>
                    <TokenIcon icon={nativeGasToken.icon} height={16} />
                    <div>
                      {state.nativeGas} {getDisplayName(nativeGasToken)}
                    </div>
                  </div>
                  <Price textAlign="right">{state.nativeGasPrice}</Price>
                </div>
                <div>
                  <div className={classes.amountDisplay}>
                    <TokenIcon
                      icon={(sendingToken as TokenConfig)!.icon}
                      height={16}
                    />
                    {state.token}{' '}
                    {getDisplayName((sendingToken as TokenConfig)!)}
                  </div>
                  <Price textAlign="right">{state.tokenPrice}</Price>
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
