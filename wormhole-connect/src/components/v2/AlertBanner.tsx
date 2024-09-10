import React, { CSSProperties } from 'react';
import { Collapse, Typography, useTheme } from '@mui/material';
import ErrorIcon from '@mui/icons-material/ErrorOutline';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme: any) => ({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: '8px',
  },
}));

type Props = {
  show: boolean;
  content: React.ReactNode | undefined;
  warning?: boolean;
  error?: boolean;
  style?: CSSProperties;
  testId?: string;
  className?: string;
};

function AlertBanner(props: Props) {
  const { classes } = useStyles();
  const theme = useTheme();

  let themeColor;

  if (props.warning) {
    themeColor = theme.palette.warning.main;
  } else if (props.error) {
    themeColor = theme.palette.error.main;
  }

  return (
    <Collapse
      className={props.className}
      in={props.show && !!props.content}
      unmountOnExit
    >
      <div
        className={classes.container}
        style={props.style || {}}
        data-testid={props.testId}
      >
        {
          <ErrorIcon
            fontSize="small"
            htmlColor={themeColor}
            sx={{ paddingTop: '2px' }}
          />
        }
        <Typography color={themeColor} fontSize={14}>
          {props.content}
        </Typography>
      </div>
    </Collapse>
  );
}

export default AlertBanner;
