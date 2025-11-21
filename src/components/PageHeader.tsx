import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

import type { Alignment } from './Header';
import Header from './Header';

type PageHeaderProps = {
  title: string;
  align?: Alignment;
  description?: string;
};

function PageHeader({ title, align = 'left', description }: PageHeaderProps) {
  const theme = useTheme();

  const styles = useMemo(
    () => ({
      container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        marginBottom: '0px',
        [theme.breakpoints.down('sm')]: {
          marginBottom: '20px',
        },
      },
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },
      left: {
        display: 'flex',
        flexGrow: 1,
        alignItems: 'center',
        textAlign: align,
      },
      description: {
        fontWeight: '300',
        fontSize: '14px',
        opacity: '0.6',
        marginBottom: '40px',
      },
    }),
    [theme, align],
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Box sx={styles.left}>
          <Header text={title} align={align} />
        </Box>
      </Box>
      {description && <Box sx={styles.description}>{description}</Box>}
    </Box>
  );
}

export default PageHeader;
