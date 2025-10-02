import React from 'react';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';

interface RoutesLinkProps {
  onClick: () => void;
}

function RoutesLink({ onClick }: RoutesLinkProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Link
        component="span"
        data-testid="other-routes-toggle"
        role="button"
        aria-label="View all routes"
        underline="none"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: theme.palette.text.primary,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 700,
        }}
        onClick={onClick}
      >
        View all routes
      </Link>
    </Box>
  );
}

export default React.memo(RoutesLink);
