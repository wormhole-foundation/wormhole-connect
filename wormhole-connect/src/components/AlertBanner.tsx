import { Collapse } from '@mui/material';
import React from 'react';
import { makeStyles } from 'tss-react/mui';
import AlertIcon from 'icons/Alert';
import { OPACITY, joinClass } from 'utils/style';

const useStyles = makeStyles()((theme: any) => ({
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
    backgroundColor: theme.palette.error[500] + OPACITY[25],
  },
  warning: {
    backgroundColor: theme.palette.warning[500] + OPACITY[25],
  },
}));

type Props = {
  show: boolean;
  content: React.ReactNode | undefined;
  warning?: boolean;
  error?: boolean;
  margin?: string;
};

function AlertBanner(props: Props) {
  const { classes } = useStyles();

  return (
    <Collapse in={props.show && !!props.content} unmountOnExit>
      <div
        className={joinClass([
          classes.base,
          !!props.warning && classes.warning,
          !!props.error && classes.error,
        ])}
        style={{ margin: props.margin || 0 }}
      >
        <AlertIcon />
        {props.content}
      </div>
    </Collapse>
  );
}

export default AlertBanner;
