import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Slider, { SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import BridgeCollapse from './Collapse';
import InputContainer from '../../components/InputContainer';
import { CHAINS, TOKENS } from '../../sdk/config';
import { calculateMaxSwapAmount } from '../../sdk/sdk';
import { TokenConfig } from '../../config/types';
import { RootState } from '../../store';
import TokenIcon from '../../icons/components/TokenIcons';
import { BigNumber } from 'ethers';
import { getConversion, toDecimals, toFixedDecimals } from '../../utils/balance';
import { setMaxSwapAmt, setToNativeToken } from '../../store/transfer';
import { useDispatch } from 'react-redux';

const useStyles = makeStyles()((theme) => ({
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
      {toFixedDecimals(`${amt1}`, 2)} {token1}
      <br />
      {toFixedDecimals(`${amt2}`, 2)} {token2}
    </div>
  )
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

function GasSlider(props: { disabled: boolean }) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const { token, toNetwork, amount, maxSwapAmt } = useSelector((state: RootState) => state.transfer);
  const destConfig = CHAINS[toNetwork!];
  const sendingToken = TOKENS[token];
  const nativeGasToken = TOKENS[destConfig?.gasToken!];

  const [ state, setState ] = useState({
    max: 0,
    nativeGas: 0,
    token: amount,
    swapAmt: 0,
    conversionRate: undefined as number | undefined,
  });

  // set the actual max swap amount (checks if max swap amount is greater than the sending amount)
  useEffect(() => {
    if (!amount || !maxSwapAmt) return
    const actualMaxSwap = (amount && maxSwapAmt) && maxSwapAmt > amount ? amount : maxSwapAmt;
    setState({ ...state, max: actualMaxSwap });
  }, [maxSwapAmt, amount]);

  useEffect(() => {
    if (!toNetwork || !sendingToken) return;
    // calculate max swap amount to native gas token
    if (sendingToken.tokenId) {
      calculateMaxSwapAmount(toNetwork, sendingToken.tokenId).then((res: BigNumber) => {
        const amt = toDecimals(res, sendingToken.decimals, 6);
        dispatch(setMaxSwapAmt(Number.parseFloat(amt)));
      });
    } else {
      if (!sendingToken.wrappedAsset) throw new Error('could not get wrapped asset for native token')
      const wrappedAsset = TOKENS[sendingToken.wrappedAsset];
      calculateMaxSwapAmount(toNetwork, wrappedAsset.tokenId!).then((res: BigNumber) => {
        const amt = toDecimals(res, sendingToken.decimals, 6);
        dispatch(setMaxSwapAmt(Number.parseFloat(amt)));
      });
    }
    // get conversion rate of token
    const { gasToken } = CHAINS[toNetwork]!;
    getConversion(token, gasToken).then((res: number) => {
      console.log('conversion rate', res)
      setState({ ...state, conversionRate: res })
    });
  }, [sendingToken, toNetwork])

  function Thumb(props: ThumbProps) {
    const { children, ...other } = props;
    return (
      <SliderThumb {...other}>
        {children}
        <TokenIcon name={nativeGasToken.icon} height={16} />
      </SliderThumb>
    );
  }

  // compute amounts on change
  const handleChange = (e: any) => {
    if (!amount || !state.conversionRate) return;
    const convertedAmt = `${e.target.value * state.conversionRate}`;
    const newGasAmount = toFixedDecimals(convertedAmt, 6);
    const newTokenAmount = toFixedDecimals(`${amount - e.target.value}`, 6);
    const conversion = {
      nativeGas: Number.parseFloat(newGasAmount),
      token: Number.parseFloat(newTokenAmount),
      swapAmt: e.target.value,
    }
    setState({ ...state, ...conversion });
  }

  // update toNativeToken when user releases slider
  // TODO: query contract to get final numbers
  const setNativeAmt = (e: any) => {
    setTimeout(() => {
      dispatch(setToNativeToken(state.swapAmt));
    }, 500)
  }

  return (
    <BridgeCollapse
      title="Extra native gas"
      banner={!props.disabled}
      disabled={props.disabled}
      close={props.disabled}
    >
      <InputContainer
        styles={{
          width: '100%',
          borderTopRightRadius: '0px',
          borderTopLeftRadius: '0px',
          boxShadow: 'none',
        }}
      >
        {sendingToken !== undefined &&
        nativeGasToken !== undefined &&
        destConfig !== undefined ? (
          <div className={classes.container}>
            <div>
              Your wallet has no native gas ({nativeGasToken.symbol}) balance on{' '}
              {destConfig?.displayName}. Would you like to convert some of the{' '}
              {sendingToken.symbol} you’re bridging to {nativeGasToken.symbol}?
            </div>
            <div>You will receive:</div>
            <div>
              <PrettoSlider
                slots={{ thumb: Thumb }}
                aria-label="Native gas conversion amount"
                defaultValue={0}
                color1={nativeGasToken.color}
                color2={sendingToken.color}
                step={0.000001}
                max={state.max}
                valueLabelFormat={() => label(state.nativeGas, nativeGasToken.symbol, state.token!, token)}
                valueLabelDisplay="auto"
                onChange={handleChange}
                onMouseUp={setNativeAmt}
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
