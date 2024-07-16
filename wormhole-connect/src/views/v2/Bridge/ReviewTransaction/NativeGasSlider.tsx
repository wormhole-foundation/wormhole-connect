import Slider, { SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebounce } from 'use-debounce';

import config from 'config';
import { getDisplayName, calculateUSDPrice } from 'utils';
import { RootState } from 'store';
import { setToNativeToken } from 'store/relay';

import InputContainer from 'components/InputContainer';
import TokenIcon from 'icons/TokenIcons';
import BridgeCollapse from 'views/v2/Bridge/ReviewTransaction/Collapse';
import Price from 'components/Price';
import { toFixedDecimals } from 'utils/balance';
import { TokenConfig } from 'config/types';

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

function NativeGasSlider(props: { disabled: boolean }) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const { token, toChain, amount, receiveAmount } = useSelector(
    (state: RootState) => state.transferInput,
  );
  const receiveNativeAmt = useSelector(
    (state: RootState) => state.relay.receiveNativeAmt,
  );
  const relayerFee = useSelector((state: RootState) => state.relay.relayerFee);
  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);
  const prices = data || {};
  const destConfig = config.chains[toChain!];
  const sendingToken = config.tokens[token];
  const nativeGasToken = config.tokens[destConfig!.gasToken];
  const [percentage, setPercentage] = useState(0);
  const [debouncedPercentage] = useDebounce(percentage, 500);
  const [debouncedAmount] = useDebounce(amount, 500);
  const amountNum = useMemo(() => {
    return Number.parseFloat(debouncedAmount) - (relayerFee || 0);
  }, [debouncedAmount, relayerFee]);

  const [gasSliderCollapsed, setGasSliderCollapsed] = useState(props.disabled);

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
      setPercentage(0);
      dispatch(setToNativeToken(0));
    }
  };

  const defaultSliderColor = 'white'; // TODO connect to theme

  useEffect(() => {
    dispatch(setToNativeToken(debouncedPercentage / 100));
  }, [debouncedPercentage]);

  const nativeGasPrice = useMemo(() => {
    return calculateUSDPrice(
      toFixedDecimals(receiveNativeAmt?.toString() || '0', 6),
      prices,
      nativeGasToken,
    );
  }, [receiveNativeAmt, nativeGasToken, prices]);

  const tokenPrice = useMemo(() => {
    return calculateUSDPrice(
      toFixedDecimals(receiveAmount?.data || '0', 6),
      prices,
      config.tokens[token],
    );
  }, [receiveAmount, token, prices]);

  return (
    <BridgeCollapse
      title="Native gas"
      disabled={props.disabled || amountNum <= 0}
      startClosed={props.disabled}
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
                value={percentage}
                color1={nativeGasToken.color ?? defaultSliderColor}
                color2={sendingToken.color ?? defaultSliderColor}
                step={1}
                min={0}
                max={100}
                valueLabelFormat={() => `${percentage}%`}
                valueLabelDisplay="auto"
                onChange={(e: any) => setPercentage(e.target.value)}
              />
              <div className={classes.amounts}>
                <div>
                  <div className={classes.amountDisplay}>
                    <TokenIcon icon={nativeGasToken.icon} height={16} />
                    <div>
                      {toFixedDecimals(receiveNativeAmt?.toString() || '0', 6)}{' '}
                      {getDisplayName(nativeGasToken)}
                    </div>
                  </div>
                  <Price textAlign="right">{nativeGasPrice}</Price>
                </div>
                <div>
                  <div className={classes.amountDisplay}>
                    <TokenIcon
                      icon={(sendingToken as TokenConfig)!.icon}
                      height={16}
                    />
                    {toFixedDecimals(receiveAmount?.data || '0', 6)}{' '}
                    {getDisplayName((sendingToken as TokenConfig)!)}
                  </div>
                  <Price textAlign="right">{tokenPrice}</Price>
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

export default NativeGasSlider;
