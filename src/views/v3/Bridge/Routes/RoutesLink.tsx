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
        underline="none"
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: theme.palette.text.primary,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 700,
          transition: '0.2s',
          '&:hover': {
            color: theme.palette.text.secondary,
          },
        }}
        onClick={onClick}
      >
        View all routes
      </Link>
    </Box>
  );
}

export default React.memo(RoutesLink);
