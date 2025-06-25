import React, { CSSProperties, useMemo } from 'react';
import { Collapse, Typography, useTheme, SxProps, Box } from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

type Props = {
  show: boolean;
  content: React.ReactNode | undefined;
  warning?: boolean;
  error?: boolean;
  style?: CSSProperties;
  testId?: string;
  color?: string;
  sx?: SxProps;
  className?: string;
};

function AlertBanner(props: Props) {
  const theme = useTheme();
  const styles = useMemo(
    () => ({
      container: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: '8px',
      },
    }),
    [],
  );

  let themeColor;

  if (props.color) {
    themeColor = props.color;
  } else if (props.warning) {
    themeColor = theme.palette.warning.main;
  } else if (props.error) {
    themeColor = theme.palette.error.main;
  }

  return (
    <Collapse
      className={props.className}
      sx={props.sx}
      in={props.show && !!props.content}
      unmountOnExit
    >
      <Box
        sx={styles.container}
        style={props.style || {}}
        data-testid={props.testId}
      >
        <ReportProblemOutlinedIcon fontSize="small" htmlColor={themeColor} />
        <Typography color={themeColor} fontSize={14} fontWeight={700}>
          {props.content}
        </Typography>
      </Box>
    </Collapse>
  );
}

export default AlertBanner;
