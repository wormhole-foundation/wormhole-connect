import React, { useEffect, useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass, OPACITY } from '../utils/style';
import AlertIcon from '../icons/Alert';
import { Collapse } from '@mui/material';
import { usePrevious } from '../utils';

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
  content: React.ReactNode | undefined;
  warning?: boolean;
  error?: boolean;
  margin?: string;
};

function AlertBanner(props: Props) {
  const { classes } = useStyles();
  const [alertContent, setAlertContent] = useState(props.content);
  const prevText = usePrevious(props.content);

  useEffect(() => {
    if (!!prevText && !props.content) {
      setTimeout(() => {
        setAlertContent(undefined);
      }, 500);
    } else {
      setAlertContent(props.content);
    }
  }, [props.content]);

  return (
    <Collapse in={props.show && !!props.content}>
      <div
        className={joinClass([
          classes.base,
          !!props.warning && classes.warning,
          !!props.error && classes.error,
        ])}
        style={{ margin: props.margin || 0 }}
      >
        <AlertIcon />
        {alertContent}
      </div>
    </Collapse>
  );
}

export default AlertBanner;
