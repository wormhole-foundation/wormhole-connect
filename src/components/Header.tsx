import React, { useMemo } from 'react';
import { useTheme, Box } from '@mui/material';

export type Alignment = 'center' | 'left' | 'right';

type Props = {
  text: string;
  align?: Alignment;
  size?: number;
  weight?: number;
  'data-testid'?: string;
};

function Header(props: Props) {
  const theme = useTheme();

  const titleStyle = useMemo(
    () => ({
      fontSize: `${props.size || 42}px`,
      width: '100%',
      textAlign: props.align || 'center',
      fontFamily: theme.typography.fontFamily,
      fontWeight: props.weight || 400,
      [theme.breakpoints.down('sm')]: {
        fontSize: '24px',
      },
    }),
    [theme, props.align, props.size, props.weight],
  );

  return (
    <Box sx={titleStyle} data-testid={props['data-testid']} component="h1">
      {props.text}
    </Box>
  );
}

export default Header;
