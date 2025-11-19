import { Tooltip, Typography } from '@mui/material';
import React from 'react';

interface TokenPickerButtonContentProps {
  symbol: string;
  isSelectable: boolean;
}

function TokenPickerButtonContent({
  symbol,
  isSelectable,
}: TokenPickerButtonContentProps) {
  const content = (
    <Typography
      component="div"
      fontSize="16px"
      fontWeight={500}
      maxWidth="64px"
      noWrap
    >
      {symbol || 'Select'}
    </Typography>
  );

  if (!isSelectable) {
    return content;
  }

  return <Tooltip title={symbol || 'Select a token'}>{content}</Tooltip>;
}

export default TokenPickerButtonContent;
