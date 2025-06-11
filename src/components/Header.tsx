import React, { useMemo } from 'react';
import { useTheme, Box } from '@mui/material';

export type Alignment = 'center' | 'left' | 'right';

type Props = {
  text: string;
  align?: Alignment;
  size?: number;
  testId?: string;
};

function Header(props: Props) {
  const theme = useTheme();

  const titleStyle = useMemo(
    () => ({
      fontSize: `${props.size || 42}px`,
      width: '100%',
      textAlign: props.align || 'center',
      fontFamily: theme.typography.fontFamily,
      [theme.breakpoints.down('sm')]: {
        fontSize: '24px',
      },
    }),
    [theme, props.align, props.size],
  );

  return (
    <Box sx={titleStyle} data-testid={props.testId}>
      {props.text}
    </Box>
  );
}

export default Header;
