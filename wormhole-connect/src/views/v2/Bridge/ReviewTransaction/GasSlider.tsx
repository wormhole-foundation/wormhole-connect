import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebounce } from 'use-debounce';

import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Slider, { SliderThumb } from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import config from 'config';
import useFetchTokenPricesV2 from 'hooks/useFetchTokenPricesV2';
import TokenIcon from 'icons/TokenIcons';
import { getDisplayName, calculateUSDPrice } from 'utils';
import { RootState } from 'store';
import { setToNativeToken } from 'store/relay';

import { toFixedDecimals } from 'utils/balance';
import { TokenConfig } from 'config/types';

const useStyles = makeStyles()(() => ({
  card: {
    width: '100%',
    cursor: 'pointer',
    maxWidth: '420px',
    overflow: 'visible',
    padding: '0 4px',
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
      height: '8px',
      backgroundColor: railColor,
      opacity: 0.1,
    },
    '& .MuiSlider-track': {
      height: '8px',
    },
    '& .MuiSlider-thumb': {
      height: 20,
      width: 20,
      backgroundColor: '#C1BBF6',
    },
  }),
);

const StyledSwitch = styled(Switch)((props) => ({
  padding: '9px 12px',
  right: `-12px`, // reposition towards right to negate switch padding
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#C1BBF6',
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#C1BBF6',
  },
  '& .MuiSwitch-track': {
    height: '20px',
    borderRadius: '9px',
  },
}));

const GasSlider = (props: {
  destinationGasDrop: number;
  disabled: boolean;
}) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { token: sourceToken, toChain: destChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { prices: tokenPrices } = useFetchTokenPricesV2();

  const destChainConfig = config.chains[destChain!];
  const sourceTokenConfig = config.tokens[sourceToken];
  const nativeGasToken = config.tokens[destChainConfig!.gasToken];

  const [isGasSliderOpen, setIsGasSliderOpen] = useState(!props.disabled);
  const [percentage, setPercentage] = useState(0);

  const [debouncedPercentage] = useDebounce(percentage, 500);

  const ThumbWithTokenIcon = (props: React.HTMLAttributes<unknown>) => {
    const { children, ...other } = props;
    return (
      <SliderThumb {...other}>
        {children}
        <TokenIcon icon={nativeGasToken.icon} height={16} />
      </SliderThumb>
    );
  };

  useEffect(() => {
    dispatch(setToNativeToken(debouncedPercentage / 100));
  }, [debouncedPercentage]);

  const nativeGasPrice = useMemo(() => {
    const tokenAmount = toFixedDecimals(
      props.destinationGasDrop?.toString() || '0',
      6,
    );
    const tokenPrice = calculateUSDPrice(
      props.destinationGasDrop,
      tokenPrices,
      nativeGasToken,
    );

    if (!destChain) return null;

    return (
      <Typography fontSize={14}>
        {`${tokenAmount} ${getDisplayName(
          sourceTokenConfig as TokenConfig,
          destChain,
        )} ${tokenPrice}`}
      </Typography>
    );
  }, [
    nativeGasToken,
    tokenPrices,
    props.destinationGasDrop,
    sourceTokenConfig,
    destChain,
  ]);

  // Checking required values
  if (!sourceTokenConfig || !destChainConfig || !nativeGasToken) {
    return <></>;
  }

  return (
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
                baseColor="#C1BBF6"
                railColor={theme.palette.background.default}
                step={1}
                min={0}
                max={100}
                valueLabelFormat={() => `${percentage}%`}
                valueLabelDisplay="auto"
                onChange={(e: any) => setPercentage(e.target.value)}
              />
              <div className={classes.amounts}>
                <Typography color={theme.palette.text.secondary} fontSize={14}>
                  Gas price
                </Typography>
                {nativeGasPrice}
              </div>
            </div>
          </div>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default GasSlider;
