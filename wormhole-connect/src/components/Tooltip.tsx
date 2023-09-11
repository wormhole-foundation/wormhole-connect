import * as React from 'react';
import { makeStyles } from 'tss-react/mui';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from 'icons/Info';
import { CENTER } from 'utils/style';

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

const useStyles = makeStyles()(() => ({
  icon: {
    height: '16px',
    cursor: 'pointer',
  },
  clickArea: {
    width: '40px',
    height: '40px',
    ...CENTER,
  },
}));

type Props = {
  text: string;
  position?: Position;
};

export default function BasicTooltip(props: Props) {
  const position = props.position || 'top';
  const { classes } = useStyles();
  return (
    <Tooltip title={props.text} arrow placement={position}>
      <div className={classes.clickArea}>
        <InfoIcon className={classes.icon} />
      </div>
    </Tooltip>
  );
}
