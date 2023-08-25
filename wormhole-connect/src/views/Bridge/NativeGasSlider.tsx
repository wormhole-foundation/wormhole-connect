import Slider, { SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import { BigNumber, utils } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebounce } from 'use-debounce';
import { CHAINS, TOKENS } from '../../config';
import { TokenConfig } from '../../config/types';
import {
  calculateMaxSwapAmount,
  calculateNativeTokenAmt,
  wh,
} from '../../utils/sdk';
import { RootState } from '../../store';
import { disableAutomaticTransfer, Route } from '../../store/transferInput';
import {
  setMaxSwapAmt,
  setReceiveNativeAmt,
  setToNativeToken,
} from '../../store/relay';
import { getTokenDecimals, getWrappedTokenId } from '../../utils';
import {
  getConversion,
  toDecimals,
  toFixedDecimals,
} from '../../utils/balance';
import { getMinAmount } from '../../utils/transferValidation';

import InputContainer from '../../components/InputContainer';
import TokenIcon from '../../icons/TokenIcons';
import BridgeCollapse, { CollapseControlStyle } from './Collapse';
import { Banner } from './RouteOptions';
import { ROUTES } from '../../config/routes';

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
  const formatted = toFixedDecimals(`${amount}`, 6);
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
  const { token, toNetwork, amount, route, automaticRelayAvail } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const { maxSwapAmt, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const { receiving: receivingWallet } = useSelector(
    (state: RootState) => state.wallet,
  );
  const destConfig = CHAINS[toNetwork!];
  const sendingToken = TOKENS[token];
  const nativeGasToken = TOKENS[destConfig?.gasToken!];

  const [state, setState] = useState(INITIAL_STATE);
  const [debouncedSwapAmt] = useDebounce(state.swapAmt, 250);

  // set the actual max swap amount (checks if max swap amount is greater than the sending amount)
  useEffect(() => {
    if (
      !amount ||
      typeof amount !== 'number' ||
      !maxSwapAmt ||
      route !== Route.RELAY
    )
      return;

    const min = getMinAmount(true, relayerFee, 0);
    const amountWithoutRelayerFee = amount - min;
    const actualMaxSwap =
      amount &&
      maxSwapAmt &&
      Math.max(Math.min(maxSwapAmt, amountWithoutRelayerFee), 0);

    const newTokenAmount = amount - state.swapAmt;

    setState((prevState) => ({
      ...prevState,
      disabled: amount <= min,
      token: formatAmount(newTokenAmount),
      max: formatAmount(actualMaxSwap),
    }));
  }, [maxSwapAmt, amount, route, state.swapAmt, relayerFee]);

  useEffect(() => {
    if (
      !toNetwork ||
      !sendingToken ||
      route !== Route.RELAY ||
      !receivingWallet.address
    )
      return;

    const tokenId = getWrappedTokenId(sendingToken);
    calculateMaxSwapAmount(toNetwork, tokenId, receivingWallet.address)
      .then((res: BigNumber) => {
        if (!res) {
          dispatch(setMaxSwapAmt(undefined));
          return;
        }
        const toNetworkDecimals = getTokenDecimals(
          wh.toChainId(toNetwork),
          tokenId,
        );
        const amt = toDecimals(res, toNetworkDecimals, 6);
        dispatch(setMaxSwapAmt(Number.parseFloat(amt)));
      })
      .catch((e) => {
        if (e.message.includes('swap rate not set')) {
          dispatch(disableAutomaticTransfer());
        } else {
          throw e;
        }
      });

    // get conversion rate of token
    const { gasToken } = CHAINS[toNetwork]!;
    getConversion(token, gasToken).then((res: number) => {
      setState((prevState) => ({ ...prevState, conversionRate: res }));
    });
  }, [sendingToken, receivingWallet, toNetwork, route, token, dispatch]);

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
    console.log(collapsed);
    // user switched off conversion to native gas, so reset values
    if (collapsed) {
      setState((prevState) => ({
        ...prevState,
        swapAmt: 0,
        nativeGas: 0,
        token: formatAmount(Number.parseFloat(amount)),
      }));
      dispatch(setReceiveNativeAmt(0));
    }
  };

  // compute amounts on change
  const handleChange = (e: any) => {
    if (!amount || !state.conversionRate) return;
    const newGasAmount = e.target.value * state.conversionRate;
    const newTokenAmount = Number.parseFloat(amount) - e.target.value;
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
      dispatch(setToNativeToken(debouncedSwapAmt));
      const tokenId = getWrappedTokenId(sendingToken);
      const sendingTokenToChainDecimals = getTokenDecimals(
        wh.toChainId(toNetwork!),
        tokenId,
      );
      const formattedAmt = utils.parseUnits(
        `${debouncedSwapAmt}`,
        sendingTokenToChainDecimals,
      );
      const nativeGasAmt = await calculateNativeTokenAmt(
        toNetwork!,
        tokenId,
        formattedAmt,
        receivingWallet.address,
      );
      if (cancelled) return;
      const nativeGasTokenId = getWrappedTokenId(nativeGasToken);
      const nativeGasTokenToChainDecimals = getTokenDecimals(
        wh.toChainId(toNetwork!),
        nativeGasTokenId,
      );
      const formattedNativeAmt = Number.parseFloat(
        toDecimals(nativeGasAmt.toString(), nativeGasTokenToChainDecimals, 6),
      );
      dispatch(setReceiveNativeAmt(formattedNativeAmt));
      setState((prevState) => ({
        ...prevState,
        nativeGas: formattedNativeAmt,
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
    toNetwork,
  ]);

  const banner = automaticRelayAvail && !props.disabled && (
    <Banner text="This feature provided by" route={ROUTES[Route.RELAY]} />
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
              {nativeGasToken.symbol})?
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
                    nativeGasToken.symbol,
                    state.token,
                    token,
                  )
                }
                valueLabelDisplay="auto"
                onChange={handleChange}
              />
              <div className={classes.amounts}>
                <div className={classes.amountDisplay}>
                  <TokenIcon name={nativeGasToken.icon} height={16} />
                  {state.nativeGas} {nativeGasToken.symbol}
                </div>
                <div className={classes.amountDisplay}>
                  <TokenIcon
                    name={(sendingToken as TokenConfig)!.icon}
                    height={16}
                  />
                  {state.token} {(sendingToken as TokenConfig)!.symbol}
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
