import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useDebounce } from 'use-debounce';

import { useTheme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { amount } from '@wormhole-foundation/sdk';

import config from 'config';
import { calculateUSDPrice } from 'utils';
import { RootState } from 'store';
import { setToNativeToken } from 'store/relay';
import { useTokens } from 'contexts/TokensContext';
import { opacify } from 'utils/theme';

const useStyles = makeStyles()((theme: any) => ({
  content: {
    width: '100%',
    cursor: 'pointer',
    maxWidth: '420px',
    overflow: 'visible',
    padding: '16px 20px',
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
    marginTop: '8px',
    width: '100%',
  },
  toggleButton: {
    backgroundColor: opacify(theme.palette.text.primary, 0.1),
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
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  padding: '9px 12px',
  right: `-9px`, // reposition towards right to negate switch padding
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
}));

const GasSlider = (props: {
  destinationGasDrop: amount.Amount;
  disabled: boolean;
}) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { toChain: destChain } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const { getTokenPrice, lastTokenPriceUpdate } = useTokens();

  const destChainConfig = config.chains[destChain!];
  const nativeGasToken = config.tokens.getGasToken(destChain!);

  const [isGasSliderOpen, setIsGasSliderOpen] = useState(false);
  const [percentage, setPercentage] = useState(0);

  const [debouncedPercentage] = useDebounce(percentage, 500);

  useEffect(() => {
    dispatch(setToNativeToken(debouncedPercentage / 100));
  }, [debouncedPercentage, dispatch]);

  const nativeGasPrice = useMemo(() => {
    if (!destChain || !nativeGasToken) {
      return null;
    }

    const tokenAmount = amount.display(
      amount.truncate(props.destinationGasDrop, 6),
    );

    const tokenPrice = calculateUSDPrice(
      getTokenPrice,
      props.destinationGasDrop,
      nativeGasToken,
    );
    const tokenPriceWithParanthesis = tokenPrice ? `(${tokenPrice})` : '';

    return (
      <Typography color={theme.palette.primary.main} fontSize={14}>
        {`+${tokenAmount} ${nativeGasToken.symbol} ${tokenPriceWithParanthesis}`}
      </Typography>
    );
    // We want to recompute the price after we update conversion rates (lastTokenPriceUpdate).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nativeGasToken,
    lastTokenPriceUpdate,
    props.destinationGasDrop,
    destChain,
  ]);

  // Checking required values
  if (!destChainConfig || !nativeGasToken) {
    return <></>;
  }

  return (
    <div className={classes.content}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography>{`Need extra ${nativeGasToken.symbol} on ${destChain}?`}</Typography>
        <StyledSwitch
          checked={isGasSliderOpen}
          disabled={props.disabled}
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
          <Stack>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={percentage.toString()}
              onChange={(e: any) => {
                const newPercentValue = Number(e.currentTarget.value);
                if (newPercentValue === percentage) {
                  // Unselect if user clicks on the same value
                  setPercentage(0);
                } else {
                  setPercentage(newPercentValue);
                }
              }}
            >
              <ToggleButton
                className={classes.toggleButton}
                disableRipple
                value="5"
              >
                5%
              </ToggleButton>
              <ToggleButton
                className={classes.toggleButton}
                disableRipple
                value="10"
              >
                10%
              </ToggleButton>
              <ToggleButton
                className={classes.toggleButton}
                disableRipple
                value="15"
              >
                15%
              </ToggleButton>
            </ToggleButtonGroup>
            <div className={classes.amounts}>
              <Stack alignItems="center" flexDirection="row">
                <Typography
                  color={theme.palette.text.secondary}
                  fontSize={14}
                  marginRight="4px"
                >
                  Gas amount
                </Typography>
                <Tooltip title="This additional gas is swapped from a percentage of your transfer amount.">
                  <InfoOutlinedIcon
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: '16px',
                    }}
                  />
                </Tooltip>
              </Stack>
              <Typography color={theme.palette.text.secondary} fontSize={14}>
                {nativeGasPrice}
              </Typography>
            </div>
          </Stack>
        </div>
      </Collapse>
    </div>
  );
};

export default GasSlider;
