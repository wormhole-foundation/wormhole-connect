import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebounce } from 'use-debounce';

import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Slider, { SliderThumb } from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import config from 'config';
import { getDisplayName, calculateUSDPrice } from 'utils';
import { RootState } from 'store';
import { setToNativeToken } from 'store/relay';

import TokenIcon from 'icons/TokenIcons';
import Price from 'components/Price';
import { toFixedDecimals } from 'utils/balance';
import { TokenConfig } from 'config/types';
import { Stack } from '@mui/material';

const useStyles = makeStyles()(() => ({
  card: {
    width: '100%',
    cursor: 'pointer',
    maxWidth: '420px',
  },
  cardContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  baseColor: string;
  railColor: string;
};

const StyledSlider = styled(Slider)<SliderProps>(
  ({ baseColor, railColor }) => ({
    color: baseColor,
    height: 8,
    '& .MuiSlider-rail': {
      height: '4px',
      backgroundColor: railColor,
    },
    '& .MuiSlider-track': {
      height: '6px',
    },
    '& .MuiSlider-thumb': {
      height: 28,
      width: 28,
      backgroundColor: '#fff',
    },
  }),
);

const StyledSwitch = styled(Switch)((props) => ({
  right: `-${props.style?.paddingRight}`, // reposition towards right to negate switch padding
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#C1BBF6',
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#C1BBF6',
  },
}));

type ThumbProps = React.HTMLAttributes<unknown>;

function NativeGasSlider(props: {
  destinationGasFee: number;
  disabled: boolean;
}) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { token, toChain, receiveAmount } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const receiveNativeAmt = useSelector(
    (state: RootState) => state.relay.receiveNativeAmt,
  );

  const {
    usdPrices: { data },
  } = useSelector((state: RootState) => state.tokenPrices);

  const prices = data || {};
  const destConfig = config.chains[toChain!];
  const sendingToken = config.tokens[token];
  const nativeGasToken = config.tokens[destConfig!.gasToken];
  const [percentage, setPercentage] = useState(0);
  const [debouncedPercentage] = useDebounce(percentage, 500);

  const [isGasSliderOpen, setIsGasSliderOpen] = useState(!props.disabled);

  function ThumbWithTokenIcon(props: ThumbProps) {
    const { children, ...other } = props;
    return (
      <SliderThumb {...other}>
        {children}
        <TokenIcon icon={nativeGasToken.icon} height={16} />
      </SliderThumb>
    );
  }

  const defaultSliderColor = 'white'; // TODO connect to theme

  useEffect(() => {
    dispatch(setToNativeToken(debouncedPercentage / 100));
  }, [debouncedPercentage]);

  const nativeGasPrice = useMemo(() => {
    return calculateUSDPrice(
      toFixedDecimals(props.destinationGasFee?.toString() || '0', 6),
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
    <>
      {sendingToken && nativeGasToken && destConfig ? (
        <Card className={classes.card} variant="elevation">
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography>Buy more gas for transactions</Typography>
              <StyledSwitch
                checked={isGasSliderOpen}
                onClick={(e: any) => {
                  const { checked } = e.target;

                  setIsGasSliderOpen(checked);

                  if (!checked) {
                    setPercentage(0);
                    dispatch(setToNativeToken(0));
                  }
                }}
              />
            </Stack>

            <Collapse in={isGasSliderOpen} unmountOnExit>
              <div className={classes.container}>
                <Typography color={theme.palette.text.secondary} fontSize={14}>
                  Estimated amount needed for this transaction
                </Typography>
                <div>
                  <StyledSlider
                    slots={{ thumb: ThumbWithTokenIcon }}
                    aria-label="Native gas conversion amount"
                    defaultValue={0}
                    value={percentage}
                    baseColor={nativeGasToken.color ?? defaultSliderColor}
                    railColor={sendingToken.color ?? defaultSliderColor}
                    step={1}
                    min={0}
                    max={100}
                    valueLabelFormat={() => `${percentage}%`}
                    valueLabelDisplay="auto"
                    onChange={(e: any) => setPercentage(e.target.value)}
                  />
                  <div className={classes.amounts}>
                    <Typography
                      color={theme.palette.text.secondary}
                      fontSize={14}
                    >
                      Gas price
                    </Typography>
                    <div>
                      <div className={classes.amountDisplay}>
                        {nativeGasPrice}
                        {getDisplayName((sendingToken as TokenConfig)!)}
                      </div>
                      <Price textAlign="right">{tokenPrice}</Price>
                    </div>
                  </div>
                </div>
              </div>
            </Collapse>
          </CardContent>
        </Card>
      ) : (
        <div></div>
      )}
    </>
  );
}

export default NativeGasSlider;
