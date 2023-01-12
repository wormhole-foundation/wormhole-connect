import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass, OPACITY } from '../utils/style';
import AlertIcon from '../icons/Alert';
import { Collapse } from '@mui/material';

const useStyles = makeStyles()((theme) => ({
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
  text: string;
  warning?: boolean;
  error?: boolean;
  margin?: string;
};

function AlertBanner(props: Props) {
  const { classes } = useStyles();

  return (
    <Collapse in={props.show}>
      <div
        className={joinClass([
          classes.base,
          !!props.warning && classes.warning,
          !!props.error && classes.error,
        ])}
        style={{ margin: props.margin || 0 }}
      >
        <AlertIcon />
        {props.text}
      </div>
    </Collapse>
  );
}

export default AlertBanner;
