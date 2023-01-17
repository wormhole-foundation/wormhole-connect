import * as React from 'react';
import { makeStyles } from '@mui/styles';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '../icons/info.svg';

type Position =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'left-start'
  | 'left'
  | 'left-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end';

const useStyles = makeStyles(() => ({
  icon: {
    cursor: 'pointer',
  },
}));

type Props = {
  text: string;
  position?: Position;
};

export default function BasicTooltip(props: Props) {
  const position = props.position || 'top';
  const classes = useStyles();
  return (
    <Tooltip title={props.text} arrow placement={position}>
      <img className={classes.icon} src={InfoIcon} alt="info" />
    </Tooltip>
  );
}
