import { Collapse, Box, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import AlertIcon from 'icons/Alert';
import { OPACITY } from 'utils/style';

type Props = {
  show: boolean;
  content: React.ReactNode | undefined;
  warning?: boolean;
  error?: boolean;
  margin?: string;
  testId?: string;
};

function AlertBanner(props: Props) {
  const theme = useTheme();
  const styles = useMemo(() => ({
    base: {
      width: '100%',
      padding: '8px',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      borderRadius: '8px',
    },
    error: {
      backgroundColor: theme.palette.error.main + OPACITY[25],
    },
    warning: {
      backgroundColor: theme.palette.warning.main + OPACITY[25],
    },
  }), [theme]);

  return (
    <Collapse in={props.show && !!props.content} unmountOnExit>
      <Box
        sx={[
          styles.base,
          !!props.warning && styles.warning,
          !!props.error && styles.error,
        ]}
        style={{ margin: props.margin || 0 }}
        data-testid={props.testId}
      >
        <AlertIcon />
        {props.content}
      </Box>
    </Collapse>
  );
}

export default AlertBanner;
