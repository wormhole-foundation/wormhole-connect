import React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import RoutingIcon from 'icons/Routing';

const RoutesLink = ({
  providerText,
  onClick,
}: {
  providerText?: string | React.JSX.Element;
  onClick: () => void;
}) => {
  const theme: any = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <RoutingIcon sx={{ color: theme.palette.text.primary, opacity: 0.5 }} />
      <Link
        component="span"
        data-testid="other-routes-toggle"
        underline="none"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: theme.palette.text.primary,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 700,
          opacity: 0.5,
        }}
        onClick={onClick}
      >
        {providerText}
        <ChevronRightIcon fontSize="small" sx={{ marginLeft: '4px' }} />
      </Link>
    </Box>
  );
};

export default React.memo(RoutesLink);
