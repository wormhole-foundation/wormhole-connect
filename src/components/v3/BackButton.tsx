import React from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { IconButton, useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { type Route, setRoute } from 'store/router';

export function BackButton({ route }: { route: Route }) {
  const theme: any = useTheme();
  const dispatch = useDispatch();
  return (
    <IconButton
      onClick={() => dispatch(setRoute(route))}
      sx={{
        mr: 1,
        border: '1px solid ' + theme.palette.input.border,
        color: theme.palette.text.primary,
        height: '40px',
        width: '40px',
        fontSize: '16px',
        '&:hover': {
          backgroundColor: theme.palette.formContainer.background,
        },
      }}
    >
      <ArrowBackRoundedIcon fontSize="inherit" />
    </IconButton>
  );
}
