import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import config from 'config';
import type { RootState } from 'store';
import { calculateFeeOffset } from 'utils/fees';
import { useGetTokens } from 'hooks/useGetTokens';

/**
 * Displays the fee offset amount that will be added to ensure users receive
 * exactly what they requested after protocol fees are deducted
 */
function FeeOffset() {
  const theme: any = useTheme();
  const { amount, route: selectedRoute } = useSelector(
    (state: RootState) => state.transferInput,
  );

  // Get both source and destination tokens from the store
  const { sourceToken, destToken } = useGetTokens();

  // Recalculate only when selectedRoute, amount or tokens change
  const feeOffsetAmount = useMemo(
    () => calculateFeeOffset(selectedRoute, amount, sourceToken, destToken),
    [selectedRoute, amount, sourceToken, destToken],
  );

  const feeDisplay = useMemo(() => {
    if (
      !config.ui?.experimental?.feeOffsetting ||
      !feeOffsetAmount ||
      sdkAmount.units(feeOffsetAmount) === 0n
    ) {
      return null;
    }

    return (
      <>
        <Typography
          color={theme.palette.text.secondary}
          fontSize="12px"
          lineHeight="14px"
          height={'14px'}
        >
          +{sdkAmount.display(feeOffsetAmount)} {sourceToken?.symbol}
        </Typography>
        <Tooltip title="Portal's fee is added on top of your input amount.">
          <InfoOutlineIcon
            sx={{
              height: '14px',
              width: '14px',
              color: theme.palette.text.secondary,
              marginLeft: '4px',
            }}
          />
        </Tooltip>
      </>
    );
  }, [feeOffsetAmount, sourceToken?.symbol, theme.palette.text.secondary]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        position: 'relative',
        height: '14px',
        bottom: '4px',
        marginBottom: '2px',
      }}
    >
      {feeDisplay}
    </Box>
  );
}

export default React.memo(FeeOffset);
