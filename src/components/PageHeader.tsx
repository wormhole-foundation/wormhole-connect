import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { setRoute } from 'store/router';

import Header, { Alignment } from './Header';
import DownIcon from 'icons/Down';

type PageHeaderProps = {
  title: string;
  align?: Alignment;
  description?: string;
  back?: boolean;
  testId?: string;
};

function PageHeader({
  back,
  title,
  align = 'left',
  description,
  testId,
}: PageHeaderProps) {
  const theme = useTheme();
  const dispatch = useDispatch();

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
      arrowBack: {
        transform: 'rotate(90deg)',
        marginRight: '16px',
        cursor: 'pointer',
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

  function goBack() {
    dispatch(setRoute('bridge'));
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Box sx={styles.left}>
          {back && (
            <DownIcon sx={styles.arrowBack} fontSize="large" onClick={goBack} />
          )}
          <Header text={title} align={align} testId={testId} />
        </Box>
      </Box>
      {description && <Box sx={styles.description}>{description}</Box>}
    </Box>
  );
}

export default PageHeader;
