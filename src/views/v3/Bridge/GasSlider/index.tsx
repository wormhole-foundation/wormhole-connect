import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { Stack, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Collapse from '@mui/material/Collapse';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { amount } from '@wormhole-foundation/sdk';

import config from 'config';
import { calculateUSDPrice } from 'utils';
import { RootState } from 'store';
import { useTokens } from 'contexts/TokensContext';
import Color from 'color';

const GasSlider = (props: {
  destinationGasDrop: amount.Amount;
  disabled: boolean;
  isExecutorRoute: boolean;
  isSelected: boolean;
  onGasChange: (value: number) => void;
}) => {
  const theme = useTheme();
  const styles = useMemo(
    () => ({
      content: {
        width: '100%',
        cursor: 'pointer',
        maxWidth: '372px',
        overflow: 'visible',
        padding: '16px 20px',
      },
      container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        width: '100%',
      },
      amounts: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        width: '100%',
      },
      toggleButton: {
        backgroundColor: Color(theme.palette.text.primary).alpha(0.1).hexa(),
        border: '1px solid transparent',
        borderRadius: '8px',
        '&.Mui-selected': {
          border: `1px solid ${theme.palette.primary.main}`,
          borderRadius: '8px',
        },
        '&.MuiToggleButtonGroup-middleButton': {
          margin: '0 2px',
        },
        '&.MuiToggleButtonGroup-lastButton': {
          margin: '0',
        },
      },
    }),
    [theme],
  );

  const {
    destinationGasDrop,
    disabled,
    isExecutorRoute,
    isSelected,
    onGasChange,
  } = props;

  const { toNativeToken } = useSelector((state: RootState) => ({
    ...state.relay,
  }));

  const { fromChain: sourceChain, toChain: destChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

  const destGasToken = config.tokens.getGasToken(destChain!);
  const sourceGasToken = config.tokens.getGasToken(sourceChain!);

  const [isGasSliderOpen, setIsGasSliderOpen] = useState(false);
  const [percentage, setPercentage] = useState(toNativeToken * 100);

  useEffect(() => {
    if (isSelected && destinationGasDrop.amount !== '0' && toNativeToken) {
      setIsGasSliderOpen(true);
    }
  }, [destinationGasDrop.amount, isSelected, toNativeToken]);

  useEffect(() => {
    if (!isSelected) {
      // When Route is not selected ensure that the gas slider is closed
      // and the percentage is set to 0.
      setIsGasSliderOpen(false);
      setPercentage(0);
    }
  }, [isSelected]);

  const nativeGasPrice = useMemo(() => {
    if (!destChain || !destGasToken) {
      return null;
    }

    const tokenAmount = amount.display(amount.truncate(destinationGasDrop, 6));

    const tokenPrice = calculateUSDPrice(
      getTokenPrice,
      destinationGasDrop,
      destGasToken,
    );
    const tokenPriceWithParanthesis = tokenPrice ? `(${tokenPrice})` : '';

    return `+${tokenAmount} ${destGasToken.symbol} ${tokenPriceWithParanthesis}`;
    // We want to recompute the price after we update conversion rates (lastTokenPriceUpdate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destGasToken, lastTokenPriceUpdate, destinationGasDrop, destChain]);

  const percentSelection = useMemo(
    () => (
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={percentage.toString()}
        onChange={(e: any) => {
          const newPercentValue = Number(e.currentTarget.value);
          setPercentage(newPercentValue);
          onGasChange(newPercentValue);
        }}
      >
        <ToggleButton sx={styles.toggleButton} disableRipple value="0.05">
          5%
        </ToggleButton>
        <ToggleButton sx={styles.toggleButton} disableRipple value="0.1">
          10%
        </ToggleButton>
        <ToggleButton sx={styles.toggleButton} disableRipple value="0.15">
          15%
        </ToggleButton>
      </ToggleButtonGroup>
    ),
    [percentage, styles.toggleButton, onGasChange],
  );

  // Checking required values
  if (!sourceGasToken || !destGasToken) {
    return <></>;
  }

  return (
    <Box sx={styles.content}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography>{`Need extra ${destGasToken.symbol} on ${destChain}?`}</Typography>
        <Switch
          sx={{
            padding: '9px 12px',
            right: '-9px',
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: theme.palette.primary.main,
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: theme.palette.primary.main,
            },
            '& .MuiSwitch-track': {
              height: '20px',
              borderRadius: '9px',
            },
          }}
          checked={isGasSliderOpen}
          disabled={disabled || !isSelected} // Disable switch if the route is not selected as well
          onClick={(e: any) => {
            const { checked } = e.target;

            setIsGasSliderOpen(checked);

            if (!checked) {
              setPercentage(0);
              onGasChange(0);
            } else if (isExecutorRoute) {
              // Gas slider becomes a binary switch for executor routes
              // If turned on, gas top-up is set to 100%
              setPercentage(100);
              onGasChange(1);
            }
          }}
        />
      </Stack>
      <Collapse in={isGasSliderOpen} unmountOnExit>
        <Box sx={styles.container}>
          <Stack>
            {!isExecutorRoute && percentSelection}
            <Box sx={styles.amounts}>
              <Stack alignItems="center" flexDirection="row">
                <Typography
                  color={theme.palette.text.secondary}
                  fontSize={14}
                  marginRight="4px"
                >
                  Gas amount
                </Typography>
                <Tooltip
                  title={
                    isExecutorRoute
                      ? `Add a small amount of ${sourceGasToken.symbol} to your transaction to receive ${nativeGasPrice} on ${destChain}.`
                      : 'This additional gas is swapped from a percentage of your transfer amount.'
                  }
                >
                  <InfoOutlinedIcon
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '16px',
                    }}
                  />
                </Tooltip>
              </Stack>
              <Typography color={theme.palette.primary.main} fontSize={14}>
                {nativeGasPrice}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default GasSlider;
