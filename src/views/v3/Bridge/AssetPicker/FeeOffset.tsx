import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { amount as sdkAmount } from '@wormhole-foundation/sdk';

import type { RootState } from 'store';
import type { Token } from 'config/tokens';
import { calculateFeeOffset } from 'utils/fees';

type Props = {
  token?: Token;
};

/**
 * Displays the fee offset amount that will be added to ensure users receive
 * exactly what they requested after protocol fees are deducted
 */
function FeeOffset(props: Props) {
  const theme: any = useTheme();
  const { amount, route: selectedRoute } = useSelector(
    (state: RootState) => state.transferInput,
  );

  const feeOffsetAmount = calculateFeeOffset(
    selectedRoute,
    amount,
    props.token,
  );

  if (!feeOffsetAmount || sdkAmount.units(feeOffsetAmount) === 0n) {
    return null;
  }

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
      <Typography
        color={theme.palette.text.secondary}
        fontSize="12px"
        lineHeight="14px"
        height={'14px'}
      >
        +{sdkAmount.display(feeOffsetAmount)} {props.token?.symbol}
      </Typography>
      <Tooltip title="Portal's fee is added on top of your input amount. Slippage may still apply.">
        <InfoOutlineIcon
          sx={{
            height: '14px',
            width: '14px',
            color: theme.palette.text.secondary,
            marginLeft: '4px',
          }}
        />
      </Tooltip>
    </Box>
  );
}

export default React.memo(FeeOffset);
